import { useEffect, useState, useCallback, useRef } from 'react';
import { FileText, Clock, Star, TrendingDown, Crosshair, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyticsData } from '../data/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { adminTactical } from '../admin-tactical-ui';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import { listComplaints, buildLiveAnalytics } from '../api/supabase-api';

const PIE_COLORS = ['#b89a5c', '#6e7f78', '#7d6e7a', '#5f6f4e'];
const CAT_COLORS = ['#5f6f4e', '#8b7355', '#4d5c46', '#6b7568', '#9a8a6a', '#5a5248'];
const LINE_STROKE = '#5c6b4a';
const LINE_DOT = '#6f7a5e';

const KPI_ICON_STYLES = [
  'border border-[#6b7570]/45 bg-[#8a9685]/22 dark:bg-[#283028]/60 dark:border-[#4a5548]/55 text-[#2a322c] dark:text-[#b8c4ae]',
  'border border-[#8b7355]/50 bg-[#c4b8a5]/28 dark:bg-[#2c241c]/55 dark:border-[#5c4a38]/50 text-[#3d3024] dark:text-[#d8cbb8]',
  'border border-[#5f6b4a]/50 bg-[#9faa8c]/25 dark:bg-[#1e2618]/65 dark:border-[#4a5c46]/55 text-[#1a2214] dark:text-[#c5d0b8]',
  'border border-[#6b5c58]/45 bg-[#9a908e]/22 dark:bg-[#2a2220]/55 dark:border-[#4a3f3c]/50 text-[#342a28] dark:text-[#c9beb8]',
] as const;

const TREND_TACTICAL = 'text-[#4a5540] dark:text-[#9faa8c]';

