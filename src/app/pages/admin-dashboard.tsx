import { BarChart3, FileText, Clock, CheckCircle, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { analyticsData, STATUS_COLORS } from '../data/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const PIE_COLORS = ['#facc15', '#38bdf8', '#c084fc', '#34d399'];
const CAT_COLORS = ['#facc15', '#38bdf8', '#c084fc', '#34d399', '#f87171', '#94a3b8'];

export function AdminDashboardPage() {
  const { totalComplaints, openComplaints, avgResolutionDays, satisfactionScore, complaintsOverTime, byCategory, byStatus } = analyticsData;

  const kpis = [
    { label: 'Total Complaints', value: totalComplaints, icon: FileText, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', trend: '+12%' },
    { label: 'Open', value: openComplaints, icon: Clock, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', trend: '-5%' },
    { label: 'Avg Resolution', value: `${avgResolutionDays}d`, icon: TrendingDown, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400', trend: '-0.8d' },
    { label: 'Satisfaction', value: `${satisfactionScore}/5`, icon: Star, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', trend: '+0.3' },
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 700 }}>Admin Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of complaint management performance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="premium-panel p-5">
            <div className={`w-10 h-10 rounded-xl ${k.color} flex items-center justify-center mb-3`}>
              <k.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl" style={{ fontWeight: 700 }}>{k.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <span className="text-xs text-green-600 dark:text-green-400" style={{ fontWeight: 500 }}>{k.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Line chart */}
        <div className="premium-panel p-5">
          <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>Complaints Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={complaintsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 13 }}
              />
              <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="premium-panel p-5">
          <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>By Status</h2>
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
                <span className="text-muted-foreground">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="lg:col-span-2 premium-panel p-5">
          <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>By Category</h2>
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
  );
}
