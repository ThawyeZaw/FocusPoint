-- FocusPoint Supabase setup
-- Run this once in the Supabase Dashboard SQL Editor.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  academic_level text not null default 'A-Level',
  exam_session text,
  study_goal text,
  weekly_study_hours integer check (weekly_study_hours is null or weekly_study_hours between 0 and 80),
  onboarding_completed boolean not null default false,
  onboarding_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  academic_level text not null default 'A-Level',
  exam_sittings jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{"rowMethod":true,"focusMethod":true,"accentColor":"#6366f1"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id text,
  title text not null,
  curriculum text not null default 'Custom',
  structure_type text not null default 'custom',
  color text not null default '#6366f1',
  weighting numeric not null default 1,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.study_courses(id) on delete cascade,
  paper text not null,
  date date not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.study_courses(id) on delete set null,
  subject_name text,
  title text not null,
  category text not null default 'study',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_all_day boolean not null default false,
  kind text not null default 'event',
  completed_dates date[] not null default '{}',
  linked_topic_id text,
  repeat text not null default 'none',
  repeat_until date,
  notes text not null default '',
  system_seed boolean not null default false,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.study_courses(id) on delete cascade,
  topic_id text,
  name text not null,
  type text not null default 'other',
  size bigint not null default 0,
  uploaded_at timestamptz not null default now(),
  storage_path text,
  url text not null default '#',
  created_at timestamptz not null default now()
);

create index if not exists study_courses_user_id_idx on public.study_courses(user_id);
create index if not exists exams_user_id_idx on public.exams(user_id);
create index if not exists timetable_entries_user_id_idx on public.timetable_entries(user_id);
create index if not exists resources_user_id_idx on public.resources(user_id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.study_courses enable row level security;
alter table public.exams enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.resources enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.user_settings from anon;
revoke all on table public.study_courses from anon;
revoke all on table public.exams from anon;
revoke all on table public.timetable_entries from anon;
revoke all on table public.resources from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_settings to authenticated;
grant select, insert, update, delete on table public.study_courses to authenticated;
grant select, insert, update, delete on table public.exams to authenticated;
grant select, insert, update, delete on table public.timetable_entries to authenticated;
grant select, insert, update, delete on table public.resources to authenticated;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.user_settings to service_role;
grant select, insert, update, delete on table public.study_courses to service_role;
grant select, insert, update, delete on table public.exams to service_role;
grant select, insert, update, delete on table public.timetable_entries to service_role;
grant select, insert, update, delete on table public.resources to service_role;

drop policy if exists "Profiles are selectable by owner" on public.profiles;
create policy "Profiles are selectable by owner"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "User settings are owned by user" on public.user_settings;
create policy "User settings are owned by user"
on public.user_settings for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Study courses are owned by user" on public.study_courses;
create policy "Study courses are owned by user"
on public.study_courses for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Exams are owned by user" on public.exams;
create policy "Exams are owned by user"
on public.exams for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Timetable entries are owned by user" on public.timetable_entries;
create policy "Timetable entries are owned by user"
on public.timetable_entries for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Resources are owned by user" on public.resources;
create policy "Resources are owned by user"
on public.resources for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
