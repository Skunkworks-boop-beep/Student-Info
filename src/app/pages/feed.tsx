import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { Globe, Heart, MessageCircle, Users, Send, Hash, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import {
  addPostCommentRow,
  createPostRow,
  listPostComments,
  listPostsFromFollowing,
  listPostsGlobal,
  togglePostLike,
  type FeedPost,
  type PostComment,
} from '../api/supabase-api';
import { paths } from '../paths';
import { firstNameOnly } from '../utils/display-name';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../audio/sound-context';

function PostSkeleton() {
  return (
    <div className="premium-panel p-4 sm:p-5 border-border/70 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 bg-muted rounded-lg" />
          <div className="h-3 w-24 bg-muted rounded-lg" />
          <div className="h-4 w-full bg-muted rounded-lg mt-3" />
          <div className="h-4 w-4/5 bg-muted rounded-lg" />
          <div className="flex gap-4 mt-3">
            <div className="h-3 w-12 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function FeedPage() {
  const { user, backendMode, refreshProfile } = useAuth();
  const { play } = useSound();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';
  const [tab, setTab] = useState<'global' | 'following'>('global');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState('');
  const [sending, setSending] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { liked: boolean; count: number }>>({});

  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [threadComments, setThreadComments] = useState<PostComment[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSending, setCommentSending] = useState(false);

  const load = useCallback(async () => {
    if (!cloud || !supabase) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const list =
        tab === 'following' && user
          ? await listPostsFromFollowing(supabase, user.id, 40)
          : await listPostsGlobal(supabase, user?.id, 40);
      setPosts(list);
      setOptimisticLikes({});
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [cloud, supabase, tab, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!openPostId || !supabase) {
      setThreadComments([]);
      return;
    }
    let cancelled = false;
    setThreadLoading(true);
    void listPostComments(supabase, openPostId)
      .then(rows => { if (!cancelled) setThreadComments(rows); })
      .catch(() => { if (!cancelled) setThreadComments([]); })
      .finally(() => { if (!cancelled) setThreadLoading(false); });
    return () => { cancelled = true; };
  }, [openPostId, supabase]);

  const toggleThread = (postId: string) => {
    if (openPostId === postId) {
      setOpenPostId(null);
      setCommentDraft('');
      return;
    }
    setOpenPostId(postId);
    setCommentDraft('');
  };

  const submitPost = async () => {
    if (!cloud || !supabase || !user || !body.trim()) return;
    setSending(true);
    try {
      const t = topic.trim().replace(/^#/u, '') || null;
      await createPostRow(supabase, user.id, body.trim(), t, []);
      setBody('');
      setTopic('');
      play('success');
      await refreshProfile();
      await load();
    } finally {
      setSending(false);
    }
  };

  const toggleLike = async (p: FeedPost) => {
    if (!cloud || !supabase || !user) return;
    const current = optimisticLikes[p.id] ?? { liked: p.liked_by_me, count: p.like_count };
    const newLiked = !current.liked;
    play('tap');
    setOptimisticLikes(prev => ({
      ...prev,
      [p.id]: { liked: newLiked, count: current.count + (newLiked ? 1 : -1) },
    }));
    try {
      await togglePostLike(supabase, p.id, user.id, p.liked_by_me);
      await refreshProfile();
    } catch {
      setOptimisticLikes(prev => ({ ...prev, [p.id]: current }));
    }
  };

  const sendComment = async () => {
    if (!cloud || !supabase || !user || !openPostId || !commentDraft.trim()) return;
    setCommentSending(true);
    play('send');
    try {
      await addPostCommentRow(supabase, {
        post_id: openPostId,
        user_id: user.id,
        text: commentDraft.trim(),
      });
      setCommentDraft('');
      const rows = await listPostComments(supabase, openPostId);
      setThreadComments(rows);
      await load();
      await refreshProfile();
      play('success');
    } finally {
      setCommentSending(false);
    }
  };

  if (!cloud) {
    return (
      <div className="premium-page max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Globe className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl mb-3" style={{ fontWeight: 700 }}>Campus feed</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
          The social feed is powered by your Supabase project. Add{' '}
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</span>{' '}
          to your environment, run the migrations, then refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="premium-page max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl" style={{ fontWeight: 800 }}>Campus feed</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Short updates from students everywhere — like, reply, and follow peers.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-muted/40 border border-border/80 w-fit">
        {(['global', 'following'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {t === 'global' ? <Globe className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              {t === 'global' ? 'Global' : 'Following'}
            </span>
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="premium-panel p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-8 h-8 rounded-full ${avatarColor(user?.name ?? 'U')} flex items-center justify-center text-white text-sm shrink-0`} style={{ fontWeight: 700 }}>
            {firstNameOnly(user?.name ?? 'U').charAt(0).toUpperCase()}
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">New post</p>
        </div>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="What's happening on campus?"
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm resize-none"
        />
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Topic (e.g. finals, housing)"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-input-background border border-border text-sm focus:ring-2 focus:ring-primary/40 outline-none"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {body.length > 0 && (
              <span className={`text-xs tabular-nums ${body.length > 450 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {500 - body.length}
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              disabled={!body.trim() || sending}
              onClick={() => void submitPost()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 shrink-0 transition-colors"
            >
              {sending ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </motion.button>
          </div>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
        </div>
      )}

      {!loading && tab === 'following' && posts.length === 0 && (
        <div className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border p-10 text-center space-y-2">
          <Users className="w-8 h-8 mx-auto text-muted-foreground/50" />
          <p style={{ fontWeight: 500 }}>No posts from people you follow yet.</p>
          <p className="text-xs">Visit a profile and tap Follow, or switch to Global.</p>
        </div>
      )}

      {!loading && tab === 'global' && posts.length === 0 && (
        <div className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border p-10 text-center space-y-2">
          <Globe className="w-8 h-8 mx-auto text-muted-foreground/50" />
          <p style={{ fontWeight: 500 }}>No posts yet — be the first!</p>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {posts.map((p, idx) => {
            const expanded = openPostId === p.id;
            const optimistic = optimisticLikes[p.id];
            const liked = optimistic?.liked ?? p.liked_by_me;
            const likeCount = optimistic?.count ?? p.like_count;
            const color = avatarColor(p.author_display);
            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                layout
                className="premium-panel premium-hover-lift p-4 sm:p-5 border-border/70"
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm shrink-0`} style={{ fontWeight: 700 }}>
                    {firstNameOnly(p.author_display).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <Link
                        to={paths.profile(p.author_username)}
                        className="text-sm hover:text-primary transition-colors"
                        style={{ fontWeight: 700 }}
                      >
                        {p.author_display}
                      </Link>
                      <span className="text-xs text-muted-foreground font-mono">@{p.author_username}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {p.topic && (
                      <span className="inline-block mt-1.5 text-xs rounded-full bg-primary/10 text-primary px-2.5 py-0.5" style={{ fontWeight: 500 }}>
                        #{p.topic}
                      </span>
                    )}
                    <p className="text-sm mt-2 leading-relaxed text-foreground/90 whitespace-pre-wrap">{p.body}</p>
                    <div className="flex items-center gap-5 mt-3 flex-wrap">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        type="button"
                        onClick={() => void toggleLike(p)}
                        className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                          liked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
                        <span className="tabular-nums">{likeCount}</span>
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => toggleThread(p.id)}
                        className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                          expanded ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="tabular-nums">{p.comment_count}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border/80 space-y-3">
                            {threadLoading && (
                              <div className="space-y-2 animate-pulse">
                                <div className="h-3 w-full bg-muted rounded" />
                                <div className="h-3 w-3/4 bg-muted rounded" />
                              </div>
                            )}
                            {!threadLoading && threadComments.map(cm => (
                              <div key={cm.id} className="flex gap-2.5 text-sm">
                                <div className={`w-7 h-7 rounded-full ${avatarColor(cm.user_name)} flex items-center justify-center text-white text-[10px] shrink-0`} style={{ fontWeight: 700 }}>
                                  {firstNameOnly(cm.user_name).charAt(0)}
                                </div>
                                <div className="min-w-0 bg-muted/40 rounded-2xl rounded-tl-sm px-3 py-2 flex-1">
                                  <p className="text-xs mb-0.5">
                                    <span style={{ fontWeight: 600 }}>{firstNameOnly(cm.user_name)}</span>
                                    <span className="text-muted-foreground ml-2">
                                      {formatDistanceToNow(new Date(cm.created_at), { addSuffix: true })}
                                    </span>
                                  </p>
                                  <p className="leading-relaxed">{cm.text}</p>
                                </div>
                              </div>
                            ))}
                            {!threadLoading && threadComments.length === 0 && (
                              <p className="text-xs text-muted-foreground">No replies yet.</p>
                            )}
                            {user && (
                              <div className="flex gap-2 pt-1">
                                <div className={`w-7 h-7 rounded-full ${avatarColor(user.name)} flex items-center justify-center text-white text-[10px] shrink-0`} style={{ fontWeight: 700 }}>
                                  {firstNameOnly(user.name).charAt(0)}
                                </div>
                                <input
                                  value={commentDraft}
                                  onChange={e => setCommentDraft(e.target.value)}
                                  placeholder="Write a reply…"
                                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-input-background border border-border text-sm focus:ring-2 focus:ring-primary/40 outline-none"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      void sendComment();
                                    }
                                  }}
                                />
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  type="button"
                                  disabled={!commentDraft.trim() || commentSending}
                                  onClick={() => void sendComment()}
                                  className="p-2.5 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50 transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
