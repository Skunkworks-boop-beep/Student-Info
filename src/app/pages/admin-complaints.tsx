import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  CheckCircle,
  Eye,
  Clock,
  Settings,
  Crosshair,
  MessageSquare,
  ClipboardList,
  BarChart2,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { complaints, CATEGORIES, type Status, type Category, type Complaint } from '../data/mock-data';
import { firstNameOnly } from '../utils/display-name';
import { StatusBadge, PriorityBadge } from '../components/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { adminTactical } from '../admin-tactical-ui';
import { useSound } from '../audio/sound-context';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import { listComplaints, updateComplaintStatusAdmin } from '../api/supabase-api';

function cloneComplaints(source: Complaint[]): Complaint[] {
  return source.map(c => ({ ...c, comments: [...c.comments], status_log: [...c.status_log] }));
}

/** Pairwise overlap + per-category clusters from authored thoughts (not comments). */
function buildSimilarIdeasSummary(all: Complaint[]) {
  const byUser = new Map<string, { display: string; categories: Set<Category> }>();
  for (const c of all) {
    const display = c.is_anonymous ? 'Anonymous' : firstNameOnly(c.user_name);
    const row = byUser.get(c.user_id);
    if (!row) {
      byUser.set(c.user_id, { display, categories: new Set([c.category]) });
    } else {
      row.categories.add(c.category);
      if (!c.is_anonymous) row.display = firstNameOnly(c.user_name);
    }
  }

  const userIds = [...byUser.keys()];
  const pairs: { a: string; b: string; shared: Category[] }[] = [];
  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      const ua = byUser.get(userIds[i])!;
      const ub = byUser.get(userIds[j])!;
      const shared = [...ua.categories].filter(cat => ub.categories.has(cat));
      if (shared.length > 0) {
        pairs.push({ a: ua.display, b: ub.display, shared: [...shared].sort() });
      }
    }
  }
  pairs.sort((p, q) => q.shared.length - p.shared.length || p.a.localeCompare(q.a));

  const byCategory = new Map<Category, { id: string; display: string }[]>();
  for (const c of all) {
    const display = c.is_anonymous ? 'Anonymous' : firstNameOnly(c.user_name);
    const list = byCategory.get(c.category) ?? [];
    if (!list.some(x => x.id === c.user_id)) {
      list.push({ id: c.user_id, display });
    }
    byCategory.set(c.category, list);
  }

  const themeClusters = CATEGORIES.map(cat => {
    const authors = byCategory.get(cat) ?? [];
    if (authors.length < 2) return null;
    const thoughtCount = all.filter(t => t.category === cat).length;
    return { category: cat, authors, thoughtCount };
  })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.thoughtCount - a.thoughtCount);

  return { pairs, themeClusters };
}

const STATUS_OPTIONS: Status[] = ['Pending', 'Reviewed', 'Processing', 'Resolved'];

