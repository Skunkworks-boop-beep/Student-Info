import { Link } from 'react-router';
import { paths } from '../paths';
import {
  Search,
  Bell,
  MapPin,
  Mail,
  Phone,
  Clock3,
  ArrowUpRight,
  PlusCircle,
  Users,
  Activity,
  CircleDot,
  Crosshair,
  Radio,
} from 'lucide-react';
import { complaints, leaderboard } from '../data/mock-data';
import { StatusBadge, PriorityBadge } from '../components/status-badge';
import { useAuth } from '../components/auth-context';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

/** Shared tactical chrome — aligns with campus map / landing framework panels */
const tactical = {
  border: 'border-2 border-[#6f7a5e]/45 dark:border-[#4a5c46]/70',
  borderSoft: 'border border-[#6f7a5e]/35 dark:border-[#3d4a38]/55',
  gridBg:
    'bg-[linear-gradient(rgba(60,80,50,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(60,80,50,0.06)_1px,transparent_1px)] bg-[size:24px_24px]',
  wash: 'bg-gradient-to-br from-[#5c6b4a]/[0.07] via-transparent to-[#8b7355]/[0.06] dark:from-[#2a3528]/35 dark:to-[#1a1f16]/40',
  label: 'text-[10px] font-mono uppercase tracking-[0.18em] text-[#3d4a38] dark:text-[#9faa8c]',
  panelInner: 'bg-card/80 dark:bg-card/60 backdrop-blur-[2px]',
};

