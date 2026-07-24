create table public.studio_config (
  id bigint generated always as identity primary key,
  working_hours jsonb not null default '{}'::jsonb,
  blocked_days jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.studio_config enable row level security;

create policy "studio_config_select_public"
  on public.studio_config for select
  using (true);

create policy "studio_config_insert_admin"
  on public.studio_config for insert
  with check (auth.role() = 'authenticated');

create policy "studio_config_update_admin"
  on public.studio_config for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "studio_config_delete_admin"
  on public.studio_config for delete
  using (auth.role() = 'authenticated');

-- Trigger to auto-update updated_at
create or replace function public.update_studio_config_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_studio_config_updated_at
  before update on public.studio_config
  for each row
  execute function public.update_studio_config_updated_at();
