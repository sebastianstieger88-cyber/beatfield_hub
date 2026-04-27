-- Basis und Rollenfunktion
create extension if not exists pgcrypto;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = auth.uid()
  limit 1
$$;

create or replace function public.user_owns_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses
    left join public.trainer_directory on trainer_directory.id = courses.trainer_directory_id
    where courses.id = target_course_id
      and (
        public.current_user_role() = 'admin'
        or courses.trainer_id = auth.uid()
        or trainer_directory.linked_user_id = auth.uid()
      )
  )
$$;

create or replace function public.user_can_access_season(target_season_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.participants
      join public.courses on courses.id = participants.course_id
      left join public.trainer_directory on trainer_directory.id = courses.trainer_directory_id
      where participants.season_id = target_season_id
        and (
          courses.trainer_id = auth.uid()
          or trainer_directory.linked_user_id = auth.uid()
        )
    )
    or exists (
      select 1
      from public.attendance_sessions
      join public.courses on courses.id = attendance_sessions.course_id
      left join public.trainer_directory on trainer_directory.id = courses.trainer_directory_id
      where attendance_sessions.season_id = target_season_id
        and (
          courses.trainer_id = auth.uid()
          or trainer_directory.linked_user_id = auth.uid()
        )
    )
$$;

create or replace function public.user_can_access_season_booking(target_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.participants
      join public.courses on courses.id = participants.course_id
      left join public.trainer_directory on trainer_directory.id = courses.trainer_directory_id
      where participants.season_booking_id = target_booking_id
        and (
          courses.trainer_id = auth.uid()
          or trainer_directory.linked_user_id = auth.uid()
        )
    )
$$;

create or replace function public.user_can_access_trainer_directory(target_trainer_directory_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.trainer_directory
      where id = target_trainer_directory_id
        and linked_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.courses
      left join public.trainer_directory on trainer_directory.id = courses.trainer_directory_id
      where trainer_directory.id = target_trainer_directory_id
        and public.user_owns_course(courses.id)
    )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Trainerverzeichnis und manuelle Trainerzuordnung
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

-- Seasons, Buchungen und Teilnehmerverknuepfung
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

alter table public.season_bookings
  add column if not exists contact_status text not null default 'offen';

alter table public.season_bookings
  add column if not exists free_seasons_redeemed integer not null default 0;

alter table public.season_bookings
  add column if not exists start_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'season_bookings_contact_status_check'
  ) then
    alter table public.season_bookings
      add constraint season_bookings_contact_status_check
      check (contact_status in ('offen', 'kontaktiert', 'zugesagt', 'pausiert'));
  end if;
end
$$;

alter table public.participants
  add column if not exists season_id uuid references public.seasons(id) on delete cascade;

alter table public.participants
  add column if not exists season_booking_id uuid references public.season_bookings(id) on delete set null;

-- Session-, Trial- und Drop-In-Erweiterungen
create table if not exists public.beat_out_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  season_booking_id uuid not null references public.season_bookings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, participant_id)
);

alter table public.attendance_sessions
  add column if not exists season_id uuid references public.seasons(id) on delete cascade;

alter table public.trial_requests
  add column if not exists attendance_session_id uuid references public.attendance_sessions(id) on delete set null;

