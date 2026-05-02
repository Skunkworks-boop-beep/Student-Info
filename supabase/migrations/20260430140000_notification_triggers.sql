-- In-app notifications from social / discussion activity (SECURITY DEFINER bypasses RLS on insert)

-- ---------------------------------------------------------------------------
-- New comment on a thought → notify submitter
-- ---------------------------------------------------------------------------
create or replace function public.notify_complaint_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select user_id into owner from public.complaints where id = new.complaint_id;
  if owner is null or owner = new.user_id then
    return new;
  end if;
  insert into public.notifications (user_id, type, message, complaint_id, is_read)
  values (owner, 'new_comment', 'Someone commented on your thought', new.complaint_id, false);
  return new;
end;
$$;

drop trigger if exists complaint_comment_notify on public.complaint_comments;
create trigger complaint_comment_notify
  after insert on public.complaint_comments
  for each row execute function public.notify_complaint_comment();

-- ---------------------------------------------------------------------------
-- Post liked → notify author (not self-likes)
-- ---------------------------------------------------------------------------
create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  aid uuid;
begin
  select author_id into aid from public.posts where id = new.post_id;
  if aid is null or aid = new.user_id then
    return new;
  end if;
  insert into public.notifications (user_id, type, message, post_id, is_read)
  values (aid, 'post_like', 'Someone liked your campus post', new.post_id, false);
  return new;
end;
$$;

drop trigger if exists post_like_notify on public.post_likes;
create trigger post_like_notify
  after insert on public.post_likes
  for each row execute function public.notify_post_like();

-- ---------------------------------------------------------------------------
-- New follower → notify followed user
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, message, is_read)
  values (new.following_id, 'new_follower', 'You have a new follower', false);
  return new;
end;
$$;

drop trigger if exists follow_notify on public.follows;
create trigger follow_notify
  after insert on public.follows
  for each row execute function public.notify_new_follower();

-- ---------------------------------------------------------------------------
-- Comment on post → notify author
-- ---------------------------------------------------------------------------
create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  aid uuid;
begin
  select author_id into aid from public.posts where id = new.post_id;
  if aid is null or aid = new.user_id then
    return new;
  end if;
  insert into public.notifications (user_id, type, message, post_id, is_read)
  values (aid, 'post_comment', 'Someone commented on your post', new.post_id, false);
  return new;
end;
$$;

drop trigger if exists post_comment_notify on public.post_comments;
create trigger post_comment_notify
  after insert on public.post_comments
  for each row execute function public.notify_post_comment();
