create table public.workout_timer_presets (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(name) between 1 and 120),
 config jsonb not null check (jsonb_typeof(config)='object'),
 created_at timestamptz not null default now()
);
alter table public.workout_timer_presets enable row level security;
revoke all on public.workout_timer_presets from anon, authenticated;
grant select,insert,update,delete on public.workout_timer_presets to authenticated;
create policy timer_coaches_read on public.workout_timer_presets for select to authenticated using ((select public.current_user_role()) in ('admin','trainer'));
create policy timer_admin_insert on public.workout_timer_presets for insert to authenticated with check ((select public.current_user_role())='admin');
create policy timer_admin_update on public.workout_timer_presets for update to authenticated using ((select public.current_user_role())='admin') with check ((select public.current_user_role())='admin');
create policy timer_admin_delete on public.workout_timer_presets for delete to authenticated using ((select public.current_user_role())='admin');
insert into public.workout_timer_presets(name,config) values
 ('BEATFIELD 45/15','{"type":"INTERVAL","workDuration":45,"restDuration":15,"rounds":8}'),
 ('BEATFIELD 50/10','{"type":"INTERVAL","workDuration":50,"restDuration":10,"rounds":10}'),
 ('BEATFIELD 60/20','{"type":"INTERVAL","workDuration":60,"restDuration":20,"rounds":8}'),
 ('TABATA CLASSIC','{"type":"TABATA","workDuration":20,"restDuration":10,"rounds":8}'),
 ('EMOM 10','{"type":"EMOM","totalDuration":600}'),
 ('AMRAP 12','{"type":"AMRAP","totalDuration":720}');
