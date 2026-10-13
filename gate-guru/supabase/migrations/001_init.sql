-- Gate Guru: initial schema
-- Tables: airports, terminals, facilities, reports
-- Public (anon) can read airports/terminals/facilities and insert reports. Nothing else.

create extension if not exists pgcrypto;

-- Enums ---------------------------------------------------------------------

create type facility_category as enum (
  'restaurant', 'cafe', 'bar', 'lounge', 'shop', 'pharmacy',
  'restroom', 'charging', 'prayer_room', 'other'
);

create type facility_zone as enum ('landside', 'airside');

create type report_issue_type as enum ('closed', 'wrong_info', 'other');

-- Tables --------------------------------------------------------------------

create table airports (
  id uuid primary key default gen_random_uuid(),
  iata char(3) not null unique check (iata ~ '^[A-Z]{3}$'),
  name text not null,
  city text not null,
  country text not null,
  timezone text not null, -- IANA, e.g. 'America/Toronto'
  created_at timestamptz not null default now()
);

create table terminals (
  id uuid primary key default gen_random_uuid(),
  airport_id uuid not null references airports (id) on delete cascade,
  code text not null,       -- short label shown on chips, e.g. '1', '4', '2E'
  name text not null,       -- e.g. 'Terminal 1'
  sort_order int not null default 0,
  unique (airport_id, code)
);

create table facilities (
  id uuid primary key default gen_random_uuid(),
  airport_id uuid not null references airports (id) on delete cascade,
  terminal_id uuid not null references terminals (id) on delete cascade,
  name text not null,
  category facility_category not null,
  zone facility_zone not null,
  gate_area text,           -- e.g. 'Gates B1-B20'
  description text,
  -- {"mon":[{"open":"05:00","close":"22:00"}], ...} local time; null = unknown
  opening_hours jsonb,
  access_info text,         -- lounges: 'Priority Pass, Amex Platinum'
  url text,
  last_verified_at timestamptz, -- null = unverified
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (airport_id, slug),
  check (opening_hours is null or jsonb_typeof(opening_hours) = 'object')
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities (id) on delete cascade,
  issue_type report_issue_type not null,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

-- Indexes -------------------------------------------------------------------

create index facilities_filter_idx
  on facilities (airport_id, terminal_id, zone, category);
create index terminals_airport_idx on terminals (airport_id, sort_order);
create index reports_facility_idx on reports (facility_id, created_at desc);

-- Keep updated_at fresh -----------------------------------------------------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger facilities_set_updated_at
  before update on facilities
  for each row execute function set_updated_at();

-- Row Level Security --------------------------------------------------------

alter table airports enable row level security;
alter table terminals enable row level security;
alter table facilities enable row level security;
alter table reports enable row level security;

create policy "Public read airports" on airports
  for select to anon, authenticated using (true);

create policy "Public read terminals" on terminals
  for select to anon, authenticated using (true);

create policy "Public read facilities" on facilities
  for select to anon, authenticated using (true);

create policy "Public insert reports" on reports
  for insert to anon, authenticated with check (true);

-- Table privileges: Supabase grants broad defaults to anon/authenticated;
-- narrow them so RLS is not the only line of defence.
revoke all on airports, terminals, facilities, reports from anon, authenticated;
grant select on airports, terminals, facilities to anon, authenticated;
grant insert on reports to anon, authenticated;
