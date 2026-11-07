alter table public.person_settings
  add column run_week int not null default 0, -- running-plan week index she's on (or paused at)
  add column run_start date;                   -- Monday that run_week began; null while healing
