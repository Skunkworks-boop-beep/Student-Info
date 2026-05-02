-- Production: complaint media storage, workflow rules (admin), seed defaults

-- ---------------------------------------------------------------------------
-- Storage bucket for thought / complaint attachments (public read)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-media',
  'complaint-media',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "complaint_media_public_read" on storage.objects;
create policy "complaint_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'complaint-media');

drop policy if exists "complaint_media_authenticated_insert" on storage.objects;
create policy "complaint_media_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'complaint-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "complaint_media_owner_update" on storage.objects;
create policy "complaint_media_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'complaint-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "complaint_media_owner_delete" on storage.objects;
create policy "complaint_media_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'complaint-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Workflow rules (admin only)
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_rules (
  id uuid primary key default gen_random_uuid(),
  condition_field text not null,
  condition_value text not null,
  action text not null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflow_rules_sort_idx on public.workflow_rules (sort_order);

drop trigger if exists workflow_rules_updated_at on public.workflow_rules;
create trigger workflow_rules_updated_at
  before update on public.workflow_rules
  for each row execute function public.set_updated_at();

alter table public.workflow_rules enable row level security;

drop policy if exists workflow_rules_admin_select on public.workflow_rules;
create policy workflow_rules_admin_select on public.workflow_rules
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists workflow_rules_admin_insert on public.workflow_rules;
create policy workflow_rules_admin_insert on public.workflow_rules
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists workflow_rules_admin_update on public.workflow_rules;
create policy workflow_rules_admin_update on public.workflow_rules
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists workflow_rules_admin_delete on public.workflow_rules;
create policy workflow_rules_admin_delete on public.workflow_rules
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into public.workflow_rules (condition_field, condition_value, action, enabled, sort_order)
select v.condition_field, v.condition_value, v.action, v.enabled, v.sort_order
from (
  values
    ('priority'::text, 'High'::text, 'mark_urgent AND notify_admin_instantly'::text, true, 0),
    ('category', 'Safety', 'escalate_to_facilities_team', true, 1),
    ('upvotes', '> 20', 'auto_review AND boost_priority', false, 2)
) as v(condition_field, condition_value, action, enabled, sort_order)
where not exists (select 1 from public.workflow_rules limit 1);
