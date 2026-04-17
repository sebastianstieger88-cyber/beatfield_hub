create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'pending' check (role in ('admin', 'trainer', 'pending')),
  created_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  role text not null default 'trainer' check (role in ('admin', 'trainer')),
  active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  used_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  weekday text not null,
  time text,
  trainer_id uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.trial_requests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  status text not null default 'angefragt' check (status in ('angefragt', 'gebucht', 'teilgenommen', 'konvertiert', 'abgesagt')),
  notes text,
  converted_participant_id uuid references public.participants(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  session_date date not null,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  unique (course_id, session_date)
);

create table if not exists public.attendance_records (
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  present boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (session_id, participant_id)
);

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role
  from public.profiles
  where user_id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role text := 'pending';
  invite_role text;
  invite_id uuid;
  profile_count integer;
begin
  select count(*) into profile_count from public.profiles;

  if profile_count = 0 then
    resolved_role := 'admin';
  elsif coalesce(new.raw_user_meta_data ->> 'invite_code', '') <> '' then
    select id, role
    into invite_id, invite_role
    from public.invite_codes
    where code = new.raw_user_meta_data ->> 'invite_code'
      and active = true
      and used_by is null
    limit 1;

    if invite_id is not null then
      resolved_role := invite_role;
    end if;
  end if;

  insert into public.profiles (user_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    resolved_role
  );

  if invite_id is not null then
    update public.invite_codes
    set active = false,
        used_by = new.id,
        used_at = now()
    where id = invite_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;
alter table public.courses enable row level security;
alter table public.participants enable row level security;
alter table public.trial_requests enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

create policy "profiles select own or admin"
on public.profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
);

create policy "authenticated can read staff profiles"
on public.profiles
for select
to authenticated
using (role in ('admin', 'trainer'));

create policy "admin manage profiles"
on public.profiles
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admin manage invite codes"
on public.invite_codes
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admins see all courses"
on public.courses
for select
to authenticated
using (public.current_user_role() = 'admin');

create policy "trainers see assigned courses"
on public.courses
for select
to authenticated
using (trainer_id = auth.uid());

create policy "admins manage courses"
on public.courses
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "participants visible to course owners"
on public.participants
for select
to authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = participants.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

create policy "participants managed by course owners"
on public.participants
for all
to authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = participants.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.courses
    where courses.id = participants.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

create policy "trials visible to course owners"
on public.trial_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = trial_requests.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

create policy "trials managed by course owners"
on public.trial_requests
for all
to authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = trial_requests.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.courses
    where courses.id = trial_requests.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

create policy "sessions visible to course owners"
on public.attendance_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = attendance_sessions.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

create policy "sessions managed by course owners"
on public.attendance_sessions
for all
to authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = attendance_sessions.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.courses
    where courses.id = attendance_sessions.course_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

create policy "records visible to course owners"
on public.attendance_records
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions
    join public.courses on courses.id = attendance_sessions.course_id
    where attendance_sessions.id = attendance_records.session_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

create policy "records managed by course owners"
on public.attendance_records
for all
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions
    join public.courses on courses.id = attendance_sessions.course_id
    where attendance_sessions.id = attendance_records.session_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.attendance_sessions
    join public.courses on courses.id = attendance_sessions.course_id
    where attendance_sessions.id = attendance_records.session_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);
