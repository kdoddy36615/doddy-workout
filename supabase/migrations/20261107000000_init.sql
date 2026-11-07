-- doddy-workout schema. Program structure lives in src/program.ts; this holds only gym-time state.
-- No login: RLS stays ON with explicit anon policies (private-by-URL app).

create table public.exercise_state (
  person text not null check (person in ('kevin', 'emily')),
  key text not null,                 -- variant id, suffixed ':main' for main-lift role
  weight numeric not null,
  fails int not null default 0,      -- consecutive failed sessions at this weight
  suggested numeric,                 -- pending suggestion chip (null = none)
  step numeric,                      -- stepper override (null = program default)
  setup_note text,                   -- seat/depth/pin settings
  updated_at timestamptz not null default now(),
  primary key (person, key)
);

create table public.slot_choice (
  person text not null check (person in ('kevin', 'emily')),
  slot_key text not null,            -- "<dayId>/<slotId>" style key shared across A/B days where slots are shared
  variant text not null,
  primary key (person, slot_key)
);

create table public.person_settings (
  person text primary key check (person in ('kevin', 'emily')),
  healing_mode boolean not null default false
);
insert into public.person_settings (person, healing_mode) values ('kevin', false), ('emily', true);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('kevin', 'emily')),
  day_id text not null,
  date date not null,                -- phone-local calendar date
  status text not null default 'active' check (status in ('active', 'finished', 'partial')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index sessions_person_date on public.sessions (person, date desc);

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  key text not null,                 -- same as exercise_state.key
  set_index int not null,
  weight numeric not null,
  reps int not null,
  done boolean not null default false,
  unique (session_id, key, set_index)
);

create table public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('kevin', 'emily')),
  session_id uuid references public.sessions (id) on delete set null,
  date date not null,
  kind text not null,
  minutes int,
  created_at timestamptz not null default now()
);
create index cardio_logs_session on public.cardio_logs (session_id);

do $$
declare t text;
begin
  foreach t in array array['exercise_state', 'slot_choice', 'person_settings', 'sessions', 'set_logs', 'cardio_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "anon full access" on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;
