"""-- Supabase Schema for Value Lab - V2 (Multi-tenant & Auth)

-- 1. Organizations (Tenants)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subscription_tier text not null default 'basic',
  created_at timestamptz not null default now()
);

-- 2. User Roles
create type user_role as enum ('admin', 'advisor', 'client');

-- 3. Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  parent_id uuid references users(id) on delete set null, -- For hierarchical permissions
  role user_role not null default 'client',
  email text not null unique,
  name text,
  email_verified timestamptz,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Next-Auth Tables
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  constraint uq_provider_account unique (provider, provider_account_id)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  constraint uq_identifier_token unique (identifier, token)
);

-- 5. Modify fund_prices to be multi-tenant
alter table fund_prices
add column if not exists organization_id uuid references organizations(id) on delete cascade;

-- 6. Audit Logs
create table if not exists audit_logs (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  organization_id uuid references organizations(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- 7. Indexes for Performance
create index if not exists users_organization_id_idx on users (organization_id);
create index if not exists users_parent_id_idx on users (parent_id);
create index if not exists accounts_user_id_idx on accounts (user_id);
create index if not exists sessions_user_id_idx on sessions (user_id);
create index if not exists fund_prices_organization_id_idx on fund_prices (organization_id);
create index if not exists audit_logs_user_id_idx on audit_logs (user_id);
create index if not exists audit_logs_organization_id_idx on audit_logs (organization_id);


-- RLS Policies (Row Level Security)
-- Enable RLS for all relevant tables
alter table organizations enable row level security;
alter table users enable row level security;
alter table fund_prices enable row level security;
alter table audit_logs enable row level security;

-- Policy: Users can only see their own organization
create policy "select_own_organization" on organizations
for select using (id = (select organization_id from users where id = auth.uid()));

-- Policy: Users can only see other users within their own organization
create policy "select_users_in_own_organization" on users
for select using (organization_id = (select organization_id from users where id = auth.uid()));

-- Policy: Users can only see fund_prices associated with their organization
create policy "select_fund_prices_for_own_organization" on fund_prices
for select using (organization_id = (select organization_id from users where id = auth.uid()));

-- Policy: Users can only insert fund_prices for their own organization
create policy "insert_fund_prices_for_own_organization" on fund_prices
for insert with check (organization_id = (select organization_id from users where id = auth.uid()));

-- Policy: Users can only see their own audit logs
create policy "select_own_audit_logs" on audit_logs
for select using (organization_id = (select organization_id from users where id = auth.uid()));

-- Policy: Users can only insert audit logs for their own organization
create policy "insert_own_audit_logs" on audit_logs
for insert with check (organization_id = (select organization_id from users where id = auth.uid()));
""
