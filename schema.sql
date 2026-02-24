-- Run this once in your Supabase project's SQL editor
-- Dashboard → SQL Editor → New query → paste → Run

create table if not exists public.competitions (
  session_id        text        primary key,
  competitors       jsonb       not null default '[]'::jsonb,
  course_time_config jsonb      not null default '{}'::jsonb,
  rounds            jsonb       not null default '[]'::jsonb,
  last_updated_by   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Row-level security (access is controlled by the app PIN, not Supabase auth)
alter table public.competitions enable row level security;

create policy "Allow full access"
  on public.competitions for all
  using (true) with check (true);

-- Enable real-time updates for this table
alter publication supabase_realtime add table public.competitions;
