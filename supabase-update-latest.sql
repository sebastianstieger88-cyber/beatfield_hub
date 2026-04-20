create extension if not exists pgcrypto;

create table if not exists public.trainer_directory (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  linked_user_id uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.invite_codes
  add column if not exists invited_email text;

alter table public.invite_codes
  add column if not exists trainer_directory_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'invite_codes_trainer_directory_id_fkey'
  ) then
    alter table public.invite_codes
      add constraint invite_codes_trainer_directory_id_fkey
      foreign key (trainer_directory_id)
      references public.trainer_directory(id)
      on delete set null;
  end if;
end
$$;

alter table public.courses
  add column if not exists trainer_directory_id uuid references public.trainer_directory(id) on delete set null;

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'geplant' check (status in ('geplant', 'aktiv', 'abgeschlossen')),
  created_at timestamptz not null default now()
);

create table if not exists public.season_bookings (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  full_name text not null,
  phone text,
  package_type text not null check (package_type in ('1x TRAIN', '2x BEAT', '3x REPEAT')),
  selected_days text[] not null,
  created_at timestamptz not null default now()
);

alter table public.participants
  add column if not exists season_id uuid references public.seasons(id) on delete cascade;

alter table public.participants
  add column if not exists season_booking_id uuid references public.season_bookings(id) on delete set null;

create table if not exists public.beat_out_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  season_booking_id uuid not null references public.season_bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, participant_id)
);

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
  invite_trainer_directory_id uuid;
  linked_trainer_directory_id uuid;
  profile_count integer;
begin
  select count(*) into profile_count from public.profiles;

  if profile_count = 0 then
    resolved_role := 'admin';
  elsif coalesce(new.raw_user_meta_data ->> 'invite_code', '') <> '' then
    select id, role, trainer_directory_id
    into invite_id, invite_role, invite_trainer_directory_id
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

  update public.trainer_directory
  set linked_user_id = new.id
  where id = (
    select id
    from public.trainer_directory
    where linked_user_id is null
      and (
        (invite_trainer_directory_id is not null and id = invite_trainer_directory_id)
        or (
          invite_trainer_directory_id is null
          and email is not null
          and lower(email) = lower(new.email)
        )
      )
    order by created_at desc
    limit 1
  )
  returning id into linked_trainer_directory_id;

  if linked_trainer_directory_id is not null then
    update public.courses
    set trainer_id = new.id
    where trainer_directory_id = linked_trainer_directory_id
      and trainer_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.trainer_directory enable row level security;
alter table public.seasons enable row level security;
alter table public.season_bookings enable row level security;
alter table public.beat_out_entries enable row level security;

drop policy if exists "authenticated can read trainer directory" on public.trainer_directory;
create policy "authenticated can read trainer directory"
on public.trainer_directory
for select
to authenticated
using (true);

drop policy if exists "admins manage trainer directory" on public.trainer_directory;
create policy "admins manage trainer directory"
on public.trainer_directory
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "authenticated can read seasons" on public.seasons;
create policy "authenticated can read seasons"
on public.seasons
for select
to authenticated
using (true);

drop policy if exists "admins manage seasons" on public.seasons;
create policy "admins manage seasons"
on public.seasons
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "authenticated can read season bookings" on public.season_bookings;
create policy "authenticated can read season bookings"
on public.season_bookings
for select
to authenticated
using (true);

drop policy if exists "admins manage season bookings" on public.season_bookings;
create policy "admins manage season bookings"
on public.season_bookings
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "beat outs visible to course owners" on public.beat_out_entries;
create policy "beat outs visible to course owners"
on public.beat_out_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions
    join public.courses on courses.id = attendance_sessions.course_id
    where attendance_sessions.id = beat_out_entries.session_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

drop policy if exists "beat outs managed by course owners" on public.beat_out_entries;
create policy "beat outs managed by course owners"
on public.beat_out_entries
for all
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions
    join public.courses on courses.id = attendance_sessions.course_id
    where attendance_sessions.id = beat_out_entries.session_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.attendance_sessions
    join public.courses on courses.id = attendance_sessions.course_id
    where attendance_sessions.id = beat_out_entries.session_id
      and (courses.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);
