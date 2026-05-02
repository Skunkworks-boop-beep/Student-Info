import { Medal, Zap, Flame, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { leaderboard, xpActions } from '../data/mock-data';
import { firstNameOnly, userPublicLabel } from '../utils/display-name';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import { fetchLeaderboardProfiles } from '../api/supabase-api';
import type { User } from '../data/mock-data';

export function LeaderboardPage() {
  const { user: sessionUser, anonymousMode, backendMode } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';
  const [rows, setRows] = useState<User[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!cloud) {
      setRows(leaderboard);
      setLoadError('');
      return;
    }
    if (!supabase) {
      setRows([]);
      setLoadError('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetchLeaderboardProfiles(supabase, 80);
        if (!cancelled) {
          setRows(r);
          setLoadError('');
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setLoadError(err instanceof Error ? err.message : 'Could not load leaderboard.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloud, supabase]);

  const sorted = [...rows].sort((a, b) => b.uni_xp - a.uni_xp);
  const myIdx = sessionUser ? sorted.findIndex(u => u.id === sessionUser.id) : -1;
  const myRank = myIdx >= 0 ? myIdx + 1 : null;

  const labelFor = (entry: User) => {
    if (sessionUser && entry.id === sessionUser.id) {
      return userPublicLabel(sessionUser, anonymousMode);
    }
    return firstNameOnly(entry.name);
  };

  const topColors = ['bg-yellow-500', 'bg-gray-400', 'bg-amber-700'];
  const topIcons = [Crown, Medal, Medal];

  return (
    <div className="premium-page max-w-5xl">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 700 }}>UNI XP Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cloud
            ? 'Live rankings from your Supabase project — XP updates when students post thoughts, comments, and campus updates.'
            : 'Rankings and XP actions come from the built-in sample roster for local demo mode.'}
          {loadError && cloud && (
            <span className="block mt-2 text-red-600 dark:text-red-400">{loadError}</span>
          )}
          {anonymousMode && sessionUser && (
            <span className="block mt-1 text-foreground/80">
              Your row uses your username because anonymous mode is on (toggle on the dashboard).
            </span>
          )}
        </p>
      </div>

      {/* Your rank */}
      <div className="bg-gradient-to-r from-primary to-primary/70 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg" style={{ fontWeight: 700 }}>
              {myRank != null ? `#${myRank}` : '—'}
            </div>
            <div>
              <p style={{ fontWeight: 600 }}>{sessionUser ? userPublicLabel(sessionUser, anonymousMode) : '—'}</p>
              <p className="text-sm opacity-80">
                {myRank != null ? 'Your current ranking' : cloud ? 'Complete a profile activity to appear here' : 'Your account is not on the demo leaderboard'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Zap className="w-5 h-5" />
              <span className="text-3xl" style={{ fontWeight: 700 }}>{sessionUser?.uni_xp ?? 0}</span>
            </div>
            <p className="text-xs opacity-80">XP Points</p>
          </div>
        </div>
      </div>

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-4 py-4">
        {[1, 0, 2].map(idx => {
          const entry = sorted[idx];
          if (!entry) return null;
          const rank = idx + 1;
          const Icon = topIcons[idx];
          const display = labelFor(entry);
          return (
            <div key={entry.id} className={`flex flex-col items-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
              <Icon className={`w-6 h-6 mb-2 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`} />
              <div className={`w-14 h-14 rounded-full ${topColors[idx]} flex items-center justify-center text-white text-lg mb-2`} style={{ fontWeight: 700 }}>
                {display.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm" style={{ fontWeight: 600 }}>{display}</p>
              <p className="text-xs text-muted-foreground">{entry.uni_xp} XP</p>
              <div className={`mt-2 w-20 ${idx === 0 ? 'h-20 bg-yellow-100 dark:bg-yellow-900/20' : idx === 1 ? 'h-14 bg-gray-100 dark:bg-gray-800' : 'h-10 bg-amber-100 dark:bg-amber-900/20'} rounded-t-lg flex items-center justify-center`}>
                <span className="text-lg" style={{ fontWeight: 700 }}>#{rank}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="premium-panel overflow-hidden">
        {sorted.map((entry, i) => {
          const display = labelFor(entry);
          const isSelf = sessionUser && entry.id === sessionUser.id;
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-4 p-4 border-b border-border last:border-0 ${isSelf ? 'bg-secondary/50' : ''}`}
            >
              <span className="w-8 text-center text-sm text-muted-foreground" style={{ fontWeight: 600 }}>#{i + 1}</span>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm" style={{ fontWeight: 600 }}>
                {display.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>{display}</p>
                <div className="flex items-center gap-2">
                  {entry.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-primary">
                      <Flame className="w-3 h-3" />{entry.streak}d
                    </span>
                  )}
                  {entry.badges.length > 0 && (
                    <span className="text-xs text-muted-foreground">{entry.badges[0]}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm shrink-0" style={{ fontWeight: 600 }}>
                <Zap className="w-4 h-4 text-primary" />
                {entry.uni_xp}
              </div>
            </div>
          );
        })}
      </div>

      {/* XP Guide */}
      <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
        <h3 className="text-sm mb-2" style={{ fontWeight: 600 }}>How to earn XP</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {xpActions.map((action, i) => (
            <li key={i}>• {action.action}: <span className="text-primary" style={{ fontWeight: 600 }}>{action.xp}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
