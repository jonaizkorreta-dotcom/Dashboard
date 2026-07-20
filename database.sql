-- Run this in your Supabase SQL Editor

-- Create users table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  is_admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure unique name + last name combination
  unique(first_name, last_name)
);

-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create assignments table
create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  scope_hours numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- One user can have one assignment per project, if they need to update hours, we update this row
  unique(user_id, project_id)
);

-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.assignments enable row level security;

-- Policies (For MVP, we allow all access. In production, secure this.)
create policy "Allow all access on users" on public.users for all using (true);
create policy "Allow all access on projects" on public.projects for all using (true);
create policy "Allow all access on assignments" on public.assignments for all using (true);

-- UPGRADE SCRIPT (Run this if you already created the tables before)
-- alter table public.users add column if not exists is_admin boolean default false not null;
