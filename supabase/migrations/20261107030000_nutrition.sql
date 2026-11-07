create table public.weigh_ins (
  person text not null check (person in ('kevin', 'emily')),
  date date not null,
  weight numeric not null,
  primary key (person, date)
);
alter table public.weigh_ins enable row level security;
create policy "anon full access" on public.weigh_ins for all to anon, authenticated using (true) with check (true);

alter table public.person_settings add column kcal_adjust int not null default 0; -- accepted ±100 trend nudges
