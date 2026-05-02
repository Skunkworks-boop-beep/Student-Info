import { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, Zap, Ban, RotateCcw, Crosshair, Mail, Calendar, MessageSquare, Hash, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { complaints, leaderboard, type User } from '../data/mock-data';
import { firstNameOnly } from '../utils/display-name';
import { adminTactical } from '../admin-tactical-ui';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import { listComplaints, listProfilesRoster } from '../api/supabase-api';
import type { Complaint } from '../data/mock-data';

function displayEmail(u: User): string {
  if (u.email?.trim()) return u.email;
  const slug = firstNameOnly(u.name).toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  return `${slug}.${u.id.slice(0, 8)}@students.profile`;
}

function memberSinceLabel(created: string): string {
  if (!created?.trim()) return '—';
  try {
    return format(new Date(created), 'MMM d, yyyy');
  } catch {
    return created;
  }
}

function userInsights(userId: string, thoughtData: Complaint[]) {
  let reports = 0;
  let replies = 0;
  const times: number[] = [];
  for (const c of thoughtData) {
    if (c.user_id === userId) {
      reports += 1;
      times.push(new Date(c.updated_at).getTime(), new Date(c.created_at).getTime());
    }
    for (const cm of c.comments) {
      if (cm.user_id === userId) {
        replies += 1;
        times.push(new Date(cm.created_at).getTime());
      }
    }
  }
  const lastActive = times.length ? new Date(Math.max(...times)) : null;
  return { reports, replies, lastActive };
}

export function AdminUsersPage() {
  const { backendMode } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';

  const [roster, setRoster] = useState<User[]>([]);
  const [thoughtData, setThoughtData] = useState<Complaint[]>([]);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!cloud || !supabase) {
      setRoster(leaderboard);
      setThoughtData(complaints);
      setLoadError(false);
      return;
    }
    try {
      const [profiles, thoughts] = await Promise.all([
        listProfilesRoster(supabase, 300),
        listComplaints(supabase, undefined),
      ]);
      setRoster(profiles);
      setThoughtData(thoughts);
      setLoadError(false);
    } catch {
      setRoster([]);
      setThoughtData([]);
      setLoadError(true);
    }
  }, [cloud, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const [search, setSearch] = useState('');
  const users = useMemo(
    () =>
      roster.filter(
        u =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
          displayEmail(u).toLowerCase().includes(search.toLowerCase()) ||
          u.id.toLowerCase().includes(search.toLowerCase())
      ),
    [search, roster]
  );

  return (
    <div className="premium-page max-w-6xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
      >
        <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
        <div className={`pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.45] ${adminTactical.gridBg}`} />
        <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${adminTactical.borderSoft} bg-background/60 ${adminTactical.label}`}
              >
                <Crosshair className="w-3 h-3 text-[#5c6b4a] dark:text-[#8faa7a]" />
                Admin ops
              </span>
              <h1 className="text-2xl sm:text-3xl leading-none truncate" style={{ fontWeight: 800 }}>
                User roster
              </h1>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border ${adminTactical.borderSoft} text-muted-foreground`}
              >
                {roster.length} profiles
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            {cloud
              ? loadError
                ? 'Could not load the roster from Supabase. Confirm you are signed in as admin and that RLS policies allow reading profiles and complaints.'
                : 'Live roster from Supabase profiles. Email login addresses live in Auth — values shown here are display placeholders unless you extend the schema.'
              : 'Leaderboard-derived roster with sample emails, UNI XP, streaks, badges, and activity inferred from static thought and comment data.'}
          </p>
        </div>
      </motion.div>

      <div className={`relative overflow-hidden rounded-2xl ${adminTactical.borderSoft} ${adminTactical.panelInner}`}>
        <div className={`pointer-events-none absolute inset-0 opacity-30 ${adminTactical.gridBg}`} />
        <div className="relative p-3 sm:p-4">
          <p className={`${adminTactical.label} mb-2`}>Filter</p>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, handle, or ID…"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/80 border ${adminTactical.borderSoft} focus:ring-2 focus:ring-primary/40 outline-none text-sm`}
            />
          </div>
        </div>
      </div>

      {loadError && cloud && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center py-4">
          Failed to load live roster.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users.map((u, i) => {
          const { reports, replies, lastActive } = userInsights(u.id, thoughtData);
          const displayName = firstNameOnly(u.name);
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
            >
              <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
              <div className={`pointer-events-none absolute inset-0 opacity-[0.25] dark:opacity-[0.4] ${adminTactical.gridBg}`} />
              <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base shrink-0 border-2 border-[#6f7a5e]/40 dark:border-[#4a5c46]/60 bg-[#9faa8c]/25 dark:bg-[#2a3528]/50`}
                      style={{ fontWeight: 700 }}
                    >
                      {displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base truncate" style={{ fontWeight: 700 }}>
                          {displayName}
                        </p>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${adminTactical.borderSoft} text-muted-foreground`}
                        >
                          {u.role}
                        </span>
                      </div>
                      {u.username && (
                        <p className={`${adminTactical.label} mt-0.5`}>@{u.username}</p>
                      )}
                      <p className={`${adminTactical.label} mt-1`}>ID · {u.id}</p>
                      <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 shrink-0 mt-0.5 text-[#5c6b4a] dark:text-[#8faa7a]" />
                        <span className="break-all">{displayEmail(u)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      className={`p-2 rounded-xl border ${adminTactical.borderSoft} hover:bg-accent/80 transition-colors text-muted-foreground`}
                      title="Use Supabase Auth admin to reset password"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-xl border border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
                      title="Use Supabase dashboard to ban or delete user"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className={`rounded-xl ${adminTactical.borderSoft} bg-background/50 p-3`}>
                    <p className={`${adminTactical.label} mb-1`}>Uni XP</p>
                    <p className="text-lg flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                      <Zap className="w-4 h-4 text-primary shrink-0" />
                      {u.uni_xp}
                    </p>
                  </div>
                  <div className={`rounded-xl ${adminTactical.borderSoft} bg-background/50 p-3`}>
                    <p className={`${adminTactical.label} mb-1`}>Streak</p>
                    <p className="text-lg" style={{ fontWeight: 700 }}>
                      {u.streak}d
                    </p>
                  </div>
                  <div className={`rounded-xl ${adminTactical.borderSoft} bg-background/50 p-3 col-span-2 sm:col-span-1`}>
                    <p className={`${adminTactical.label} mb-1 flex items-center gap-1`}>
                      <Calendar className="w-3 h-3" />
                      Member since
                    </p>
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      {memberSinceLabel(u.created_at)}
                    </p>
                  </div>
                  <div className={`rounded-xl ${adminTactical.borderSoft} bg-background/50 p-3`}>
                    <p className={`${adminTactical.label} mb-1 flex items-center gap-1`}>
                      <Hash className="w-3 h-3" />
                      Reports
                    </p>
                    <p className="text-lg" style={{ fontWeight: 700 }}>
                      {reports}
                    </p>
                  </div>
                  <div className={`rounded-xl ${adminTactical.borderSoft} bg-background/50 p-3`}>
                    <p className={`${adminTactical.label} mb-1 flex items-center gap-1`}>
                      <MessageSquare className="w-3 h-3" />
                      Thread replies
                    </p>
                    <p className="text-lg" style={{ fontWeight: 700 }}>
                      {replies}
                    </p>
                  </div>
                  <div className={`rounded-xl ${adminTactical.borderSoft} bg-background/50 p-3 col-span-2 sm:col-span-1`}>
                    <p className={`${adminTactical.label} mb-1 flex items-center gap-1`}>
                      <Activity className="w-3 h-3" />
                      Last activity
                    </p>
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      {lastActive ? formatDistanceToNow(lastActive, { addSuffix: true }) : '—'}
                    </p>
                  </div>
                </div>

                {u.badges.length > 0 && (
                  <div className="mt-4">
                    <p className={`${adminTactical.label} mb-2`}>Badges</p>
                    <div className="flex flex-wrap gap-1.5">
                      {u.badges.map(b => (
                        <span
                          key={b}
                          className={`text-xs px-2 py-1 rounded-md border ${adminTactical.borderSoft} bg-background/60 text-foreground/90`}
                          style={{ fontWeight: 500 }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {users.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No users match your search.</p>
      )}
    </div>
  );
}
