import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Category,
  Comment,
  Complaint,
  Notification,
  Status,
  StatusLog,
  User,
} from '../data/mock-data';

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  university_name: string | null;
  country_code: string | null;
  field_of_study: string | null;
  bio: string | null;
  role: 'student' | 'admin';
  uni_xp: number;
  badges: string[] | null;
  streak: number;
  anonymous_mode: boolean;
  created_at: string;
};

function mapProfileToUser(row: ProfileRow, email: string): User {
  return {
    id: row.id,
    name: row.display_name,
    email,
    role: row.role,
    avatar: row.avatar_url ?? undefined,
    uni_xp: row.uni_xp,
    badges: row.badges ?? [],
    streak: row.streak,
    username: row.username,
    university_name: row.university_name ?? undefined,
    anonymous_mode: row.anonymous_mode,
    country_code: row.country_code ?? undefined,
    field_of_study: row.field_of_study ?? undefined,
    bio: row.bio ?? undefined,
    created_at: row.created_at.slice(0, 10),
  };
}

export async function fetchProfileForSession(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<User | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfileToUser(data as ProfileRow, email);
}

export async function updateProfileAnonymousModeApi(
  supabase: SupabaseClient,
  userId: string,
  anonymous: boolean
): Promise<void> {
  const { error } = await supabase.from('profiles').update({ anonymous_mode: anonymous }).eq('id', userId);
  if (error) throw error;
}

export async function fetchLeaderboardProfiles(supabase: SupabaseClient, limit = 50): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('uni_xp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ProfileRow[]).map(p =>
    mapProfileToUser(p, `${p.username}@users.local`)
  );
}

type ComplaintRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  is_anonymous: boolean;
  media_urls: string[] | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

function buildComplaintModel(
  row: ComplaintRow,
  authorName: string,
  comments: Comment[],
  status_log: StatusLog[],
  upvotes: number,
  upvotedByMe: boolean
): Complaint {
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: authorName,
    title: row.title,
    description: row.description,
    category: row.category as Category,
    priority: row.priority as Complaint['priority'],
    status: row.status as Status,
    location: row.location,
    is_anonymous: row.is_anonymous,
    upvotes,
    upvoted_by_me: upvotedByMe,
    created_at: row.created_at,
    updated_at: row.updated_at,
    comments,
    status_log,
    rating: row.rating ?? undefined,
    media_urls: row.media_urls?.length ? row.media_urls : undefined,
  };
}

async function loadComplaintsBundle(
  supabase: SupabaseClient,
  currentUserId: string | undefined,
  complaintIds: string[] | null
): Promise<Complaint[]> {
  let q = supabase.from('complaints').select('*').order('updated_at', { ascending: false });
  if (complaintIds?.length) q = q.in('id', complaintIds);
  const { data: rows, error } = await q;
  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map(r => r.id as string);
  const userIds = [...new Set(rows.map(r => r.user_id as string))];

  const [{ data: profs }, { data: commentsRaw }, { data: upvotesRaw }, { data: logsRaw }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, username').in('id', userIds),
    supabase.from('complaint_comments').select('*').in('complaint_id', ids),
    supabase.from('complaint_upvotes').select('complaint_id, user_id').in('complaint_id', ids),
    supabase.from('complaint_status_log').select('*').in('complaint_id', ids).order('created_at', { ascending: true }),
  ]);

  const profileById = Object.fromEntries((profs ?? []).map(p => [p.id as string, p]));

  const commentUserIds = [...new Set((commentsRaw ?? []).map(c => c.user_id as string))];
  let commentNames: Record<string, string> = {};
  if (commentUserIds.length) {
    const { data: cprofs } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .in('id', commentUserIds);
    commentNames = Object.fromEntries(
      (cprofs ?? []).map(p => [p.id as string, (p.display_name as string) ?? (p.username as string)])
    );
  }

  const commentsByComplaint: Record<string, Comment[]> = {};
  for (const c of commentsRaw ?? []) {
    const cid = c.complaint_id as string;
    if (!commentsByComplaint[cid]) commentsByComplaint[cid] = [];
    commentsByComplaint[cid].push({
      id: c.id as string,
      user_id: c.user_id as string,
      user_name: commentNames[c.user_id as string] ?? 'Student',
      text: c.text as string,
      parent_id: (c.parent_id as string) ?? null,
      created_at: c.created_at as string,
    });
  }

  const upvoteCount: Record<string, number> = {};
  const myUpvote: Record<string, boolean> = {};
  for (const u of upvotesRaw ?? []) {
    const cid = u.complaint_id as string;
    upvoteCount[cid] = (upvoteCount[cid] ?? 0) + 1;
    if (currentUserId && u.user_id === currentUserId) myUpvote[cid] = true;
  }

  const logsByComplaint: Record<string, StatusLog[]> = {};
  for (const log of logsRaw ?? []) {
    const cid = log.complaint_id as string;
    if (!logsByComplaint[cid]) logsByComplaint[cid] = [];
    logsByComplaint[cid].push({
      old_status: log.old_status as Status,
      new_status: log.new_status as Status,
      changed_by: 'Admin',
      note: (log.note as string) ?? '',
      timestamp: log.created_at as string,
    });
  }

  return rows.map(row => {
    const r = row as ComplaintRow;
    const uid = r.user_id;
    const prof = profileById[uid] as { display_name?: string; username?: string } | undefined;
    const display = r.is_anonymous ? 'Anonymous' : prof?.display_name ?? prof?.username ?? 'Student';
    const id = r.id;
    return buildComplaintModel(
      r,
      display,
      commentsByComplaint[id] ?? [],
      logsByComplaint[id] ?? [],
      upvoteCount[id] ?? 0,
      Boolean(currentUserId && myUpvote[id])
    );
  });
}