create table if not exists public.drop_in_bookings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  attendance_session_id uuid references public.attendance_sessions(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  status text not null default 'gebucht' check (status in ('gebucht', 'teilgenommen', 'abgesagt')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.drop_in_bookings
  add column if not exists archived_at timestamptz;

create table if not exists public.session_overrides (
  id uuid primary key default gen_random_uuid(),
  season_booking_id uuid not null references public.season_bookings(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  source_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  target_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (participant_id, source_session_id),
  unique (participant_id, target_session_id),
  constraint session_overrides_distinct_sessions check (source_session_id <> target_session_id)
);

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text not null unique,
  title text not null,
  category text,
  focus text,
  level text,
  equipment text,
  coaching_cues text,
  technique_cues text,
  progression text,
  regression text,
  common_errors text,
  correction text,
  variants text,
  description text,
  video_url text,
  source_url text,
  tags text[] not null default '{}',
  notion_last_edited_at timestamptz,
  notion_archived boolean not null default false,
  sync_source text not null default 'notion',
  raw_properties jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.finisher_library (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text not null unique,
  title text not null,
  category text,
  focus text,
  level text,
  equipment text,
  coaching_cues text,
  description text,
  video_url text,
  source_url text,
  tags text[] not null default '{}',
  notion_last_edited_at timestamptz,
  notion_archived boolean not null default false,
  sync_source text not null default 'notion',
  raw_properties jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.warmup_library (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text not null unique,
  title text not null,
  category text,
  focus text,
  level text,
  equipment text,
  coaching_cues text,
  description text,
  video_url text,
  source_url text,
  tags text[] not null default '{}',
  notion_last_edited_at timestamptz,
  notion_archived boolean not null default false,
  sync_source text not null default 'notion',
  raw_properties jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.campus_specials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null default 'application/pdf',
  file_size bigint,
  uploaded_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campus_specials_pdf_mime_type_check'
  ) then
    alter table public.campus_specials
      add constraint campus_specials_pdf_mime_type_check
      check (mime_type = 'application/pdf');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campus_specials_file_size_range_check'
  ) then
    alter table public.campus_specials
      add constraint campus_specials_file_size_range_check
      check (file_size is null or (file_size > 0 and file_size <= 31457280));
  end if;
end
$$;

drop trigger if exists set_campus_specials_updated_at on public.campus_specials;
create trigger set_campus_specials_updated_at
before update on public.campus_specials
for each row execute procedure public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('campus-specials', 'campus-specials', false, 31457280, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.exercise_library add column if not exists technique_cues text;
alter table public.exercise_library add column if not exists progression text;
alter table public.exercise_library add column if not exists regression text;
alter table public.exercise_library add column if not exists common_errors text;
alter table public.exercise_library add column if not exists correction text;
alter table public.exercise_library add column if not exists variants text;

create table if not exists public.exercise_favorites (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  exercise_id uuid not null references public.exercise_library(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create table if not exists public.finisher_favorites (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  finisher_id uuid not null references public.finisher_library(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, finisher_id)
);

create table if not exists public.warmup_favorites (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  warmup_id uuid not null references public.warmup_library(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, warmup_id)
);

create table if not exists public.special_favorites (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  special_id uuid not null references public.campus_specials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, special_id)
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

-- RLS / Policies
alter table public.courses enable row level security;
alter table public.participants enable row level security;
alter table public.trial_requests enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.trainer_directory enable row level security;
alter table public.seasons enable row level security;
alter table public.season_bookings enable row level security;
alter table public.beat_out_entries enable row level security;
alter table public.session_overrides enable row level security;
alter table public.drop_in_bookings enable row level security;
alter table public.exercise_library enable row level security;
alter table public.finisher_library enable row level security;
alter table public.warmup_library enable row level security;
alter table public.campus_specials enable row level security;
alter table public.exercise_favorites enable row level security;
alter table public.finisher_favorites enable row level security;
alter table public.warmup_favorites enable row level security;

drop policy if exists "admins see all courses" on public.courses;
create policy "admins see all courses"
on public.courses
for select
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "trainers see assigned courses" on public.courses;
create policy "trainers see assigned courses"
on public.courses
for select
to authenticated
using (public.user_owns_course(id));

drop policy if exists "admins manage courses" on public.courses;
create policy "admins manage courses"
on public.courses
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "authenticated can read trainer directory" on public.trainer_directory;
create policy "authenticated can read trainer directory"
on public.trainer_directory
for select
to authenticated
using (public.user_can_access_trainer_directory(id));

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
using (public.user_can_access_season(id));

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
using (public.user_can_access_season_booking(id));

drop policy if exists "admins manage season bookings" on public.season_bookings;
create policy "admins manage season bookings"
on public.season_bookings
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "authenticated can read exercise library" on public.exercise_library;
create policy "authenticated can read exercise library"
on public.exercise_library
for select
to authenticated
using (public.current_user_role() in ('admin', 'trainer'));

drop policy if exists "admins manage exercise library" on public.exercise_library;
create policy "admins manage exercise library"
on public.exercise_library
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "authenticated can read finisher library" on public.finisher_library;
create policy "authenticated can read finisher library"
on public.finisher_library
for select
to authenticated
using (public.current_user_role() in ('admin', 'trainer'));

drop policy if exists "admins manage finisher library" on public.finisher_library;
create policy "admins manage finisher library"
on public.finisher_library
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "authenticated can read warmup library" on public.warmup_library;
create policy "authenticated can read warmup library"
on public.warmup_library
for select
to authenticated
using (public.current_user_role() in ('admin', 'trainer'));

drop policy if exists "admins manage warmup library" on public.warmup_library;
create policy "admins manage warmup library"
on public.warmup_library
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "authenticated can read campus specials" on public.campus_specials;
create policy "authenticated can read campus specials"
on public.campus_specials
for select
to authenticated
using (public.current_user_role() in ('admin', 'trainer'));

drop policy if exists "admins manage campus specials" on public.campus_specials;
create policy "admins manage campus specials"
on public.campus_specials
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "users manage own exercise favorites" on public.exercise_favorites;
create policy "users manage own exercise favorites"
on public.exercise_favorites
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users manage own finisher favorites" on public.finisher_favorites;
create policy "users manage own finisher favorites"
on public.finisher_favorites
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users manage own warmup favorites" on public.warmup_favorites;
create policy "users manage own warmup favorites"
on public.warmup_favorites
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

alter table public.special_favorites enable row level security;

drop policy if exists "users manage own special favorites" on public.special_favorites;
create policy "users manage own special favorites"
on public.special_favorites
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "authenticated can read campus-specials bucket" on storage.objects;
create policy "authenticated can read campus-specials bucket"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'campus-specials'
  and public.current_user_role() in ('admin', 'trainer')
);

drop policy if exists "admins upload campus-specials bucket" on storage.objects;
create policy "admins upload campus-specials bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'campus-specials'
  and public.current_user_role() = 'admin'
);

drop policy if exists "admins update campus-specials bucket" on storage.objects;
create policy "admins update campus-specials bucket"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'campus-specials'
  and public.current_user_role() = 'admin'
)
with check (
  bucket_id = 'campus-specials'
  and public.current_user_role() = 'admin'
);

drop policy if exists "admins delete campus-specials bucket" on storage.objects;
create policy "admins delete campus-specials bucket"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'campus-specials'
  and public.current_user_role() = 'admin'
);

drop policy if exists "participants visible to course owners" on public.participants;
create policy "participants visible to course owners"
on public.participants
for select
to authenticated
using (
  exists (
    select 1
    from public.courses
    left join public.trainer_directory on trainer_directory.id = courses.trainer_directory_id
    where courses.id = participants.course_id
      and (
        courses.trainer_id = auth.uid()
        or trainer_directory.linked_user_id = auth.uid()
        or public.current_user_role() = 'admin'
      )
  )
);

drop policy if exists "participants managed by course owners" on public.participants;
create policy "participants managed by course owners"
on public.participants
for all
to authenticated
using (
  exists (
    select 1
    from public.courses
    left join public.trainer_directory on trainer_directory.id = courses.trainer_directory_id
    where courses.id = participants.course_id
      and (
        courses.trainer_id = auth.uid()
        or trainer_directory.linked_user_id = auth.uid()
        or public.current_user_role() = 'admin'
      )
  )
)
with check (
  exists (
    select 1
    from public.courses
    left join public.trainer_directory on trainer_directory.id = courses.trainer_directory_id
    where courses.id = participants.course_id
      and (
        courses.trainer_id = auth.uid()
        or trainer_directory.linked_user_id = auth.uid()
        or public.current_user_role() = 'admin'
      )
  )
);

drop policy if exists "trials visible to course owners" on public.trial_requests;
create policy "trials visible to course owners"
on public.trial_requests
for select
to authenticated
using (public.user_owns_course(course_id));

drop policy if exists "trials managed by course owners" on public.trial_requests;
create policy "trials managed by course owners"
on public.trial_requests
for all
to authenticated
using (public.user_owns_course(course_id))
with check (public.user_owns_course(course_id));

drop policy if exists "drop-ins visible to course owners" on public.drop_in_bookings;
create policy "drop-ins visible to course owners"
on public.drop_in_bookings
for select
to authenticated
using (public.user_owns_course(course_id));

drop policy if exists "drop-ins managed by course owners" on public.drop_in_bookings;
create policy "drop-ins managed by course owners"
on public.drop_in_bookings
for all
to authenticated
using (public.user_owns_course(course_id))
with check (public.user_owns_course(course_id));

drop policy if exists "sessions visible to course owners" on public.attendance_sessions;
create policy "sessions visible to course owners"
on public.attendance_sessions
for select
to authenticated
using (public.user_owns_course(course_id));

drop policy if exists "sessions managed by course owners" on public.attendance_sessions;
create policy "sessions managed by course owners"
on public.attendance_sessions
for all
to authenticated
using (public.user_owns_course(course_id))
with check (public.user_owns_course(course_id));

drop policy if exists "records visible to course owners" on public.attendance_records;
create policy "records visible to course owners"
on public.attendance_records
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions
    where attendance_sessions.id = attendance_records.session_id
      and public.user_owns_course(attendance_sessions.course_id)
  )
);

