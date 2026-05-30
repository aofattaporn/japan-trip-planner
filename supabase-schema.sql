-- Run this in your Supabase SQL editor
-- https://supabase.com/dashboard/project/pqdzhwhdarhlvujbqniu/sql/new

-- Trips
create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz default now()
);

-- Days (auto-generated from trip date range by the app)
create table if not exists days (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid references trips(id) on delete cascade,
  date           date not null,
  active_plan_id uuid  -- FK added below after plans table exists
);

-- Plans per day
create table if not exists plans (
  id      uuid primary key default gen_random_uuid(),
  day_id  uuid references days(id) on delete cascade,
  name    text not null
);

-- Circular FK: days.active_plan_id → plans (deferrable so we can insert day → plan → update day atomically)
alter table days
  add constraint days_active_plan_id_fkey
  foreign key (active_plan_id) references plans(id)
  on delete set null
  deferrable initially deferred;

-- Activities per plan
create table if not exists activities (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid references plans(id) on delete cascade,
  title       text not null,
  time        time,
  type        text check (type in ('restaurant','attraction','hotel','transport','other')),
  note        text,
  price_jpy   numeric,
  lat         double precision,
  lng         double precision,
  photo_url   text,
  created_at  timestamptz default now()
);

-- RLS: this app has no auth — allow anon read/write on all tables
alter table trips     enable row level security;
alter table days      enable row level security;
alter table plans     enable row level security;
alter table activities enable row level security;

create policy "anon all" on trips      for all to anon using (true) with check (true);
create policy "anon all" on days       for all to anon using (true) with check (true);
create policy "anon all" on plans      for all to anon using (true) with check (true);
create policy "anon all" on activities for all to anon using (true) with check (true);
