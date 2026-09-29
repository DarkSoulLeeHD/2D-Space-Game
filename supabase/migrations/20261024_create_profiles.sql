-- Supabase Migration: 20261024_create_profiles.sql
-- Table: public.profiles (Cloud Save & RLS Protected Progression)

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  callsign text default 'Vance',
  credits integer default 500,
  nanites integer default 0,
  chrono_crystals integer default 0,
  high_score integer default 0,
  inventory jsonb default '[]'::jsonb,
  gemini_api_key text default '',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policy: Users can select only their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Policy: Users can update only their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Function to handle new user registration from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, callsign, credits, nanites, chrono_crystals, high_score, inventory, gemini_api_key)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'callsign', 'Vance'),
    500,
    0,
    0,
    0,
    '[]'::jsonb,
    ''
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger to automatically create profile on sign up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