drop policy if exists "records managed by course owners" on public.attendance_records;
create policy "records managed by course owners"
on public.attendance_records
for all
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions
    where attendance_sessions.id = attendance_records.session_id
      and public.user_owns_course(attendance_sessions.course_id)
  )
)
with check (
  exists (
    select 1
    from public.attendance_sessions
    where attendance_sessions.id = attendance_records.session_id
      and public.user_owns_course(attendance_sessions.course_id)
  )
);

drop policy if exists "beat outs visible to course owners" on public.beat_out_entries;
create policy "beat outs visible to course owners"
on public.beat_out_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions
    where attendance_sessions.id = beat_out_entries.session_id
      and public.user_owns_course(attendance_sessions.course_id)
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
    where attendance_sessions.id = beat_out_entries.session_id
      and public.user_owns_course(attendance_sessions.course_id)
  )
)
with check (
  exists (
    select 1
    from public.attendance_sessions
    where attendance_sessions.id = beat_out_entries.session_id
      and public.user_owns_course(attendance_sessions.course_id)
  )
);

drop policy if exists "session overrides visible to course owners" on public.session_overrides;
create policy "session overrides visible to course owners"
on public.session_overrides
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions source_sessions
    where source_sessions.id = session_overrides.source_session_id
      and public.user_owns_course(source_sessions.course_id)
  )
  or exists (
    select 1
    from public.attendance_sessions target_sessions
    where target_sessions.id = session_overrides.target_session_id
      and public.user_owns_course(target_sessions.course_id)
  )
);

