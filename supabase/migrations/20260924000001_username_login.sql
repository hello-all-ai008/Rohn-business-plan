-- Login aliases are private. No password or token is stored here.
create table public.rohn_login_accounts (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z][A-Za-z0-9_-]{2,31}$'),
  login_email text not null unique,
  created_at timestamptz not null default now()
);
create unique index rohn_login_accounts_username_ci on public.rohn_login_accounts (lower(username));
alter table public.rohn_login_accounts enable row level security;
create policy rohn_login_owner_read on public.rohn_login_accounts for select to authenticated using (owner_id = (select auth.uid()));
create policy rohn_login_rename on public.rohn_login_accounts for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
-- The Edge Function resolves usernames privately. Anonymous users cannot query this table.
grant select(username, owner_id) on public.rohn_login_accounts to authenticated;
grant update(username) on public.rohn_login_accounts to authenticated;
-- Supabase Auth can have unrelated users. Restrict business data to provisioned accounts.
create policy rohn_clients_provisioned on public.rohn_clients as restrictive for all to authenticated
  using (exists (select 1 from public.rohn_login_accounts a where a.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.rohn_login_accounts a where a.owner_id = (select auth.uid())));
create policy rohn_quotes_provisioned on public.rohn_quotes as restrictive for all to authenticated
  using (exists (select 1 from public.rohn_login_accounts a where a.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.rohn_login_accounts a where a.owner_id = (select auth.uid())));
create policy rohn_items_provisioned on public.rohn_quote_items as restrictive for all to authenticated
  using (exists (select 1 from public.rohn_login_accounts a where a.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.rohn_login_accounts a where a.owner_id = (select auth.uid())));
create policy rohn_internal_provisioned on public.rohn_quote_internal as restrictive for all to authenticated
  using (exists (select 1 from public.rohn_login_accounts a where a.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.rohn_login_accounts a where a.owner_id = (select auth.uid())));
