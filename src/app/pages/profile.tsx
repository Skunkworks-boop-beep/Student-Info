import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Heart, MapPin, GraduationCap, UserPlus, UserMinus, Globe } from 'lucide-react';
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

export function ProfilePage() {
  const { username } = useParams();
  const { user: me, backendMode, refreshProfile } = useAuth();
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
      if (!p) {
        setPosts([]);
        setFollowers(0);
        return;
      }
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

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async () => {
    if (!cloud || !supabase || !me || !profile || me.id === profile.id) return;
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
    await togglePostLike(supabase, post.id, me.id, post.liked_by_me);
    await load();
  };

  if (!cloud) {
    return (
      <div className="premium-page max-w-2xl mx-auto text-center py-16">
        <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl mb-2" style={{ fontWeight: 700 }}>Profiles</h1>
        <p className="text-muted-foreground text-sm">
          Public profiles load from Supabase. Configure your env vars and run the project migration to enable this view.
        </p>
        <Link to={paths.feed} className="text-primary text-sm mt-4 inline-block hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-16 text-sm text-muted-foreground">Loading profile…</div>;
  }

  if (!profile) {
    return (
      <div className="premium-page max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Profile not found.</p>
        <Link to={paths.feed} className="text-primary text-sm mt-4 inline-block hover:underline">
          ← Campus feed
        </Link>
      </div>
    );
  }

  const isSelf = me?.id === profile.id;

  return (
    <div className="premium-page max-w-3xl mx-auto space-y-6">
      <Link to={paths.feed} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Campus feed
      </Link>

      <div className="premium-panel p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl shrink-0" style={{ fontWeight: 800 }}>
            {firstNameOnly(profile.name).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl" style={{ fontWeight: 800 }}>{profile.name}</h1>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">@{profile.username}</p>
              </div>
              {!isSelf && me && (
                <button
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
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs sm:text-sm text-muted-foreground">
              {profile.university_name && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {profile.university_name}
                </span>
              )}
              {profile.country_code && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.country_code}
                </span>
              )}
              <span>{followers} followers</span>
              <span className="text-primary font-semibold tabular-nums">{profile.uni_xp} XP</span>
            </div>
            {profile.field_of_study && (
              <p className="text-xs text-muted-foreground mt-2">Studying {profile.field_of_study}</p>
            )}
            {profile.bio && (
              <p className="text-sm mt-3 leading-relaxed text-foreground/90">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Posts</h2>
        <div className="space-y-3">
          {posts.map(p => (
            <article key={p.id} className="premium-panel p-4 border-border/70">
              <p className="text-xs text-muted-foreground mb-2">
                {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                {p.topic && <span className="ml-2 text-primary font-medium">#{p.topic}</span>}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.body}</p>
              <button
                type="button"
                onClick={() => void onToggleLike(p)}
                className={`inline-flex items-center gap-1.5 mt-3 text-xs ${
                  p.liked_by_me ? 'text-rose-500' : 'text-muted-foreground'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${p.liked_by_me ? 'fill-current' : ''}`} />
                {p.like_count}
              </button>
            </article>
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-8 text-center">
              No posts yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
