import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { Globe, Heart, MessageCircle, Users, Send, Hash, ChevronDown } from 'lucide-react';
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

export function FeedPage() {
  const { user, backendMode, refreshProfile } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';
  const [tab, setTab] = useState<'global' | 'following'>('global');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState('');
  const [sending, setSending] = useState(false);

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
      .then(rows => {
        if (!cancelled) setThreadComments(rows);
      })
      .catch(() => {
        if (!cancelled) setThreadComments([]);
      })
      .finally(() => {
        if (!cancelled) setThreadLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      await refreshProfile();
      await load();
    } finally {
      setSending(false);
    }
  };

  const toggleLike = async (p: FeedPost) => {
    if (!cloud || !supabase || !user) return;
    try {
      await togglePostLike(supabase, p.id, user.id, p.liked_by_me);
      await load();
      await refreshProfile();
    } catch {
      /* toast optional */
    }
  };

  const sendComment = async () => {
    if (!cloud || !supabase || !user || !openPostId || !commentDraft.trim()) return;
    setCommentSending(true);
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
    } finally {
      setCommentSending(false);
    }
  };

  if (!cloud) {
    return (
      <div className="premium-page max-w-2xl mx-auto text-center py-16">
        <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl mb-2" style={{ fontWeight: 700 }}>Campus feed</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The social feed uses your Supabase project. Add <span className="font-mono text-xs">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</span> to your environment, run the SQL migration in{' '}
          <span className="font-mono text-xs">supabase/migrations/</span>, then refresh — students worldwide can share updates, tag topics, and follow peers.
        </p>
      </div>
    );
  }

  return (
    <div className="premium-page max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl" style={{ fontWeight: 800 }}>Campus feed</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Short updates from students everywhere — like posts, open threads to reply, visit profiles, and switch between the full firehose and people you follow.
        </p>
      </div>

      <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 border border-border/80 w-fit">
        <button
          type="button"
          onClick={() => setTab('global')}
          className={`px-4 py-2 rounded-xl text-sm transition-colors ${tab === 'global' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Globe className="w-4 h-4" /> Global
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab('following')}
          className={`px-4 py-2 rounded-xl text-sm transition-colors ${tab === 'following' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Following
          </span>
        </button>
      </div>

      <div className="premium-panel p-4 space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">New post</p>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="What's happening on campus?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm resize-none"
        />
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Topic (optional, e.g. finals or housing)"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-input-background border border-border text-sm"
            />
          </div>
          <button
            type="button"
            disabled={!body.trim() || sending}
            onClick={() => void submitPost()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
            Post
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && tab === 'following' && posts.length === 0 && (
        <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">
          No posts from people you follow yet. Open a profile and tap Follow, or switch to Global.
        </p>
      )}

      <div className="space-y-4">
        {posts.map(p => {
          const expanded = openPostId === p.id;
          return (
            <motion.article
              key={p.id}
              layout
              className="premium-panel premium-hover-lift p-4 sm:p-5 border-border/70"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0" style={{ fontWeight: 700 }}>
                  {firstNameOnly(p.author_display).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Link
                      to={paths.profile(p.author_username)}
                      className="text-sm hover:text-primary transition-colors truncate"
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
                    <span className="inline-block mt-2 text-xs rounded-full bg-primary/10 text-primary px-2.5 py-0.5 font-medium">
                      #{p.topic}
                    </span>
                  )}
                  <p className="text-sm mt-2 leading-relaxed text-foreground/90 whitespace-pre-wrap">{p.body}</p>
                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => void toggleLike(p)}
                      className={`inline-flex items-center gap-1.5 text-xs sm:text-sm transition-colors ${
                        p.liked_by_me ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${p.liked_by_me ? 'fill-current' : ''}`} />
                      {p.like_count}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleThread(p.id)}
                      className={`inline-flex items-center gap-1 text-xs sm:text-sm transition-colors ${
                        expanded ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {p.comment_count}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border/80 space-y-3">
                          {threadLoading && (
                            <p className="text-xs text-muted-foreground">Loading comments…</p>
                          )}
                          {!threadLoading &&
                            threadComments.map(cm => (
                              <div key={cm.id} className="flex gap-2 text-sm">
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0" style={{ fontWeight: 700 }}>
                                  {firstNameOnly(cm.user_name).charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground mb-0.5">
                                    <span style={{ fontWeight: 600 }} className="text-foreground">
                                      {firstNameOnly(cm.user_name)}
                                    </span>{' '}
                                    · {formatDistanceToNow(new Date(cm.created_at), { addSuffix: true })}
                                  </p>
                                  <p className="leading-relaxed">{cm.text}</p>
                                </div>
                              </div>
                            ))}
                          {!threadLoading && threadComments.length === 0 && (
                            <p className="text-xs text-muted-foreground">No replies yet.</p>
                          )}
                          {user && (
                            <div className="flex gap-2 pt-2">
                              <input
                                value={commentDraft}
                                onChange={e => setCommentDraft(e.target.value)}
                                placeholder="Write a reply…"
                                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-input-background border border-border text-sm"
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    void sendComment();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={!commentDraft.trim() || commentSending}
                                onClick={() => void sendComment()}
                                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50"
                              >
                                <Send className="w-4 h-4" />
                              </button>
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
      </div>
    </div>
  );
}
