-- Student.Info: profiles, campus thoughts (complaints), social posts, follows, notifications
-- Run in Supabase SQL Editor or via supabase db push

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  avatar_url text,
  university_name text,
  country_code text,
  field_of_study text,
  bio text,
  role text not null default 'student' check (role in ('student', 'admin')),
  uni_xp int not null default 0,
  badges text[] not null default '{}',
  streak int not null default 0,
  anonymous_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username ~ '^[a-zA-Z0-9._-]{3,32}$'
  )
);

create unique index if not exists profiles_username_lower_key on public.profiles (lower(username));

create index if not exists profiles_uni_xp_idx on public.profiles (uni_xp desc);
create index if not exists profiles_username_idx on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- Thoughts / complaints
-- ---------------------------------------------------------------------------
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null
    check (category in ('Academic', 'Administrative', 'Facilities', 'IT', 'Transport', 'Safety', 'Other')),
  priority text not null check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'Pending'
    check (status in ('Pending', 'Reviewed', 'Processing', 'Resolved')),
  location text not null default '',
  is_anonymous boolean not null default false,
  media_urls text[] not null default '{}',
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaints_created_idx on public.complaints (created_at desc);
create index if not exists complaints_user_idx on public.complaints (user_id);
create index if not exists complaints_status_idx on public.complaints (status);

create table if not exists public.complaint_comments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  parent_id uuid references public.complaint_comments (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists complaint_comments_complaint_idx on public.complaint_comments (complaint_id);

create table if not exists public.complaint_upvotes (
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (complaint_id, user_id)
);

create table if not exists public.complaint_status_log (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  old_status text not null,
  new_status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Social: posts, likes, comments, follows
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  media_urls text[] not null default '{}',
  topic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_topic_idx on public.posts (lower(topic));

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  parent_id uuid references public.post_comments (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx on public.post_comments (post_id);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null
    check (type in ('status_change', 'new_comment', 'mention', 'complaint_resolved', 'system_alert', 'post_like', 'new_follower', 'post_comment')),
  message text not null,
  is_read boolean not null default false,
  complaint_id uuid references public.complaints (id) on delete set null,
  post_id uuid references public.posts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx on public.notifications (user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at touch
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists complaints_updated_at on public.complaints;
create trigger complaints_updated_at
  before update on public.complaints
  for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  dname text;
  uni text;
begin
  uname := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))));
  if uname is null or length(uname) < 3 then
    uname := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;
  while exists (select 1 from public.profiles where lower(username) = lower(uname)) loop
    uname := uname || floor(random() * 10000)::text;
  end loop;
  dname := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Student');
  uni := coalesce(nullif(trim(new.raw_user_meta_data ->> 'university_name'), ''), '');
  insert into public.profiles (id, username, display_name, university_name, role)
  values (new.id, uname, dname, uni, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- XP helpers (security definer; called from triggers)
-- ---------------------------------------------------------------------------
create or replace function public.add_profile_xp(target uuid, delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if delta is null or delta = 0 then
    return;
  end if;
  update public.profiles
  set uni_xp = greatest(0, uni_xp + delta)
  where id = target;
end;
$$;

create or replace function public.trg_complaint_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.add_profile_xp(new.user_id, 10);
  return new;
end;
$$;

drop trigger if exists complaint_insert_xp on public.complaints;
create trigger complaint_insert_xp
  after insert on public.complaints
  for each row execute function public.trg_complaint_xp();

create or replace function public.trg_complaint_comment_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.add_profile_xp(new.user_id, 5);
  return new;
end;
$$;

drop trigger if exists complaint_comment_xp on public.complaint_comments;
create trigger complaint_comment_xp
  after insert on public.complaint_comments
  for each row execute function public.trg_complaint_comment_xp();

create or replace function public.trg_post_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.add_profile_xp(new.author_id, 3);
  return new;
end;
$$;

drop trigger if exists post_insert_xp on public.posts;
create trigger post_insert_xp
  after insert on public.posts
  for each row execute function public.trg_post_xp();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_comments enable row level security;
alter table public.complaint_upvotes enable row level security;
alter table public.complaint_status_log enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid());

-- Complaints
create policy complaints_select on public.complaints
  for select to authenticated using (true);
create policy complaints_insert_own on public.complaints
  for insert to authenticated with check (user_id = auth.uid());
create policy complaints_update_owner_or_admin on public.complaints
  for update to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy complaints_delete_owner on public.complaints
  for delete to authenticated using (user_id = auth.uid());

-- Complaint comments
create policy complaint_comments_select on public.complaint_comments
  for select to authenticated using (true);
create policy complaint_comments_insert on public.complaint_comments
  for insert to authenticated with check (user_id = auth.uid());

-- Upvotes
create policy complaint_upvotes_select on public.complaint_upvotes
  for select to authenticated using (true);
create policy complaint_upvotes_insert_own on public.complaint_upvotes
  for insert to authenticated with check (user_id = auth.uid());
create policy complaint_upvotes_delete_own on public.complaint_upvotes
  for delete to authenticated using (user_id = auth.uid());

-- Status log: read all; insert admin only
create policy complaint_status_log_select on public.complaint_status_log
  for select to authenticated using (true);
create policy complaint_status_log_insert_admin on public.complaint_status_log
  for insert to authenticated with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Posts
create policy posts_select on public.posts
  for select to authenticated using (true);
create policy posts_insert_own on public.posts
  for insert to authenticated with check (author_id = auth.uid());
create policy posts_update_own on public.posts
  for update to authenticated using (author_id = auth.uid());
create policy posts_delete_own on public.posts
  for delete to authenticated using (author_id = auth.uid());

-- Post likes
create policy post_likes_select on public.post_likes
  for select to authenticated using (true);
create policy post_likes_insert_own on public.post_likes
  for insert to authenticated with check (user_id = auth.uid());
create policy post_likes_delete_own on public.post_likes
  for delete to authenticated using (user_id = auth.uid());

-- Post comments
create policy post_comments_select on public.post_comments
  for select to authenticated using (true);
create policy post_comments_insert_own on public.post_comments
  for insert to authenticated with check (user_id = auth.uid());

-- Follows
create policy follows_select on public.follows
  for select to authenticated using (true);
create policy follows_insert_own on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy follows_delete_own on public.follows
  for delete to authenticated using (follower_id = auth.uid());

-- Notifications: own rows only
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_update_own on public.notifications
  for update to authenticated using (user_id = auth.uid());
-- Service role / triggers may insert via SECURITY DEFINER functions if added later; for now app can insert own test rows.
create policy notifications_insert on public.notifications
  for insert to authenticated with check (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
