alter table public.exercise_state
  add column ups int not null default 0,          -- successes banked toward the next increase (healing 'slow' mode)
  add column calibrated boolean not null default false; -- first-session "felt easy?" check done