function monthOverMonthVolumeTrend(series: { count: number }[]): string {
  if (series.length < 2) return '—';
  const prev = series[series.length - 2]!.count;
  const cur = series[series.length - 1]!.count;
  if (prev === 0) return cur > 0 ? '+100%' : '0%';
  const pct = Math.round(((cur - prev) / prev) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const from = prevRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return display;
}

function KpiCard({
  label,
  numericValue,
  displayValue,
  icon: Icon,
  iconStyle,
  trend,
  delay = 0,
}: {
  label: string;
  numericValue?: number;
  displayValue: string;
  icon: React.ElementType;
  iconStyle: string;
  trend: string;
  delay?: number;
}) {
  const counted = useCountUp(numericValue ?? 0);
  const shown = numericValue !== undefined ? String(counted) : displayValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl ${adminTactical.borderSoft} shadow-sm`}
    >
      <div className={`pointer-events-none absolute inset-0 opacity-20 ${adminTactical.gridBg}`} />
      <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
        <div className={`w-10 h-10 rounded-xl ${iconStyle} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5" />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={shown}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-2xl sm:text-3xl text-[#1a2419] dark:text-[#e8ebe3] tabular-nums"
            style={{ fontWeight: 700 }}
          >
            {shown}
          </motion.p>
        </AnimatePresence>
        <div className="flex items-center justify-between mt-1 gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
          <span className={`text-xs shrink-0 ${TREND_TACTICAL}`} style={{ fontWeight: 500 }}>
            {trend}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function AdminDashboardPage() {
  const { campusName, backendMode } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fallback = useCallback(
    () => ({
      totalComplaints: analyticsData.totalComplaints,
      openComplaints: analyticsData.openComplaints,
      avgResolutionDays: analyticsData.avgResolutionDays,
      satisfactionScore: analyticsData.satisfactionScore,
      complaintsOverTime: analyticsData.complaintsOverTime,
      byCategory: analyticsData.byCategory,
      byStatus: analyticsData.byStatus,
    }),
    []
  );

  const [live, setLive] = useState(() => fallback());
  const [analyticsError, setAnalyticsError] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    if (!cloud || !supabase) {
      setLive(fallback());
      setAnalyticsError(false);
      setIsRefreshing(false);
      return;
    }
    try {
      const all = await listComplaints(supabase, undefined);
      setLive(buildLiveAnalytics(all));
      setAnalyticsError(false);
    } catch {
      setLive(buildLiveAnalytics([]));
      setAnalyticsError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [cloud, supabase, fallback]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const {
    totalComplaints,
    openComplaints,
    avgResolutionDays,
    satisfactionScore,
    complaintsOverTime,
    byCategory,
    byStatus,
  } = live;

  const openShare =
    totalComplaints > 0 ? `${Math.round((openComplaints / totalComplaints) * 100)}%` : '—';

  const kpis = [
    {
      label: 'Total thoughts',
      numericValue: totalComplaints,
      displayValue: String(totalComplaints),
      icon: FileText,
      iconStyle: KPI_ICON_STYLES[0],
      trend: cloud ? monthOverMonthVolumeTrend(complaintsOverTime) : '+12%',
    },
    {
      label: 'Open',
      numericValue: openComplaints,
      displayValue: String(openComplaints),
      icon: Clock,
      iconStyle: KPI_ICON_STYLES[1],
      trend: cloud ? `${openShare} of total` : '-5%',
    },
    {
      label: 'Avg Resolution',
      numericValue: undefined,
      displayValue: `${avgResolutionDays}d`,
      icon: TrendingDown,
      iconStyle: KPI_ICON_STYLES[2],
      trend: cloud ? 'Rolling avg' : '-0.8d',
    },
    {
      label: 'Satisfaction',
      numericValue: undefined,
      displayValue: satisfactionScore > 0 ? `${satisfactionScore}/5` : 'N/A',
      icon: Star,
      iconStyle: KPI_ICON_STYLES[3],
      trend: cloud ? (satisfactionScore > 0 ? 'From ratings' : 'No ratings') : '+0.3',
    },
  ];

  return (
    <div className="premium-page w-full space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
      >
        <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
        <div className={`pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.45] ${adminTactical.gridBg}`} />
        <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${adminTactical.borderSoft} bg-background/60 ${adminTactical.label}`}
              >
                <Crosshair className="w-3 h-3 text-[#5c6b4a] dark:text-[#8faa7a]" />
                <span className="truncate max-w-[12rem] sm:max-w-[18rem]">{campusName}</span>
              </span>
              <h1 className="text-2xl sm:text-3xl leading-none truncate" style={{ fontWeight: 800 }}>
                Analytics
              </h1>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border ${adminTactical.borderSoft} text-muted-foreground`}
              >
                Overview
              </span>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={() => void refresh()}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${adminTactical.borderSoft} hover:bg-accent/80 transition-colors text-xs font-mono disabled:opacity-50 shrink-0`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </motion.button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            {analyticsError && cloud ? (
              <span className="text-red-600 dark:text-red-400">
                Could not load live analytics; charts show zeros until Supabase is reachable.
              </span>
            ) : cloud ? (
              'Live aggregates from your Supabase thoughts table. KPI subtitles use current data (volume MoM where history exists, share open vs total, satisfaction when ratings exist).'
            ) : (
              'Charts and KPIs use the built-in analytics sample — useful for layout review before connecting Supabase.'
            )}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k, i) => (
          <KpiCard
            key={k.label}
            label={k.label}
            numericValue={k.numericValue}
            displayValue={k.displayValue}
            icon={k.icon}
            iconStyle={k.iconStyle}
            trend={k.trend}
            delay={i * 0.06}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, ease: 'easeOut' }}
          className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
        >
          <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
          <div className={`pointer-events-none absolute inset-0 opacity-25 dark:opacity-40 ${adminTactical.gridBg}`} />
          <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
            <p className={`${adminTactical.label} mb-1`}>Time series</p>
            <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>
              Thoughts over time
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={complaintsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 13 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={LINE_STROKE}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: LINE_DOT, stroke: LINE_STROKE, strokeWidth: 1 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, ease: 'easeOut' }}
          className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
        >
          <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
          <div className={`pointer-events-none absolute inset-0 opacity-25 dark:opacity-40 ${adminTactical.gridBg}`} />
          <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
            <p className={`${adminTactical.label} mb-1`}>Distribution</p>
            <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>
              By status
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {byStatus.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">
                    {s.name} ({s.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: 'easeOut' }}
          className={`lg:col-span-2 relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
        >
          <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
          <div className={`pointer-events-none absolute inset-0 opacity-25 dark:opacity-40 ${adminTactical.gridBg}`} />
          <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
            <p className={`${adminTactical.label} mb-1`}>Category load</p>
            <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>
              By category
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 13 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
