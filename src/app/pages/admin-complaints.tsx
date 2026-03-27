import { useState } from 'react';
import { Search, Filter, ChevronDown, MoreHorizontal, CheckCircle, Eye, Clock, Settings } from 'lucide-react';
import { complaints, CATEGORIES, type Status, type Category } from '../data/mock-data';
import { StatusBadge, PriorityBadge } from '../components/status-badge';
import { format } from 'date-fns';

export function AdminComplaintsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const filtered = complaints.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id));
  };

  return (
    <div className="premium-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl" style={{ fontWeight: 700 }}>Manage Complaints</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} complaints</p>
        </div>
        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.length} selected</span>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 transition-colors">
              Bulk Update Status
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'Pending', 'Reviewed', 'Processing', 'Resolved'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-accent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="premium-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary"
                  />
                </th>
                <th className="p-4 text-left text-xs text-muted-foreground uppercase tracking-wider">Complaint</th>
                <th className="p-4 text-left text-xs text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="p-4 text-left text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Priority</th>
                <th className="p-4 text-left text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="rounded border-border accent-primary"
                    />
                  </td>
                  <td className="p-4">
                    <p className="text-sm" style={{ fontWeight: 500 }}>{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.is_anonymous ? 'Anonymous' : c.user_name}</p>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">{c.category}</span>
                  </td>
                  <td className="p-4"><StatusBadge status={c.status} /></td>
                  <td className="p-4 hidden md:table-cell"><PriorityBadge priority={c.priority} /></td>
                  <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                    {format(new Date(c.created_at), 'MMM d')}
                  </td>
                  <td className="p-4 relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === c.id ? null : c.id)}
                      className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {actionMenu === c.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                        <div className="absolute right-4 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1">
                          {(['Pending', 'Reviewed', 'Processing', 'Resolved'] as Status[]).map(s => (
                            <button
                              key={s}
                              onClick={() => setActionMenu(null)}
                              className="w-full px-4 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
                            >
                              {s === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                              {s === 'Reviewed' && <Eye className="w-3.5 h-3.5" />}
                              {s === 'Processing' && <Settings className="w-3.5 h-3.5" />}
                              {s === 'Resolved' && <CheckCircle className="w-3.5 h-3.5" />}
                              Mark as {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
