import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Heart, MapPin, GraduationCap, UserPlus, UserMinus, Globe, Zap, Flame, BookOpen } from 'lucide-react';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import {
  countFollowers,
  followUserRow,
  getProfileByUsername,
  isFollowingUser,
  listPostsForAuthor,
  togglePostLike,
  unfollowUserRow,
  type FeedPost,
} from '../api/supabase-api';
import { paths } from '../paths';
import type { User } from '../data/mock-data';
import { firstNameOnly } from '../utils/display-name';
import { motion } from 'motion/react';
import { useSound } from '../audio/sound-context';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
];

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function xpLevel(xp: number): { level: number; label: string; progress: number; next: number } {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];
  const labels = ['Newcomer', 'Explorer', 'Contributor', 'Advocate', 'Champion', 'Leader', 'Expert', 'Elite', 'Legend', 'Icon'];
  let level = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) { level = i; break; }
  }
  const next = thresholds[level + 1] ?? thresholds[thresholds.length - 1];
  const prev = thresholds[level];
  const progress = next > prev ? Math.min(100, Math.round(((xp - prev) / (next - prev)) * 100)) : 100;
  return { level: level + 1, label: labels[level] ?? 'Icon', progress, next };
}

function ProfileSkeleton() {
  return (
    <div className="premium-page max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded-lg" />
      <div className="premium-panel p-5 sm:p-6">
        <div className="flex gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-2xl bg-muted shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-40 bg-muted rounded-lg" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded mt-4" />
          </div>
        </div>
      </div>
      <div className="premium-panel p-4 h-32 bg-muted rounded-2xl" />
    </div>
  );
}

export function ProfilePage() {
  const { username } = useParams();
  const { user: me, backendMode, refreshProfile } = useAuth();
  const { play } = useSound();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';
  const handle = username?.trim() ?? '';

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!cloud || !supabase || !handle) {
      setProfile(null);
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const p = await getProfileByUsername(supabase, handle, me?.email);
      setProfile(p);
      if (!p) { setPosts([]); setFollowers(0); return; }
      const [list, fc, fol] = await Promise.all([
        listPostsForAuthor(supabase, p.id, me?.id, 24),
        countFollowers(supabase, p.id),
        me && me.id !== p.id ? isFollowingUser(supabase, me.id, p.id) : Promise.resolve(false),
      ]);
      setPosts(list);
      setFollowers(fc);
      setFollowing(fol);
    } catch {
      setProfile(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [cloud, supabase, handle, me?.id, me?.email]);

  useEffect(() => { void load(); }, [load]);

  const toggleFollow = async () => {
    if (!cloud || !supabase || !me || !profile || me.id === profile.id) return;
    play('tap');
    setBusy(true);
    try {
      if (following) await unfollowUserRow(supabase, me.id, profile.id);
      else await followUserRow(supabase, me.id, profile.id);
      setFollowing(!following);
      setFollowers(f => Math.max(0, f + (following ? -1 : 1)));
      await refreshProfile();
    } finally {
      setBusy(false);
    }
  };

  const onToggleLike = async (post: FeedPost) => {
    if (!supabase || !me) return;
    play('tap');
    await togglePostLike(supabase, post.id, me.id, post.liked_by_me);
    await load();
  };

  if (!cloud) {
    return (
      <div className="premium-page max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Globe className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl mb-3" style={{ fontWeight: 700 }}>Profiles</h1>
        <p className="text-muted-foreground text-sm">
          Public profiles load from Supabase. Configure your env vars and run the migration to enable this view.
        </p>
        <Link to={paths.feed} className="text-primary text-sm mt-4 inline-block hover:underline">← Back to feed</Link>
      </div>
    );
  }

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="premium-page max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Profile not found.</p>
        <Link to={paths.feed} className="text-primary text-sm mt-4 inline-block hover:underline">← Campus feed</Link>
      </div>
    );
  }

  const isSelf = me?.id === profile.id;
  const { level, label, progress, next } = xpLevel(profile.uni_xp);
  const gradient = avatarGradient(profile.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="premium-page max-w-3xl mx-auto space-y-5"
    >
      <Link to={paths.feed} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Campus feed
      </Link>

      {/* Profile header */}
      <div className="premium-panel p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-3xl shrink-0`} style={{ fontWeight: 800 }}>
            {firstNameOnly(profile.name).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl" style={{ fontWeight: 800 }}>{profile.name}</h1>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">@{profile.username}</p>
              </div>
              {!isSelf && me && (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  disabled={busy}
                  onClick={() => void toggleFollow()}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors border ${
                    following
                      ? 'border-border bg-muted/40 hover:bg-muted'
                      : 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  } disabled:opacity-60`}
                >
                  {following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {following ? 'Unfollow' : 'Follow'}
                </motion.button>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-muted-foreground">
              {profile.university_name && (
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  {profile.university_name}
                </span>
              )}
              {profile.country_code && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {profile.country_code}
                </span>
              )}
              {profile.field_of_study && (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  {profile.field_of_study}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-foreground/80" style={{ fontWeight: 500 }}>
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {profile.streak}d streak
              </span>
              <span>{followers} followers</span>
            </div>

            {profile.bio && (
              <p className="text-sm mt-3 leading-relaxed text-foreground/85">{profile.bio}</p>
            )}

            {/* XP bar */}
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span style={{ fontWeight: 600 }} className="text-foreground">{profile.uni_xp} XP</span>
                  <span>· Level {level} — {label}</span>
                </span>
                <span>{next} XP</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/60">
            {profile.badges.map(badge => (
              <span key={badge} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs" style={{ fontWeight: 500 }}>
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Posts · {posts.length}</h2>
        <div className="space-y-3">
          {posts.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="premium-panel p-4 border-border/70 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  {p.topic && (
                    <span className="ml-2 text-primary font-medium">#{p.topic}</span>
                  )}
                </p>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{p.body}</p>
              <motion.button
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={() => void onToggleLike(p)}
                className={`inline-flex items-center gap-1.5 mt-3 text-sm transition-colors ${
                  p.liked_by_me ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${p.liked_by_me ? 'fill-current' : ''}`} />
                <span className="tabular-nums">{p.like_count}</span>
              </motion.button>
            </motion.article>
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-muted-foreground border border-dashed border-border rounded-2xl p-10 text-center">
              No posts yet.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