export function DashboardPage() {
  const { user } = useAuth();
  const myComplaints = complaints.filter(c => c.user_id === user?.id);
  const pending = myComplaints.filter(c => c.status === 'Pending').length;
  const resolved = myComplaints.filter(c => c.status === 'Resolved').length;
  const processing = myComplaints.filter(c => c.status === 'Processing').length;
  const activeStudents = leaderboard.slice(0, 3);
  const liveFeed = [...complaints]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const summaryCards = [
    {
      label: 'Pending',
      value: pending,
      className:
        'border border-[#8b7355]/45 bg-[#9faa8c]/20 dark:bg-[#3d4a2f]/40 dark:border-[#5a6b47]/50 text-[#1a2419] dark:text-[#e8ebe3]',
    },
    {
      label: 'Processing',
      value: processing,
      className:
        'border border-[#6f7a5e]/50 bg-[#c5cbb8]/35 dark:bg-[#2a3528]/55 dark:border-[#4a5c46]/60 text-[#1a2419] dark:text-[#e8ebe3]',
    },
    {
      label: 'Resolved',
      value: resolved,
      className:
        'border border-[#5f6b4a]/45 bg-[#9faa8c]/28 dark:bg-[#1c2218]/70 dark:border-[#5a6b47]/45 text-[#152018] dark:text-[#e4e8df]',
    },
  ];

  return (
    <div className="premium-page">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5"
      >
        <div className="xl:col-span-9 space-y-5">
          {/* Main ops panel */}
          <div className={`relative overflow-hidden rounded-2xl ${tactical.border} shadow-sm`}>
            <div className={`pointer-events-none absolute inset-0 ${tactical.wash}`} />
            <div className={`pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.45] ${tactical.gridBg}`} />
            <div className={`relative ${tactical.panelInner} p-4 sm:p-5`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${tactical.borderSoft} bg-background/60 ${tactical.label}`}>
                    <Crosshair className="w-3 h-3 text-[#5c6b4a] dark:text-[#8faa7a]" />
                    Student ops
                  </span>
                  <h1 className="text-2xl sm:text-4xl leading-none truncate" style={{ fontWeight: 800 }}>
                    My Activity
                  </h1>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border ${tactical.borderSoft} text-muted-foreground`}
                  >
                    Window · Month
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className={`p-2 rounded-xl border ${tactical.borderSoft} hover:bg-accent/80 transition-colors`}
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    className={`p-2 rounded-xl border ${tactical.borderSoft} hover:bg-accent/80 transition-colors`}
                    aria-label="Alerts"
                  >
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className={`lg:col-span-2 rounded-xl ${tactical.borderSoft} ${tactical.panelInner} p-3 sm:p-4`}>
                  <p className={`${tactical.label} mb-3`}>Field profile</p>
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div
                      className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 border-2 border-[#6f7a5e]/40 dark:border-[#4a5c46]/60 bg-[#9faa8c]/25 dark:bg-[#2a3528]/50`}
                      style={{ fontWeight: 700 }}
                    >
                      {user?.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg sm:text-xl truncate" style={{ fontWeight: 700 }}>
                        {user?.name}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                        {user?.role === 'admin' ? 'Admin console' : 'Student'} · Campus portal
                      </p>
                      <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> +1 555 010 0167
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {user?.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Main campus
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-[#6f7a5e]/20 dark:border-[#4a5c46]/30">
                    <div>
                      <p className="text-[11px] font-mono text-muted-foreground">Thoughts</p>
                      <p className="text-lg sm:text-xl mt-0.5" style={{ fontWeight: 700 }}>
                        {myComplaints.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono text-muted-foreground">UNI XP</p>
                      <p className="text-lg sm:text-xl mt-0.5" style={{ fontWeight: 700 }}>
                        {user?.uni_xp || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono text-muted-foreground">Streak</p>
                      <p className="text-lg sm:text-xl mt-0.5" style={{ fontWeight: 700 }}>
                        {user?.streak || 0}d
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl ${tactical.borderSoft} ${tactical.panelInner} p-3 sm:p-4`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className={tactical.label}>Now online</p>
                      <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
                        ({activeStudents.length})
                      </span>
                    </div>
                    <Users className="w-4 h-4 text-[#5c6b4a] dark:text-[#8faa7a] shrink-0" />
                  </div>
                  <div className="space-y-2.5">
                    {activeStudents.map(s => (
                      <div key={s.id} className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full border border-[#6f7a5e]/35 dark:border-[#4a5c46]/50 bg-secondary flex items-center justify-center text-xs`}
                          style={{ fontWeight: 700 }}
                        >
                          {s.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate" style={{ fontWeight: 600 }}>
                            {s.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">{s.uni_xp} XP</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" title="Active" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className={`premium-panel p-4 sm:p-5 ${tactical.borderSoft} relative overflow-hidden`}>
            <div className={`pointer-events-none absolute inset-0 opacity-25 ${tactical.gridBg}`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`${tactical.label} mb-1`}>Status mix</p>
                  <h2 className="text-base sm:text-lg" style={{ fontWeight: 700 }}>
                    My Summary
                  </h2>
                </div>
                <Link
                  to={paths.complaints}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono"
                >
                  Full SITREP <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {summaryCards.map(card => (
                  <div key={card.label} className={`rounded-xl px-4 py-3 ${card.className}`}>
                    <p className="text-[10px] font-mono uppercase tracking-wider opacity-80">{card.label}</p>
                    <p className="text-2xl mt-1 tabular-nums" style={{ fontWeight: 700 }}>
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regrouped threads */}
          <div className={`premium-panel p-0 overflow-hidden ${tactical.borderSoft}`}>
            <div className="flex items-center justify-between p-4 border-b border-[#6f7a5e]/25 dark:border-[#4a5c46]/35 bg-[#9faa8c]/[0.08] dark:bg-[#1c2218]/40">
              <div>
                <p className={`${tactical.label} mb-0.5`}>Threads · regroup</p>
                <h2 className="text-sm" style={{ fontWeight: 700 }}>
                  Your recent thoughts
                </h2>
              </div>
              <Link
                to={paths.submit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs border border-primary/20 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New
              </Link>
            </div>
            <div className="divide-y divide-border/80">
              {myComplaints.slice(0, 4).map(c => (
                <Link
                  key={c.id}
                  to={paths.complaint(c.id)}
                  className="flex items-start sm:items-center gap-2 sm:gap-3 px-4 py-3 hover:bg-[#9faa8c]/10 dark:hover:bg-[#2a3528]/35 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-[#5c6b4a] dark:bg-[#8faa7a] shrink-0 mt-1.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate" style={{ fontWeight: 600 }}>
                      {c.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{c.category}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Live feed column */}
        <div className="xl:col-span-3 order-first xl:order-none">
          <div className={`relative overflow-hidden rounded-2xl ${tactical.border} shadow-sm`}>
            <div className={`pointer-events-none absolute inset-0 ${tactical.wash}`} />
            <div className={`relative ${tactical.panelInner} p-3 sm:p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Radio className="w-4 h-4 text-[#5c6b4a] dark:text-[#8faa7a] shrink-0" />
                  <div className="min-w-0">
                    <p className={`${tactical.label} truncate`}>Campus feed</p>
                    <h3 className="text-sm truncate" style={{ fontWeight: 700 }}>
                      Live signals
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CircleDot className="w-3 h-3" /> Live
                </span>
              </div>
              <div className="space-y-2 max-h-72 xl:max-h-none overflow-y-auto pr-0.5">
                {liveFeed.map(item => (
                  <div
                    key={item.id}
                    className={`rounded-xl border ${tactical.borderSoft} px-3 py-2 bg-background/50 hover:bg-[#9faa8c]/10 dark:hover:bg-[#2a3528]/30 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs truncate" style={{ fontWeight: 600 }}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          {item.user_name} · {item.category}
                        </p>
                      </div>
                      <div className="hidden sm:block shrink-0">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground inline-flex items-center gap-1 font-mono">
                      <Clock3 className="w-3 h-3" />
                      {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#6f7a5e]/25 dark:border-[#4a5c46]/35 grid grid-cols-2 gap-2">
                <Link
                  to={paths.complaints}
                  className={`text-xs rounded-xl border ${tactical.borderSoft} px-3 py-2 text-center hover:bg-accent/80 transition-colors font-mono`}
                >
                  Open Thoughts
                </Link>
                <Link
                  to={paths.leaderboard}
                  className={`text-xs rounded-xl border ${tactical.borderSoft} px-3 py-2 text-center hover:bg-accent/80 inline-flex items-center justify-center gap-1 font-mono`}
                >
                  <Activity className="w-3.5 h-3.5" /> Pulse
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
