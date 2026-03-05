-- SpineOS Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Cases table: stores spine surgery cases per user
create table if not exists cases (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  patient_name text default '',
  procedure_date date,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Training signals table: stores AI feedback/learning signals
create table if not exists training_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Indexes for fast queries
create index if not exists idx_cases_user_id on cases(user_id);
create index if not exists idx_training_signals_user_id on training_signals(user_id);

-- Row Level Security: users can only access their own data
alter table cases enable row level security;
alter table training_signals enable row level security;

create policy "Users can read own cases"
  on cases for select using (auth.uid() = user_id);

create policy "Users can insert own cases"
  on cases for insert with check (auth.uid() = user_id);

create policy "Users can update own cases"
  on cases for update using (auth.uid() = user_id);

create policy "Users can delete own cases"
  on cases for delete using (auth.uid() = user_id);

create policy "Users can read own training signals"
  on training_signals for select using (auth.uid() = user_id);

create policy "Users can insert own training signals"
  on training_signals for insert with check (auth.uid() = user_id);