export async function listComplaints(supabase: SupabaseClient, currentUserId: string | undefined): Promise<Complaint[]> {
  return loadComplaintsBundle(supabase, currentUserId, null);
}

export async function getComplaintById(
  supabase: SupabaseClient,
  id: string,
  currentUserId: string | undefined
): Promise<Complaint | null> {
  const list = await loadComplaintsBundle(supabase, currentUserId, [id]);
  return list[0] ?? null;
}

export async function createComplaintRow(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    title: string;
    description: string;
    category: Category;
    priority: 'Low' | 'Medium' | 'High';
    location: string;
    is_anonymous: boolean;
    media_urls?: string[];
  }
): Promise<string> {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      user_id: params.user_id,
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority,
      location: params.location,
      is_anonymous: params.is_anonymous,
      media_urls: params.media_urls ?? [],
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function toggleComplaintUpvote(
  supabase: SupabaseClient,
  complaintId: string,
  userId: string,
  currentlyUpvoted: boolean
): Promise<void> {
  if (currentlyUpvoted) {
    const { error } = await supabase.from('complaint_upvotes').delete().eq('complaint_id', complaintId).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('complaint_upvotes').insert({ complaint_id: complaintId, user_id: userId });
    if (error) throw error;
  }
}

export async function addComplaintCommentRow(
  supabase: SupabaseClient,
  params: { complaint_id: string; user_id: string; text: string; parent_id: string | null }
): Promise<void> {
  const { error } = await supabase.from('complaint_comments').insert({
    complaint_id: params.complaint_id,
    user_id: params.user_id,
    text: params.text,
    parent_id: params.parent_id,
  });
  if (error) throw error;
}

export async function listNotifications(supabase: SupabaseClient, userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data ?? []).map(n => ({
    id: n.id as string,
    type: n.type as Notification['type'],
    message: n.message as string,
    is_read: Boolean(n.is_read),
    complaint_id: (n.complaint_id as string) ?? undefined,
    post_id: (n.post_id as string) ?? undefined,
    created_at: n.created_at as string,
  }));
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  if (error) throw error;
}

/** Social feed post shape for UI */
export type FeedPost = {
  id: string;
  author_id: string;
  author_display: string;
  author_username: string;
  body: string;
  media_urls: string[];
  topic: string | null;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
};

export async function listPostsGlobal(supabase: SupabaseClient, viewerId: string | undefined, limit = 40): Promise<FeedPost[]> {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return hydratePosts(supabase, posts ?? [], viewerId);
}

