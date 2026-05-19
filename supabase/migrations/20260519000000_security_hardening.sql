-- Security hardening: role escalation fix, atomic admin ops, content constraints, XP integrity

-- ---------------------------------------------------------------------------
-- 1. CRITICAL: Prevent role self-escalation
--    The previous profiles_update_own had no WITH CHECK, allowing any
--    authenticated user to set their own role = 'admin'.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Role must stay equal to the committed value before this update
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Admin-only RPC to promote / demote a user (SECURITY DEFINER, role-gated)
create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_role not in ('student', 'admin') then
    raise exception 'Invalid role: %', new_role;
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized: admin role required';
  end if;
  update public.profiles set role = new_role where id = target_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. CRITICAL: Atomic admin complaint status update
--    Replaces 4 separate client-side round-trips with a single transaction.
--    All three side-effects (status, log entry, notification) commit together
--    or roll back together.
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_complaint_status(
  p_complaint_id uuid,
  p_new_status   text,
  p_admin_id     uuid,
  p_note         text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status text;
  v_user_id    uuid;
begin
  -- Gate: caller must be admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized: admin role required';
  end if;

  -- Validate status enum (belt-and-suspenders against the table CHECK)
  if p_new_status not in ('Pending', 'Reviewed', 'Processing', 'Resolved') then
    raise exception 'Invalid status: %', p_new_status;
  end if;

  -- Lock the row to prevent concurrent updates
  select status, user_id
  into v_old_status, v_user_id
  from public.complaints
  where id = p_complaint_id
  for update;

  if not found then
    raise exception 'Complaint % not found', p_complaint_id;
  end if;

  -- No-op if status unchanged
  if v_old_status = p_new_status then
    return;
  end if;

  -- Atomic: update + log + notify
  update public.complaints
  set status = p_new_status
  where id = p_complaint_id;

  insert into public.complaint_status_log (complaint_id, old_status, new_status, changed_by, note)
  values (p_complaint_id, v_old_status, p_new_status, p_admin_id, coalesce(p_note, ''));

  if v_user_id is not null then
    insert into public.notifications (user_id, type, message, complaint_id, is_read)
    values (
      v_user_id,
      'status_change',
      'Your thought status changed: ' || v_old_status || ' → ' || p_new_status,
      p_complaint_id,
      false
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Tighten notifications insert policy
--    All cross-user notification inserts now go via SECURITY DEFINER
--    triggers/functions, so the client never needs to insert for another user.
-- ---------------------------------------------------------------------------
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert to authenticated
  with check (user_id = auth.uid());

-- Allow users to delete (dismiss) their own notifications
drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. DB-level content length constraints
--    These mirror the app-side validation and defend against direct API calls.
-- ---------------------------------------------------------------------------
alter table public.complaints
  drop constraint if exists complaints_title_len,
  drop constraint if exists complaints_description_len,
  drop constraint if exists complaints_location_len;
alter table public.complaints
  add constraint complaints_title_len
    check (length(trim(title)) between 8 and 120),
  add constraint complaints_description_len
    check (length(trim(description)) between 20 and 5000),
  add constraint complaints_location_len
    check (length(trim(location)) <= 120);

alter table public.posts
  drop constraint if exists posts_body_len;
alter table public.posts
  add constraint posts_body_len
    check (length(trim(body)) between 1 and 500);

alter table public.complaint_comments
  drop constraint if exists complaint_comments_text_len;
alter table public.complaint_comments
  add constraint complaint_comments_text_len
    check (length(trim(text)) between 1 and 2000);

alter table public.post_comments
  drop constraint if exists post_comments_text_len;
alter table public.post_comments
  add constraint post_comments_text_len
    check (length(trim(text)) between 1 and 2000);

alter table public.profiles
  drop constraint if exists profiles_display_name_len,
  drop constraint if exists profiles_bio_len;
alter table public.profiles
  add constraint profiles_display_name_len
    check (length(trim(display_name)) between 1 and 80),
  add constraint profiles_bio_len
    check (bio is null or length(bio) <= 500);

-- ---------------------------------------------------------------------------
-- 5. XP integrity: decrement on delete
--    Prevents farming via delete-and-resubmit.
-- ---------------------------------------------------------------------------
create or replace function public.trg_complaint_delete_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.add_profile_xp(old.user_id, -10);
  return old;
end;
$$;

drop trigger if exists complaint_delete_xp on public.complaints;
create trigger complaint_delete_xp
  after delete on public.complaints
  for each row execute function public.trg_complaint_delete_xp();

create or replace function public.trg_post_delete_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.add_profile_xp(old.author_id, -3);
  return old;
end;
$$;

drop trigger if exists post_delete_xp on public.posts;
create trigger post_delete_xp
  after delete on public.posts
  for each row execute function public.trg_post_delete_xp();

create or replace function public.trg_complaint_comment_delete_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.add_profile_xp(old.user_id, -5);
  return old;
end;
$$;

drop trigger if exists complaint_comment_delete_xp on public.complaint_comments;
create trigger complaint_comment_delete_xp
  after delete on public.complaint_comments
  for each row execute function public.trg_complaint_comment_delete_xp();

-- ---------------------------------------------------------------------------
-- 6. Allow users to delete their own comments
-- ---------------------------------------------------------------------------
drop policy if exists complaint_comments_delete_own on public.complaint_comments;
create policy complaint_comments_delete_own on public.complaint_comments
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists post_comments_delete_own on public.post_comments;
create policy post_comments_delete_own on public.post_comments
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. Performance indexes for join-heavy queries
-- ---------------------------------------------------------------------------
create index if not exists complaint_upvotes_user_idx  on public.complaint_upvotes (user_id);
create index if not exists post_likes_user_idx         on public.post_likes (user_id);
create index if not exists post_comments_user_idx      on public.post_comments (user_id);
create index if not exists notifications_created_idx   on public.notifications (user_id, created_at desc);
