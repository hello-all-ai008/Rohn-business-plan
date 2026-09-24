-- Dedicated ROHN quotation database. All records belong to their authenticated creator.
create extension if not exists pgcrypto;
create table public.rohn_clients (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (length(trim(name)) > 0), contact_name text not null default '', email text not null default '', phone text not null default '',
 address text not null default '', tax_id text not null default '', created_at timestamptz not null default now(),
 unique (id, owner_id)
);
create table public.rohn_quotes (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 client_id uuid, quote_no text not null, title text not null default 'ROHN Timing System',
 issue_date date not null default current_date, valid_until date, event_date date, status text not null default 'draft' check (status in ('draft','sent','accepted','rejected')),
 currency text not null default 'THB' check(currency = 'THB'), tax_percent numeric(5,2) not null default 0 check(tax_percent between 0 and 100),
 discount numeric(12,2) not null default 0 check(discount >= 0),
 public_terms text not null default '', public_note text not null default '',
 seller_name text not null default 'ROHN Timing System', seller_address text not null default '', seller_phone text not null default '', seller_email text not null default '', seller_tax_id text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_id, quote_no), unique(id, owner_id),
 foreign key(client_id,owner_id) references public.rohn_clients(id,owner_id) on delete restrict
);
create table public.rohn_quote_items (
 id uuid primary key default gen_random_uuid(), quote_id uuid not null, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 sort_order integer not null check(sort_order >= 0), title text not null check(length(trim(title)) > 0), description text not null default '',
 quantity numeric(12,2) not null default 1 check(quantity >= 0), unit text not null default 'งาน', unit_price numeric(12,2) not null default 0 check(unit_price >= 0),
 unique(quote_id,sort_order), foreign key(quote_id,owner_id) references public.rohn_quotes(id,owner_id) on delete cascade
);
create table public.rohn_quote_internal (
 quote_id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 rnd_percent numeric(5,2) not null default 15 check(rnd_percent between 0 and 100), team_members integer not null default 3 check(team_members between 1 and 100),
 estimated_cost numeric(12,2) not null default 0 check(estimated_cost >= 0), private_note text not null default '',
 foreign key(quote_id,owner_id) references public.rohn_quotes(id,owner_id) on delete cascade
);
create index rohn_quotes_owner_date_idx on public.rohn_quotes(owner_id,issue_date desc);
create index rohn_items_owner_quote_idx on public.rohn_quote_items(owner_id,quote_id);
create index rohn_clients_owner_idx on public.rohn_clients(owner_id);
create index rohn_internal_owner_idx on public.rohn_quote_internal(owner_id);

alter table public.rohn_clients enable row level security;
alter table public.rohn_quotes enable row level security;
alter table public.rohn_quote_items enable row level security;
alter table public.rohn_quote_internal enable row level security;
-- Explicitly scope every operation to its owner; composite foreign keys prevent linking other users' records.
create policy rohn_clients_select on public.rohn_clients for select to authenticated using (owner_id = (select auth.uid()));
create policy rohn_clients_insert on public.rohn_clients for insert to authenticated with check (owner_id = (select auth.uid()));
create policy rohn_clients_update on public.rohn_clients for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy rohn_clients_delete on public.rohn_clients for delete to authenticated using (owner_id = (select auth.uid()));
create policy rohn_quotes_select on public.rohn_quotes for select to authenticated using (owner_id = (select auth.uid()));
create policy rohn_quotes_insert on public.rohn_quotes for insert to authenticated with check (owner_id = (select auth.uid()));
create policy rohn_quotes_update on public.rohn_quotes for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy rohn_quotes_delete on public.rohn_quotes for delete to authenticated using (owner_id = (select auth.uid()));
create policy rohn_items_select on public.rohn_quote_items for select to authenticated using (owner_id = (select auth.uid()));
create policy rohn_items_insert on public.rohn_quote_items for insert to authenticated with check (owner_id = (select auth.uid()));
create policy rohn_items_update on public.rohn_quote_items for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy rohn_items_delete on public.rohn_quote_items for delete to authenticated using (owner_id = (select auth.uid()));
create policy rohn_internal_select on public.rohn_quote_internal for select to authenticated using (owner_id = (select auth.uid()));
create policy rohn_internal_insert on public.rohn_quote_internal for insert to authenticated with check (owner_id = (select auth.uid()));
create policy rohn_internal_update on public.rohn_quote_internal for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy rohn_internal_delete on public.rohn_quote_internal for delete to authenticated using (owner_id = (select auth.uid()));
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.rohn_clients,public.rohn_quotes,public.rohn_quote_items,public.rohn_quote_internal to authenticated;