function AdminComplaintCard({
  c,
  selected,
  onToggleSelect,
  actionMenu,
  setActionMenu,
  onStatusChange,
  showFlash,
}: {
  c: Complaint;
  selected: boolean;
  onToggleSelect: () => void;
  actionMenu: string | null;
  setActionMenu: (id: string | null) => void;
  onStatusChange: (id: string, status: Status, title: string) => void | Promise<void>;
  showFlash: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const open = actionMenu === c.id;

  return (
    <article
      className={`premium-panel premium-hover-lift border-border/80 border-l-[3px] border-l-[#6f7a5e]/70 dark:border-l-[#5a6b47] transition-shadow duration-200 overflow-hidden bg-[#9faa8c]/[0.04] dark:bg-[#1c2218]/40 ${
        selected ? 'ring-2 ring-[#6f7a5e]/35 border-l-primary/60 bg-primary/[0.04] shadow-md' : 'hover:border-[#6f7a5e]/35 hover:shadow-sm'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex gap-3 flex-1 min-w-0">
            <label className="flex flex-col items-center gap-1 shrink-0 w-9 cursor-pointer pt-0.5 group/chk">
              <motion.span whileTap={{ scale: 0.92 }} className="inline-flex">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={onToggleSelect}
                  className="rounded border-border accent-primary w-4 h-4 cursor-pointer"
                  onClick={e => e.stopPropagation()}
                  aria-label={`Select ${c.title}`}
                />
              </motion.span>
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-tight px-0.5 select-all">
                {c.id}
              </span>
            </label>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <motion.div
                    layout
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0 ring-1 ring-border/40"
                    style={{ fontWeight: 700 }}
                  >
                    {(c.is_anonymous ? 'A' : firstNameOnly(c.user_name).charAt(0)).toUpperCase()}
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-xs truncate" style={{ fontWeight: 600 }}>
                      {c.is_anonymous ? 'Anonymous Student' : firstNameOnly(c.user_name)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setActionMenu(open ? null : c.id)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                    aria-expanded={open}
                    aria-haspopup="menu"
                    aria-label="Thought actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </motion.button>
                  <AnimatePresence>
                    {open && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40 bg-black/5"
                          onClick={() => setActionMenu(null)}
                        />
                        <motion.div
                          role="menu"
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className={`absolute right-0 top-full mt-1 w-52 bg-card border ${adminTactical.borderSoft} rounded-xl shadow-lg z-50 py-1 overflow-hidden`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <button
                              key={s}
                              type="button"
                              role="menuitem"
                              onClick={() => void onStatusChange(c.id, s, c.title)}
                              className={`w-full px-4 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2 ${
                                c.status === s ? 'bg-accent/60' : ''
                              }`}
                            >
                              {s === 'Pending' && <Clock className="w-3.5 h-3.5 shrink-0" />}
                              {s === 'Reviewed' && <Eye className="w-3.5 h-3.5 shrink-0" />}
                              {s === 'Processing' && <Settings className="w-3.5 h-3.5 shrink-0" />}
                              {s === 'Resolved' && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                              Mark as {s}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="w-full text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-[#6f7a5e]/10 dark:hover:bg-[#2a3528]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f7a5e]/40"
                aria-expanded={expanded}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm sm:text-base leading-snug text-foreground" style={{ fontWeight: 600 }}>
                    {c.title}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#5c6b4a] dark:text-[#9faa8c] transition-transform mt-0.5 ${expanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </div>
                <p
                  className={`text-sm text-muted-foreground mt-1.5 leading-relaxed text-left ${expanded ? '' : 'line-clamp-3'}`}
                >
                  {c.description}
                </p>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1.5 inline-block">
                  {expanded ? 'Tap to collapse' : 'Tap to expand details'}
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                <span>{c.category}</span>
                <span className="text-border">·</span>
                <span className="truncate">{c.location}</span>
                {c.comments.length > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {c.comments.length}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={c.status}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-wrap gap-1.5"
                  >
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                  </motion.div>
                </AnimatePresence>
                <AnimatePresence>
                  {showFlash && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] font-mono uppercase tracking-wide text-[#5a6b4a] dark:text-[#9faa8c]"
                    >
                      · Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-[#6f7a5e]/25 dark:border-[#4a5c46]/40 space-y-4 text-sm">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
                        <span>
                          <span className="text-[10px] uppercase tracking-wider text-[#3d4a38] dark:text-[#9faa8c]">
                            Author id
                          </span>{' '}
                          {c.user_id}
                        </span>
                        <span>
                          <span className="text-[10px] uppercase tracking-wider text-[#3d4a38] dark:text-[#9faa8c]">
                            Updated
                          </span>{' '}
                          {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                        </span>
                        <span>
                          <span className="text-[10px] uppercase tracking-wider text-[#3d4a38] dark:text-[#9faa8c]">
                            Upvotes
                          </span>{' '}
                          {c.upvotes}
                        </span>
                        {c.rating != null && (
                          <span>
                            <span className="text-[10px] uppercase tracking-wider text-[#3d4a38] dark:text-[#9faa8c]">
                              Rating
                            </span>{' '}
                            {c.rating}/5
                          </span>
                        )}
                      </div>

                      {c.status_log.length > 0 && (
                        <div>
                          <p className={`${adminTactical.label} mb-2`}>Status history</p>
                          <ul className="space-y-2 text-xs">
                            {c.status_log.map((log, i) => (
                              <li
                                key={`${log.timestamp}-${i}`}
                                className="rounded-lg border border-border/70 bg-background/50 px-3 py-2"
                              >
                                <p className="text-muted-foreground">
                                  <span style={{ fontWeight: 600 }} className="text-foreground">
                                    {log.old_status}
                                  </span>
                                  {' → '}
                                  <span style={{ fontWeight: 600 }} className="text-foreground">
                                    {log.new_status}
                                  </span>
                                  <span className="text-[10px] font-mono ml-2">
                                    {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                                  </span>
                                </p>
                                <p className="text-muted-foreground mt-0.5">{log.changed_by}: {log.note}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <p className={`${adminTactical.label} mb-2`}>
                          Comments ({c.comments.length})
                        </p>
                        {c.comments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No thread replies yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {c.comments.map(cm => (
                              <li
                                key={cm.id}
                                className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-xs"
                              >
                                <p style={{ fontWeight: 600 }} className="text-foreground">
                                  {firstNameOnly(cm.user_name)}
                                  <span className="text-[10px] font-mono text-muted-foreground font-normal ml-2">
                                    {format(new Date(cm.created_at), 'MMM d, HH:mm')}
                                  </span>
                                </p>
                                <p className="text-muted-foreground mt-1 leading-relaxed">{cm.text}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdminComplaintsPage() {
  const { play } = useSound();
  const { user, backendMode } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';

  const [items, setItems] = useState<Complaint[]>(() => cloneComplaints(complaints));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'priority'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(() => new Set());
  const flashTimers = useRef<Map<string, number>>(new Map());

  const triggerFlash = useCallback((id: string) => {
    setFlashIds(prev => new Set(prev).add(id));
    const prevT = flashTimers.current.get(id);
    if (prevT) window.clearTimeout(prevT);
    const t = window.setTimeout(() => {
      setFlashIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      flashTimers.current.delete(id);
    }, 1800);
    flashTimers.current.set(id, t);
  }, []);

  useEffect(() => {
    return () => {
      flashTimers.current.forEach(t => window.clearTimeout(t));
    };
  }, []);

  const normalizedSearch = search.trim();

  const filtered = useMemo(() => {
    return items
      .filter(c => {
        if (normalizedSearch) {
          const q = normalizedSearch.toLowerCase();
          if (!c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
        }
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === 'priority') {
          const order = { High: 0, Medium: 1, Low: 2 };
          return order[a.priority] - order[b.priority];
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [items, normalizedSearch, statusFilter, categoryFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = {
      Pending: 0,
      Reviewed: 0,
      Processing: 0,
      Resolved: 0,
    };
    for (const c of items) {
      counts[c.status]++;
    }
    return counts;
  }, [items]);

  const similarIdeas = useMemo(() => buildSimilarIdeasSummary(items), [items]);

  const refreshItems = useCallback(async () => {
    if (!cloud || !supabase) {
      setItems(cloneComplaints(complaints));
      return;
    }
    try {
      const list = await listComplaints(supabase, user?.id);
      setItems(list);
    } catch {
      toast.error('Could not load thoughts from the server.');
      setItems([]);
    }
  }, [cloud, supabase, user?.id]);

  useEffect(() => {
    void refreshItems();
  }, [refreshItems]);

  const setStatus = useCallback(
    async (id: string, status: Status, title: string) => {
      if (cloud && supabase && user) {
        try {
          await updateComplaintStatusAdmin(supabase, {
            complaint_id: id,
            new_status: status,
            admin_id: user.id,
            note: 'Status updated from admin queue',
          });
          await refreshItems();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Could not update status');
          return;
        }
      } else {
        setItems(prev => prev.map(x => (x.id === id ? { ...x, status } : x)));
      }
      setActionMenu(null);
      play('success');
      triggerFlash(id);
      const t = title;
      toast.success('Status updated', {
        description: `${t.slice(0, 56)}${t.length > 56 ? '…' : ''} → ${status}`,
        duration: 3200,
      });
    },
    [cloud, supabase, user, refreshItems, play, triggerFlash]
  );

  const bulkSetStatus = useCallback(
    async (status: Status) => {
      if (selected.length === 0) return;
      if (cloud && supabase && user) {
        try {
          for (const id of selected) {
            await updateComplaintStatusAdmin(supabase, {
              complaint_id: id,
              new_status: status,
              admin_id: user.id,
              note: 'Bulk status update',
            });
          }
          await refreshItems();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Bulk update failed');
          return;
        }
      } else {
        const ids = new Set(selected);
        setItems(prev => prev.map(x => (ids.has(x.id) ? { ...x, status } : x)));
      }
      play('success');
      toast.success(`Updated ${selected.length} thought${selected.length !== 1 ? 's' : ''}`, {
        description: `All marked as ${status}.`,
      });
      selected.forEach(id => triggerFlash(id));
      setSelected([]);
    },
    [selected, cloud, supabase, user, refreshItems, play, triggerFlash]
  );

  const toggleSelect = (id: string) => {
    play('tap');
    setSelected(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    play('tap');
    setSelected(selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map(c => c.id));
  };

  return (
    <div className="premium-page w-full max-w-7xl mx-auto pb-8 space-y-0">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 xl:gap-10 lg:items-start">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl ${adminTactical.border} shadow-sm`}
          >
            <div className={`pointer-events-none absolute inset-0 ${adminTactical.wash}`} />
            <div className={`pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.45] ${adminTactical.gridBg}`} />
            <div className={`relative ${adminTactical.panelInner} p-4 sm:p-5`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${adminTactical.borderSoft} bg-background/60 ${adminTactical.label}`}
                    >
                      <Crosshair className="w-3 h-3 text-[#5c6b4a] dark:text-[#8faa7a]" />
                      Admin ops
                    </span>
                    <h1 className="text-2xl sm:text-3xl leading-none" style={{ fontWeight: 800 }}>
                      Thoughts queue
                    </h1>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                    Staff queue only—stays inside the admin portal. Search, filter, and sort; tap a thought&apos;s title to
                    expand history, comments, and internal fields here. Status changes update this list and side panels.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${adminTactical.borderSoft} bg-background/50`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Triage & status
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${adminTactical.borderSoft} bg-background/50`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Expand in place
                    </span>
                  </div>
                </div>
                <AnimatePresence mode="popLayout">
                  {selected.length > 0 && (
                    <motion.div
                      key="bulk"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      className="flex flex-col sm:items-end gap-2 shrink-0"
                    >
                      <span className="text-sm text-muted-foreground">{selected.length} selected</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
                          >
                            Bulk update status
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[12rem]">
                          {STATUS_OPTIONS.map(s => (
                            <DropdownMenuItem key={s} onSelect={() => void bulkSetStatus(s)}>
                              Mark {selected.length} as {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <motion.div className="flex-1 relative" layout>
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search titles or descriptions…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm transition-shadow"
                  />
                </motion.div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={toggleAll}
                  className={`shrink-0 px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wide border border-border bg-card hover:bg-accent transition-colors ${
                    filtered.length === 0 ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  disabled={filtered.length === 0}
                >
                  {selected.length === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'}
                </motion.button>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  play('panel');
                  setShowFilters(f => !f);
                }}
                className={`w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>

            <AnimatePresence initial={false}>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-card rounded-xl border border-border">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                      <Select value={statusFilter} onValueChange={v => setStatusFilter(v as Status | 'All')}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All statuses</SelectItem>
                          {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                      <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as Category | 'All')}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All categories</SelectItem>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Sort by</label>
                      <Select value={sortBy} onValueChange={v => setSortBy(v as 'recent' | 'oldest' | 'priority')}>
                        <SelectTrigger className="w-full sm:w-[170px]">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Most recent</SelectItem>
                          <SelectItem value="oldest">Oldest first</SelectItem>
                          <SelectItem value="priority">Priority (high first)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.p
            key={filtered.length + normalizedSearch + statusFilter + categoryFilter}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            {filtered.length} thought{filtered.length !== 1 ? 's' : ''} in view
          </motion.p>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28, delay: Math.min(i * 0.035, 0.2) }}
                >
                  <AdminComplaintCard
                    c={c}
                    selected={selected.includes(c.id)}
                    onToggleSelect={() => toggleSelect(c.id)}
                    actionMenu={actionMenu}
                    setActionMenu={setActionMenu}
                    onStatusChange={setStatus}
                    showFlash={flashIds.has(c.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 rounded-2xl border border-dashed border-border bg-secondary/20"
              >
                <p className="text-muted-foreground">No thoughts match your filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('All');
                    setCategoryFilter('All');
                    play('tap');
                    toast.message('Filters cleared');
                  }}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="hidden lg:block min-w-0 space-y-4 pt-2 lg:sticky lg:top-20 xl:top-24 self-start">
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`premium-panel border-border/80 p-4 relative overflow-hidden`}
          >
            <div className={`pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-20 ${adminTactical.gridBg}`} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-muted-foreground" aria-hidden />
                <h2 className="text-sm" style={{ fontWeight: 700 }}>
                  Queue snapshot
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Live counts from your current queue state.</p>
              <ul className="space-y-2 text-sm">
                {STATUS_OPTIONS.map(s => (
                  <motion.li
                    key={s}
                    layout
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-muted-foreground">{s}</span>
                    <motion.span
                      key={statusCounts[s]}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className="tabular-nums font-mono text-xs text-foreground"
                      style={{ fontWeight: 600 }}
                    >
                      {statusCounts[s]}
                    </motion.span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-panel border-border/80 p-4 relative overflow-hidden"
          >
            <div className={`pointer-events-none absolute inset-0 opacity-[0.1] dark:opacity-[0.18] ${adminTactical.gridBg}`} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                <h2 className="text-sm" style={{ fontWeight: 700 }}>
                  Similar ideas
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Pairs and categories are computed from the active queue (same data as the cards). When you change
                statuses, counts and clusters stay in sync with this view.
              </p>

              {similarIdeas.pairs.length > 0 && (
                <div className="mb-4">
                  <p className={`${adminTactical.label} mb-2`}>Overlapping themes</p>
                  <ul className="space-y-2.5">
                    {similarIdeas.pairs.map((p, idx) => (
                      <motion.li
                        key={`${p.a}-${p.b}-${idx}`}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + idx * 0.04 }}
                        className="text-xs leading-snug rounded-lg border border-border/70 bg-secondary/20 px-2.5 py-2"
                      >
                        <p>
                          <span className="text-foreground" style={{ fontWeight: 600 }}>
                            {p.a}
                          </span>
                          <span className="text-muted-foreground"> · </span>
                          <span className="text-foreground" style={{ fontWeight: 600 }}>
                            {p.b}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">Shared: {p.shared.join(', ')}</p>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {similarIdeas.themeClusters.length > 0 && (
                <div>
                  <p className={`${adminTactical.label} mb-2`}>By category</p>
                  <ul className="space-y-2">
                    {similarIdeas.themeClusters.map(({ category, authors, thoughtCount }) => (
                      <li key={category} className="text-xs">
                        <p style={{ fontWeight: 600 }} className="text-foreground">
                          {category}
                          <span className="text-muted-foreground font-normal font-mono tabular-nums">
                            {' '}
                            · {thoughtCount} thought{thoughtCount !== 1 ? 's' : ''}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {authors.map(a => a.display).join(', ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {similarIdeas.pairs.length === 0 && similarIdeas.themeClusters.length === 0 && (
                <p className="text-xs text-muted-foreground">No multi-author categories yet.</p>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="premium-panel border-border/80 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm" style={{ fontWeight: 700 }}>
                Workflow
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Expand a card for ops context; the ··· menu and bulk dropdown set status.
            </p>
          </motion.section>
        </aside>
      </div>
    </div>
  );
}
