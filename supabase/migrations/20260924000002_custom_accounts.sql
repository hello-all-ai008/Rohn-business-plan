-- Custom ROHN accounts. Passwords are bcrypt hashes; only the server can inspect them.
create table public.rohn_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null check (username ~ '^[A-Za-z][A-Za-z0-9_-]{2,31}$'),
  password_hash text not null,
  role text not null check (role in ('admin','developer')),
  created_at timestamptz not null default now()
);
create unique index rohn_accounts_username_ci on public.rohn_accounts(lower(username));
create table public.rohn_sessions (
  token_hash text primary key,
  account_id uuid not null references public.rohn_accounts(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index rohn_sessions_account_idx on public.rohn_sessions(account_id);
create index rohn_sessions_expiry_idx on public.rohn_sessions(expires_at);
alter table public.rohn_accounts enable row level security;
alter table public.rohn_sessions enable row level security;
revoke all on public.rohn_accounts, public.rohn_sessions from anon, authenticated;
grant select, insert, update, delete on public.rohn_accounts, public.rohn_sessions to service_role;

-- These functions run only with the server's secret key, never the browser's key.
create function public.rohn_verify_password(p_username text, p_password text)
returns table(id uuid, username text, role text)
language sql security invoker set search_path = '' as $$
  select a.id,a.username,a.role from public.rohn_accounts a
  where lower(a.username)=lower(p_username)
    and a.password_hash=extensions.crypt(p_password,a.password_hash)
$$;
create function public.rohn_update_password(p_account uuid, p_current text, p_next text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if length(p_next)<12 or length(p_next)>256 then return false; end if;
  update public.rohn_accounts a
     set password_hash=extensions.crypt(p_next,extensions.gen_salt('bf',12))
   where a.id=p_account and a.password_hash=extensions.crypt(p_current,a.password_hash);
  return found;
end;
$$;
revoke all on function public.rohn_verify_password(text,text), public.rohn_update_password(uuid,text,text) from public, anon, authenticated;
grant execute on function public.rohn_verify_password(text,text), public.rohn_update_password(uuid,text,text) to service_role;

-- No direct browser access to business tables with custom accounts.
do $$ declare t text; p record; begin
  foreach t in array array['rohn_clients','rohn_quotes','rohn_quote_items','rohn_quote_internal'] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I',p.policyname,t);
    end loop;
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select, insert, update, delete on public.%I to service_role',t);
    execute format('alter table public.%I alter column owner_id drop default',t);
    execute format('alter table public.%I drop constraint %I',t,t||'_owner_id_fkey');
    execute format('alter table public.%I add constraint %I foreign key(owner_id) references public.rohn_accounts(id) on delete cascade',t,t||'_owner_id_fkey');
  end loop;
end $$;
drop table public.rohn_login_accounts;
