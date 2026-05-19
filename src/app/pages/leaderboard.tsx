import { Medal, Zap, Flame, Crown, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { leaderboard, xpActions } from '../data/mock-data';
import { firstNameOnly, userPublicLabel } from '../utils/display-name';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import { fetchLeaderboardProfiles } from '../api/supabase-api';
import type { User } from '../data/mock-data';
import { motion, AnimatePresence } from 'motion/react';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function LeaderboardSkeleton() {
  return (
    <div className="premium-panel overflow-hidden animate-pulse">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
          <div className="w-8 h-4 bg-muted rounded" />
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 bg-muted rounded" />
            <div className="h-1.5 w-full bg-muted rounded-full" />
          </div>
          <div className="w-12 h-4 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardPage() {
  const { user: sessionUser, anonymousMode, backendMode } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';
  const [rows, setRows] = useState<User[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cloud) {
      setRows(leaderboard);
      setLoadError('');
      setLoading(false);
      return;
    }
    if (!supabase) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await fetchLeaderboardProfiles(supabase, 80);
        if (!cancelled) { setRows(r); setLoadError(''); }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setLoadError(err instanceof Error ? err.message : 'Could not load leaderboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cloud, supabase]);

  const sorted = [...rows].sort((a, b) => b.uni_xp - a.uni_xp);
  const topXP = sorted[0]?.uni_xp ?? 1;
  const myIdx = sessionUser ? sorted.findIndex(u => u.id === sessionUser.id) : -1;
  const myRank = myIdx >= 0 ? myIdx + 1 : null;

  const labelFor = (entry: User) => {
    if (sessionUser && entry.id === sessionUser.id) return userPublicLabel(sessionUser, anonymousMode);
    return firstNameOnly(entry.name);
  };

  const topIcons = [Crown, Medal, Medal];
  const topRingColors = [
    'ring-4 ring-yellow-400/50',
    'ring-4 ring-gray-300/50',
    'ring-4 ring-amber-600/40',
  ];
  const podiumHeights = ['h-24', 'h-16', 'h-12'];
  const podiumBg = ['bg-yellow-400/15 dark:bg-yellow-400/10', 'bg-gray-300/20 dark:bg-gray-400/10', 'bg-amber-700/15 dark:bg-amber-700/10'];

  return (
    <div className="premium-page max-w-5xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl" style={{ fontWeight: 700 }}>UNI XP Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cloud ? 'Live rankings — XP updates when students engage with the platform.' : 'Rankings from the built-in sample roster.'}
          {loadError && cloud && (
            <span className="block mt-1 text-red-600 dark:text-red-400">{loadError}</span>
          )}
        </p>
      </motion.div>

      {/* Your rank card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/85 to-primary/70 p-5 text-white"
      >
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#fff_1px,transparent_1px),linear-gradient(-45deg,#fff_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-xl" style={{ fontWeight: 700 }}>
              {myRank != null ? `#${myRank}` : <Trophy className="w-6 h-6" />}
            </div>
            <div>
              <p style={{ fontWeight: 700 }} className="text-lg">
                {sessionUser ? userPublicLabel(sessionUser, anonymousMode) : 'Your rank'}
              </p>
              <p className="text-sm opacity-80">
                {myRank != null ? 'Your current ranking' : 'Submit a thought to appear on the board'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 justify-end">
              <Zap className="w-5 h-5" />
              <span className="text-3xl tabular-nums" style={{ fontWeight: 700 }}>
                {sessionUser?.uni_xp ?? 0}
              </span>
            </div>
            <p className="text-xs opacity-70 mt-0.5">XP Points</p>
          </div>
        </div>
      </motion.div>

      {/* Top 3 podium */}
      {!loading && sorted.length >= 3 && (
        <div className="flex items-end justify-center gap-3 sm:gap-6 py-4">
          {[1, 0, 2].map(idx => {
            const entry = sorted[idx];
            if (!entry) return null;
            const rank = idx + 1;
            const Icon = topIcons[idx];
            const display = labelFor(entry);
            const color = avatarColor(entry.name);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                className={`flex flex-col items-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`} />
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${color} ${topRingColors[idx]} flex items-center justify-center text-white text-base sm:text-lg mb-1.5`} style={{ fontWeight: 700 }}>
                  {display.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs sm:text-sm text-center" style={{ fontWeight: 600 }}>{display}</p>
                <p className="text-[11px] text-muted-foreground">{entry.uni_xp} XP</p>
                <div className={`mt-2 w-16 sm:w-20 ${podiumHeights[idx]} ${podiumBg[idx]} rounded-t-xl flex items-center justify-center`}>
                  <span className="text-base" style={{ fontWeight: 700 }}>#{rank}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {loading ? <LeaderboardSkeleton /> : (
        <div className="premium-panel overflow-hidden">
          <AnimatePresence initial={false}>
            {sorted.map((entry, i) => {
              const display = labelFor(entry);
              const isSelf = sessionUser && entry.id === sessionUser.id;
              const color = avatarColor(entry.name);
              const xpPct = topXP > 0 ? Math.round((entry.uni_xp / topXP) * 100) : 0;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 sm:gap-4 p-4 border-b border-border last:border-0 transition-colors ${
                    isSelf ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-accent/30'
                  }`}
                >
                  <span className="w-7 text-center text-sm text-muted-foreground shrink-0 tabular-nums" style={{ fontWeight: 600 }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}
                  </span>
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm shrink-0`} style={{ fontWeight: 700 }}>
                    {display.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm truncate" style={{ fontWeight: isSelf ? 700 : 500 }}>{display}</p>
                      {entry.streak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-orange-500 shrink-0">
                          <Flame className="w-3 h-3" />{entry.streak}d
                        </span>
                      )}
                      {entry.badges[0] && (
                        <span className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">{entry.badges[0]}</span>
                      )}
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isSelf ? 'bg-primary' : 'bg-primary/50'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.02, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm shrink-0" style={{ fontWeight: 600 }}>
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="tabular-nums">{entry.uni_xp}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* XP Guide */}
      <div className="p-4 sm:p-5 bg-muted/30 rounded-2xl border border-border/60">
        <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>How to earn XP</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {xpActions.map((action, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">· {action.action}</span>
              <span className="text-primary tabular-nums" style={{ fontWeight: 600 }}>{action.xp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