drop policy if exists "session overrides managed by course owners" on public.session_overrides;
create policy "session overrides managed by course owners"
on public.session_overrides
for all
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions source_sessions
    where source_sessions.id = session_overrides.source_session_id
      and public.user_owns_course(source_sessions.course_id)
  )
  or exists (
    select 1
    from public.attendance_sessions target_sessions
    where target_sessions.id = session_overrides.target_session_id
      and public.user_owns_course(target_sessions.course_id)
  )
)
with check (
  exists (
    select 1
    from public.attendance_sessions source_sessions
    where source_sessions.id = session_overrides.source_session_id
      and public.user_owns_course(source_sessions.course_id)
  )
  or exists (
    select 1
    from public.attendance_sessions target_sessions
    where target_sessions.id = session_overrides.target_session_id
      and public.user_owns_course(target_sessions.course_id)
  )
);

-- Optionaler Daten-Fix fuer aeltere Probetrainings / DROP-INs:
-- haengt Legacy-Eintraege wieder an die passende attendance_session desselben Kurses.
-- Fall 1: attendance_session_id existiert, zeigt aber auf einen Termin eines anderen Kurses.
update public.trial_requests as trial
set attendance_session_id = replacement.id
from public.attendance_sessions as linked
join lateral (
  select sessions.id
  from public.attendance_sessions as sessions
  where sessions.course_id = trial.course_id
    and sessions.session_date = linked.session_date
  order by sessions.created_at nulls last, sessions.id
  limit 1
) as replacement on true
where trial.attendance_session_id = linked.id
  and linked.course_id is distinct from trial.course_id
  and replacement.id is distinct from trial.attendance_session_id;

update public.drop_in_bookings as dropin
set attendance_session_id = replacement.id
from public.attendance_sessions as linked
join lateral (
  select sessions.id
  from public.attendance_sessions as sessions
  where sessions.course_id = dropin.course_id
    and sessions.session_date = linked.session_date
  order by sessions.created_at nulls last, sessions.id
  limit 1
) as replacement on true
where dropin.attendance_session_id = linked.id
  and linked.course_id is distinct from dropin.course_id
  and replacement.id is distinct from dropin.attendance_session_id;

-- Fall 2: attendance_session_id fehlt oder zeigt ins Leere.
-- Dann wird als bestmoeglicher Fallback ein Termin desselben Kurses am created_at-Datum verwendet.
update public.trial_requests as trial
set attendance_session_id = replacement.id
from lateral (
  select sessions.id
  from public.attendance_sessions as sessions
  where sessions.course_id = trial.course_id
    and sessions.session_date = timezone('Europe/Berlin', trial.created_at)::date
  order by sessions.created_at nulls last, sessions.id
  limit 1
) as replacement
where replacement.id is not null
  and (
    trial.attendance_session_id is null
    or not exists (
      select 1
      from public.attendance_sessions as linked
      where linked.id = trial.attendance_session_id
    )
  );

update public.drop_in_bookings as dropin
set attendance_session_id = replacement.id
from lateral (
  select sessions.id
  from public.attendance_sessions as sessions
  where sessions.course_id = dropin.course_id
    and sessions.session_date = timezone('Europe/Berlin', dropin.created_at)::date
  order by sessions.created_at nulls last, sessions.id
  limit 1
) as replacement
where replacement.id is not null
  and (
    dropin.attendance_session_id is null
    or not exists (
      select 1
      from public.attendance_sessions as linked
      where linked.id = dropin.attendance_session_id
    )
  );
