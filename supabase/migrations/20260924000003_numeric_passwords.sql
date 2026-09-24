-- Limit guesses for the shorter 8-digit PIN while keeping password hashes private.
create table public.rohn_login_attempts (
  username_key text primary key,
  failures integer not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);
alter table public.rohn_login_attempts enable row level security;
revoke all on public.rohn_login_attempts from anon, authenticated;
grant select, insert, update, delete on public.rohn_login_attempts to service_role;

create or replace function public.rohn_verify_password(p_username text, p_password text)
returns table(id uuid, username text, role text)
language plpgsql security invoker set search_path = '' as $$
declare
  key text := lower(p_username);
  attempts public.rohn_login_attempts%rowtype;
  account public.rohn_accounts%rowtype;
  count_failed integer;
begin
  -- Serialize attempts for a username, including when no attempt row exists yet.
  perform pg_catalog.pg_advisory_xact_lock(773182, pg_catalog.hashtext(key));
  select * into attempts from public.rohn_login_attempts
    where username_key = key for update;
  if attempts.locked_until > now() then return; end if;

  select * into account from public.rohn_accounts a
    where lower(a.username) = key;
  if found and account.password_hash = extensions.crypt(p_password, account.password_hash) then
    delete from public.rohn_login_attempts where username_key = key;
    return query select account.id, account.username, account.role;
    return;
  end if;

  count_failed := case when attempts.window_start > now() - interval '15 minutes'
    then coalesce(attempts.failures, 0) + 1 else 1 end;
  insert into public.rohn_login_attempts(username_key, failures, window_start, locked_until)
  values (key, count_failed,
          case when count_failed = 1 then now() else attempts.window_start end,
          case when count_failed >= 5 then now() + interval '15 minutes' else null end)
  on conflict (username_key) do update
    set failures = excluded.failures, window_start = excluded.window_start,
        locked_until = excluded.locked_until;
end;
$$;
revoke all on function public.rohn_verify_password(text,text) from public, anon, authenticated;
grant execute on function public.rohn_verify_password(text,text) to service_role;

create or replace function public.rohn_update_password(p_account uuid, p_current text, p_next text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_next !~ '^[0-9]{8}$' then return false; end if;
  update public.rohn_accounts a
     set password_hash = extensions.crypt(p_next, extensions.gen_salt('bf', 12))
   where a.id = p_account
     and a.password_hash = extensions.crypt(p_current, a.password_hash);
  return found;
end;
$$;
revoke all on function public.rohn_update_password(uuid,text,text) from public, anon, authenticated;
grant execute on function public.rohn_update_password(uuid,text,text) to service_role;
