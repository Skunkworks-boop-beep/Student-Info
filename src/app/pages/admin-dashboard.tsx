import { FileText, Clock, Star, TrendingDown, Crosshair } from 'lucide-react';
import { motion } from 'motion/react';
import { analyticsData } from '../data/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { adminTactical } from '../admin-tactical-ui';

/** Tactical-muted chart fills — same semantics as before (amber / blue / violet / green families), olive-tan keyed */
const PIE_COLORS = ['#b89a5c', '#6e7f78', '#7d6e7a', '#5f6f4e'];
const CAT_COLORS = ['#5f6f4e', '#8b7355', '#4d5c46', '#6b7568', '#9a8a6a', '#5a5248'];
const LINE_STROKE = '#5c6b4a';
const LINE_DOT = '#6f7a5e';

/** KPI icon wells: tactical shades of the former blue / amber / green / purple roles */
const KPI_ICON_STYLES = [
  'border border-[#6b7570]/45 bg-[#8a9685]/22 dark:bg-[#283028]/60 dark:border-[#4a5548]/55 text-[#2a322c] dark:text-[#b8c4ae]',
  'border border-[#8b7355]/50 bg-[#c4b8a5]/28 dark:bg-[#2c241c]/55 dark:border-[#5c4a38]/50 text-[#3d3024] dark:text-[#d8cbb8]',
  'border border-[#5f6b4a]/50 bg-[#9faa8c]/25 dark:bg-[#1e2618]/65 dark:border-[#4a5c46]/55 text-[#1a2214] dark:text-[#c5d0b8]',
  'border border-[#6b5c58]/45 bg-[#9a908e]/22 dark:bg-[#2a2220]/55 dark:border-[#4a3f3c]/50 text-[#342a28] dark:text-[#c9beb8]',
] as const;

const TREND_TACTICAL = 'text-[#4a5540] dark:text-[#9faa8c]';

export function AdminDashboardPage() {
  const { totalComplaints, openComplaints, avgResolutionDays, satisfactionScore, complaintsOverTime, byCategory, byStatus } = analyticsData;

  const kpis = [
    { label: 'Total thoughts', value: totalComplaints, icon: FileText, iconStyle: KPI_ICON_STYLES[0], trend: '+12%' },
    { label: 'Open', value: openComplaints, icon: Clock, iconStyle: KPI_ICON_STYLES[1], trend: '-5%' },
    { label: 'Avg Resolution', value: `${avgResolutionDays}d`, icon: TrendingDown, iconStyle: KPI_ICON_STYLES[2], trend: '-0.8d' },
    { label: 'Satisfaction', value: `${satisfactionScore}/5`, icon: Star, iconStyle: KPI_ICON_STYLES[3], trend: '+0.3' },
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${adminTactical.borderSoft} bg-background/60 ${adminTactical.label}`}
            >
              <Crosshair className="w-3 h-3 text-[#5c6b4a] dark:text-[#8faa7a]" />
              Admin ops
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
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Charts and KPIs use the built-in analytics sample (fixed totals and time series)—a reference dashboard for
            how thought volume, status mix, and categories could be summarized for staff.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`relative overflow-hidden rounded-2xl ${adminTactical.borderSoft} shadow-sm`}
          >
            <div className={`pointer-events-none absolute inset-0 opacity-20 ${adminTactical.gridBg}`} />
            <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
              <div className={`w-10 h-10 rounded-xl ${k.iconStyle} flex items-center justify-center mb-3`}>
                <k.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl text-[#1a2419] dark:text-[#e8ebe3]" style={{ fontWeight: 700 }}>
                {k.value}
              </p>
              <div className="flex items-center justify-between mt-1 gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground">{k.label}</p>
                <span className={`text-xs shrink-0 ${TREND_TACTICAL}`} style={{ fontWeight: 500 }}>
                  {k.trend}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <div className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}>
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
        </div>

        <div className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}>
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
        </div>

        <div className={`lg:col-span-2 relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}>
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
        </div>
      </div>
    </div>
  );
}