export async function listPostsFromFollowing(
  supabase: SupabaseClient,
  viewerId: string,
  limit = 40
): Promise<FeedPost[]> {
  const { data: follows, error: fErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', viewerId);
  if (fErr) throw fErr;
  const ids = (follows ?? []).map(f => f.following_id as string);
  if (!ids.length) return [];
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .in('author_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return hydratePosts(supabase, posts ?? [], viewerId);
}

async function hydratePosts(
  supabase: SupabaseClient,
  rows: Record<string, unknown>[],
  viewerId: string | undefined
): Promise<FeedPost[]> {
  if (!rows.length) return [];
  const authorIds = [...new Set(rows.map(r => r.author_id as string))];
  const postIds = rows.map(r => r.id as string);

  const [{ data: authors }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, username').in('id', authorIds),
    supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
    supabase.from('post_comments').select('id, post_id').in('post_id', postIds),
  ]);

  const authorById = Object.fromEntries((authors ?? []).map(a => [a.id as string, a]));

  const likeCount: Record<string, number> = {};
  const likedMe: Record<string, boolean> = {};
  for (const l of likes ?? []) {
    const pid = l.post_id as string;
    likeCount[pid] = (likeCount[pid] ?? 0) + 1;
    if (viewerId && l.user_id === viewerId) likedMe[pid] = true;
  }

  const commentCount: Record<string, number> = {};
  for (const c of comments ?? []) {
    const pid = c.post_id as string;
    commentCount[pid] = (commentCount[pid] ?? 0) + 1;
  }

  return rows.map(r => {
    const aid = r.author_id as string;
    const ap = authorById[aid] as { display_name?: string; username?: string } | undefined;
    const pid = r.id as string;
    return {
      id: pid,
      author_id: aid,
      author_display: ap?.display_name ?? ap?.username ?? 'Student',
      author_username: (ap?.username as string) ?? '',
      body: r.body as string,
      media_urls: (r.media_urls as string[]) ?? [],
      topic: (r.topic as string) ?? null,
      created_at: r.created_at as string,
      like_count: likeCount[pid] ?? 0,
      liked_by_me: Boolean(viewerId && likedMe[pid]),
      comment_count: commentCount[pid] ?? 0,
    };
  });
}

export async function createPostRow(
  supabase: SupabaseClient,
  authorId: string,
  body: string,
  topic: string | null,
  media_urls: string[]
): Promise<string> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id: authorId, body, topic, media_urls })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function togglePostLike(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export type PostComment = {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
};

export async function listPostComments(supabase: SupabaseClient, postId: string): Promise<PostComment[]> {
  const { data: rows, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const uids = [...new Set((rows ?? []).map(r => r.user_id as string))];
  let names: Record<string, string> = {};
  if (uids.length) {
    const { data: profs } = await supabase.from('profiles').select('id, display_name, username').in('id', uids);
    names = Object.fromEntries((profs ?? []).map(p => [p.id as string, (p.display_name as string) ?? (p.username as string)]));
  }
  return (rows ?? []).map(r => ({
    id: r.id as string,
    user_id: r.user_id as string,
    user_name: names[r.user_id as string] ?? 'Student',
    text: r.text as string,
    created_at: r.created_at as string,
  }));
}

export async function addPostCommentRow(
  supabase: SupabaseClient,
  params: { post_id: string; user_id: string; text: string }
): Promise<void> {
  const { error } = await supabase.from('post_comments').insert({
    post_id: params.post_id,
    user_id: params.user_id,
    text: params.text,
  });
  if (error) throw error;
}

export async function getProfileByUsername(
  supabase: SupabaseClient,
  username: string,
  viewerEmail?: string
): Promise<User | null> {
  const handle = username.trim().toLowerCase();
  if (!handle) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('username', handle).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfileToUser(data as ProfileRow, viewerEmail ?? `${(data as ProfileRow).username}@users.local`);
}

export async function followUserRow(supabase: SupabaseClient, followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error && error.code !== '23505') throw error;
}

export async function unfollowUserRow(supabase: SupabaseClient, followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
  if (error) throw error;
}

export async function isFollowingUser(
  supabase: SupabaseClient,
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function countFollowers(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export async function listPostsForAuthor(
  supabase: SupabaseClient,
  authorId: string,
  viewerId: string | undefined,
  limit = 30
): Promise<FeedPost[]> {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return hydratePosts(supabase, posts ?? [], viewerId);
}

export async function updateComplaintStatusAdmin(
  supabase: SupabaseClient,
  params: {
    complaint_id: string;
    new_status: Status;
    admin_id: string;
    note: string;
  }
): Promise<void> {
  const { data: current, error: gErr } = await supabase
    .from('complaints')
    .select('status, user_id')
    .eq('id', params.complaint_id)
    .single();
  if (gErr) throw gErr;
  const oldStatus = current?.status as Status;
  const submitterId = current?.user_id as string;

  if (oldStatus === params.new_status) {
    return;
  }

  const { error: uErr } = await supabase
    .from('complaints')
    .update({ status: params.new_status })
    .eq('id', params.complaint_id);
  if (uErr) throw uErr;

  const { error: lErr } = await supabase.from('complaint_status_log').insert({
    complaint_id: params.complaint_id,
    old_status: oldStatus,
    new_status: params.new_status,
    changed_by: params.admin_id,
    note: params.note,
  });
  if (lErr) throw lErr;

  const { error: nErr } = await supabase.from('notifications').insert({
    user_id: submitterId,
    type: 'status_change',
    message: `Your thought was updated: ${oldStatus} → ${params.new_status}`,
    complaint_id: params.complaint_id,
    is_read: false,
  });
  if (nErr) throw nErr;
}

export async function listProfilesRoster(supabase: SupabaseClient, limit = 300): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ProfileRow[]).map(p => mapProfileToUser(p, `${p.username}@users.local`));
}

export type LiveAnalytics = {
  totalComplaints: number;
  openComplaints: number;
  avgResolutionDays: number;
  satisfactionScore: number;
  complaintsOverTime: { month: string; count: number }[];
  byCategory: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
};

export function buildLiveAnalytics(all: Complaint[]): LiveAnalytics {
  const totalComplaints = all.length;
  const openComplaints = all.filter(c => c.status !== 'Resolved').length;
  const resolved = all.filter(c => c.status === 'Resolved');
  let avgResolutionDays = 0;
  if (resolved.length) {
    const sum = resolved.reduce((acc, c) => {
      const days = (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / 86400000;
      return acc + Math.max(0, days);
    }, 0);
    avgResolutionDays = Math.round((sum / resolved.length) * 10) / 10;
  }
  const rated = resolved.filter(c => (c.rating ?? 0) > 0);
  const satisfactionScore = rated.length
    ? Math.round((rated.reduce((a, c) => a + (c.rating ?? 0), 0) / rated.length) * 10) / 10
    : 0;

  const monthFmt = new Intl.DateTimeFormat('en', { month: 'short' });
  const byMonth = new Map<string, { label: string; count: number }>();
  for (const c of all) {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const prev = byMonth.get(key);
    if (prev) prev.count += 1;
    else byMonth.set(key, { label: monthFmt.format(d), count: 1 });
  }
  const sortedKeys = [...byMonth.keys()].sort();
  const complaintsOverTime = sortedKeys.slice(-6).map(k => {
    const v = byMonth.get(k)!;
    return { month: v.label, count: v.count };
  });

  const catMap = new Map<string, number>();
  for (const c of all) {
    catMap.set(c.category, (catMap.get(c.category) ?? 0) + 1);
  }
  const byCategory = [...catMap.entries()].map(([name, value]) => ({ name, value }));

  const statuses: Status[] = ['Pending', 'Reviewed', 'Processing', 'Resolved'];
  const byStatus = statuses.map(name => ({
    name,
    value: all.filter(c => c.status === name).length,
  }));

  return {
    totalComplaints,
    openComplaints,
    avgResolutionDays,
    satisfactionScore,
    complaintsOverTime,
    byCategory,
    byStatus,
  };
}

const COMPLAINT_MEDIA_BUCKET = 'complaint-media';

export async function uploadComplaintMediaFiles(
  supabase: SupabaseClient,
  userId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = [];
  const base = Date.now();
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${base}_${i}_${safe}`;
    const { error } = await supabase.storage.from(COMPLAINT_MEDIA_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(COMPLAINT_MEDIA_BUCKET).getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }
  return urls;
}

export type WorkflowRuleRow = {
  id: string;
  condition_field: string;
  condition_value: string;
  action: string;
  enabled: boolean;
  sort_order: number;
};

export async function fetchWorkflowRules(supabase: SupabaseClient): Promise<WorkflowRuleRow[]> {
  const { data, error } = await supabase
    .from('workflow_rules')
    .select('id, condition_field, condition_value, action, enabled, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkflowRuleRow[];
}

export async function insertWorkflowRule(
  supabase: SupabaseClient,
  row: Omit<WorkflowRuleRow, 'id'>
): Promise<void> {
  const { error } = await supabase.from('workflow_rules').insert({
    condition_field: row.condition_field,
    condition_value: row.condition_value,
    action: row.action,
    enabled: row.enabled,
    sort_order: row.sort_order,
  });
  if (error) throw error;
}

export async function updateWorkflowRule(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<
    Pick<WorkflowRuleRow, 'condition_field' | 'condition_value' | 'action' | 'enabled' | 'sort_order'>
  >
): Promise<void> {
  const { error } = await supabase.from('workflow_rules').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteWorkflowRule(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('workflow_rules').delete().eq('id', id);
  if (error) throw error;
}
