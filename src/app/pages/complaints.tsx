import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { paths } from '../paths';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import {
  addComplaintCommentRow,
  fetchLeaderboardProfiles,
  listComplaints,
  toggleComplaintUpvote,
} from '../api/supabase-api';
import {
  Search,
  Filter,
  ArrowUp,
  MessageSquare,
  ChevronDown,
  Flame,
  Bookmark,
  Sparkles,
  X,
  Maximize2,
  Radio,
  Users,
  MapPin,
  Send,
} from 'lucide-react';
import { complaints, CATEGORIES, leaderboard, type Status, type Category, type Complaint, type User } from '../data/mock-data';
import { StatusBadge, PriorityBadge } from '../components/status-badge';
import { formatDistanceToNow, format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { firstNameOnly } from '../utils/display-name';
import { StatusStepper } from '../components/status-stepper';

/** Only some thoughts include media — keeps the feed varied. */
const THOUGHT_MEDIA: Partial<Record<string, string[]>> = {
  c1: [
    'https://picsum.photos/seed/campus-library-shelves/640/480',
    'https://picsum.photos/seed/campus-study-window/640/480',
  ],
  c2: ['https://picsum.photos/seed/campus-engineering-lab/640/480'],
  c5: ['https://picsum.photos/seed/campus-building-elevator/640/480'],
};

function ThoughtMediaSection({
  images,
  title,
  onImageClick,
}: {
  images: string[];
  title: string;
  onImageClick: (src: string, alt: string) => void;
}) {
  if (images.length === 1) {
    return (
      <div className="relative w-full max-w-[220px] sm:max-w-[260px] mx-auto sm:mx-0 shrink-0 rounded-xl overflow-hidden border border-border/80 bg-muted/20 group/img aspect-[4/3]">
        <img src={images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onImageClick(images[0], title);
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          aria-label={`View photo for ${title}`}
        >
          <span className="opacity-0 group-hover/img:opacity-100 transition-opacity rounded-full bg-background/90 p-1.5 shadow-md">
            <Maximize2 className="w-3.5 h-3.5 text-foreground" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 w-full max-w-[220px] sm:max-w-[280px] mx-auto sm:mx-0 shrink-0">
      {images.slice(0, 2).map((src, idx) => (
        <div
          key={`${src}-${idx}`}
          className="relative flex-1 min-w-0 rounded-xl overflow-hidden border border-border/80 bg-muted/20 aspect-[4/3] group/img"
        >
          <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onImageClick(src, `${title} — ${idx + 1}`);
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors"
            aria-label={`View image ${idx + 1}`}
          >
            <span className="opacity-0 group-hover/img:opacity-100 transition-opacity rounded-full bg-background/90 p-1 shadow-md">
              <Maximize2 className="w-3 h-3 text-foreground" />
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string | null;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {src && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative z-10 max-w-[min(92vw,720px)] max-h-[85vh] w-full"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-2 -right-2 sm:top-0 sm:right-0 translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 z-20 p-2 rounded-full bg-card border border-border shadow-lg hover:bg-accent"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
              <img src={src} alt={alt} className="w-full h-auto max-h-[80vh] object-contain bg-black/5" />
            </div>
            {alt && <p className="mt-2 text-center text-xs text-muted-foreground px-2">{alt}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ThoughtCard({
  c,
  onImageClick,
  allowInteract,
  onToggleUpvote,
  onSendComment,
}: {
  c: Complaint;
  onImageClick: (src: string, alt: string) => void;
  allowInteract?: boolean;
  onToggleUpvote?: () => Promise<void>;
  onSendComment?: (text: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [busy, setBusy] = useState(false);
  const media = c.media_urls?.length ? c.media_urls : THOUGHT_MEDIA[c.id];

  return (
    <article className="premium-panel premium-hover-lift border-border/80 hover:border-primary/25 transition-colors overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex gap-3 flex-1 min-w-0">
            <button
              type="button"
              disabled={busy || (allowInteract && !onToggleUpvote)}
              onClick={async e => {
                e.preventDefault();
                if (!allowInteract || !onToggleUpvote) return;
                setBusy(true);
                try {
                  await onToggleUpvote();
                } finally {
                  setBusy(false);
                }
              }}
              className={`flex flex-col items-center gap-0 shrink-0 w-8 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-primary ${
                c.upvoted_by_me ? 'text-primary' : ''
              } ${allowInteract && onToggleUpvote ? 'cursor-pointer' : ''}`}
              aria-label={`${c.upvotes} upvotes`}
            >
              <ArrowUp className="w-4 h-4 shrink-0" />
              <span className="text-xs tabular-nums leading-none" style={{ fontWeight: 600 }}>
                {c.upvotes}
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0"
                    style={{ fontWeight: 700 }}
                  >
                    {(c.is_anonymous ? 'A' : firstNameOnly(c.user_name).charAt(0)).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs truncate" style={{ fontWeight: 600 }}>
                      {c.is_anonymous ? 'Anonymous Student' : firstNameOnly(c.user_name)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => e.preventDefault()}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground shrink-0"
                  aria-label="Save thought"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="w-full text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-primary/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-expanded={expanded}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm sm:text-base leading-snug text-foreground" style={{ fontWeight: 600 }}>
                    {c.title}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-primary transition-transform mt-0.5 ${expanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </div>
                <p
                  className={`text-sm text-muted-foreground mt-1.5 leading-relaxed text-left ${expanded ? '' : 'line-clamp-3'}`}
                >
                  {c.description}
                </p>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1.5 inline-block">
                  {expanded ? 'Tap to collapse' : 'Tap to expand thread'}
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
              <div className="flex flex-wrap gap-1.5 mt-2">
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
              </div>
            </div>
          </div>

          {media && media.length > 0 && (
            <div className="shrink-0 self-start w-full sm:w-auto flex justify-center sm:block">
              <ThoughtMediaSection images={media} title={c.title} onImageClick={onImageClick} />
            </div>
          )}
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
              <div className="mt-4 pt-4 border-t border-border/80 space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {c.location}
                  </span>
                  <span className="text-border">·</span>
                  <span>Posted {format(new Date(c.created_at), 'MMM d, yyyy')}</span>
                  <span className="text-border">·</span>
                  <span>Updated {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Status progress</p>
                  <StatusStepper currentStatus={c.status} />
                  {c.status_log.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-border space-y-3">
                      <h3 className="text-xs text-muted-foreground uppercase tracking-wider">History</h3>
                      {c.status_log.map((log, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs sm:text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div>
                            <p>
                              <span style={{ fontWeight: 500 }}>{log.old_status}</span>
                              <span className="text-muted-foreground"> → </span>
                              <span style={{ fontWeight: 500 }}>{log.new_status}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.note} · {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border/80 overflow-hidden bg-card/30">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/80 bg-muted/20">
                    <MessageSquare className="w-4 h-4" />
                    <h2 className="text-sm" style={{ fontWeight: 600 }}>
                      Comments ({c.comments.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-border/60">
                    {c.comments.map(cm => (
                      <div
                        key={cm.id}
                        className={`px-4 py-3 ${cm.parent_id ? 'ml-6 border-l-2 border-primary/20' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs"
                            style={{ fontWeight: 600 }}
                          >
                            {firstNameOnly(cm.user_name).charAt(0)}
                          </div>
                          <span className="text-sm" style={{ fontWeight: 500 }}>
                            {firstNameOnly(cm.user_name)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(cm.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{cm.text}</p>
                      </div>
                    ))}
                    {c.comments.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No comments yet. Be the first!
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-border/80 flex gap-2">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm"
                    />
                    <button
                      type="button"
                      disabled={!newComment.trim() || busy || (allowInteract && !onSendComment)}
                      onClick={async () => {
                        if (!allowInteract || !onSendComment || !newComment.trim()) return;
                        setBusy(true);
                        try {
                          await onSendComment(newComment.trim());
                          setNewComment('');
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                      aria-label="Send comment"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Prefer a dedicated URL?{' '}
                  <Link
                    to={paths.complaint(c.id)}
                    className="text-primary hover:underline font-medium"
                  >
                    Open full page
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}

export function ComplaintsPage() {
  const { user, backendMode } = useAuth();
  const supabase = getSupabaseClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'discussed'>('recent');
  const [searchError, setSearchError] = useState('');
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [feedComplaints, setFeedComplaints] = useState<Complaint[]>([]);
  const [topPeople, setTopPeople] = useState<User[]>([]);
  const [feedError, setFeedError] = useState('');
  const cloud = backendMode === 'supabase';

  const refreshThoughts = useCallback(async () => {
    if (!cloud) {
      setFeedComplaints(complaints);
      setTopPeople(leaderboard.slice(0, 8));
      setFeedError('');
      return;
    }
    if (!supabase || !user) {
      setFeedComplaints([]);
      setTopPeople([]);
      setFeedError('');
      return;
    }
    try {
      const [list, leaders] = await Promise.all([
        listComplaints(supabase, user.id),
        fetchLeaderboardProfiles(supabase, 8),
      ]);
      setFeedComplaints(list);
      setTopPeople(leaders);
      setFeedError('');
    } catch (err) {
      setFeedComplaints([]);
      setTopPeople([]);
      setFeedError(err instanceof Error ? err.message : 'Could not load thoughts. Check Supabase and try again.');
    }
  }, [cloud, supabase, user]);

  useEffect(() => {
    void refreshThoughts();
  }, [refreshThoughts]);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const normalizedSearch = search.trim();

  const filtered = feedComplaints
    .filter(c => {
      if (
        normalizedSearch &&
        !c.title.toLowerCase().includes(normalizedSearch.toLowerCase()) &&
        !c.description.toLowerCase().includes(normalizedSearch.toLowerCase())
      )
        return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.upvotes - a.upvotes;
      if (sortBy === 'discussed') return b.comments.length - a.comments.length;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleSearchChange = (value: string) => {
    if (value.length > 80) {
      setSearchError('Search is limited to 80 characters.');
      return;
    }
    setSearchError('');
    setSearch(value.replace(/\s{2,}/g, ' '));
  };

  const liveFeedItems = [...feedComplaints]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(c => ({
      id: c.id,
      label: c.is_anonymous ? 'Anonymous' : firstNameOnly(c.user_name),
      action: 'shared a thought',
      title: c.title.length > 48 ? `${c.title.slice(0, 48)}…` : c.title,
      time: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }),
    }));

  const activePreview = topPeople;
  return (
    <div className="w-full max-w-7xl mx-auto pb-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 xl:gap-10 lg:items-start">
        <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className="premium-hero">
        <h1 className="text-2xl sm:text-3xl" style={{ fontWeight: 700 }}>
          Thoughts Feed
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cloud
            ? 'Live campus thoughts from your Supabase project — upvote, comment, and open threads. Filter and sort like before; photos come from attachments on each thought.'
            : 'Read-only feed from the bundled thought catalog. Filter by status and category, sort by date, votes, or reply count. Tap a thought to expand the thread in place; a few cards include photos you can tap to enlarge.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs">
            <Flame className="w-3.5 h-3.5" /> Trending
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Most discussed
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs">
            <Bookmark className="w-3.5 h-3.5" /> Saved topics
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search thoughts, tags, or topics..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border ${
                searchError ? 'border-red-500' : 'border-border'
              } focus:ring-2 focus:ring-primary/40 outline-none text-sm`}
            />
            {searchError && <p className="text-xs text-red-500 mt-1">{searchError}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm transition-colors ${
              showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-card rounded-xl border border-border">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as Status | 'All')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  {(['Pending', 'Reviewed', 'Processing', 'Resolved'] as Status[]).map(s => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <Select value={categoryFilter} onValueChange={value => setCategoryFilter(value as Category | 'All')}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
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
              <Select value={sortBy} onValueChange={value => setSortBy(value as 'recent' | 'popular' | 'discussed')}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="popular">Most upvoted</SelectItem>
                  <SelectItem value="discussed">Most discussed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} thought{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {feedError && cloud && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {feedError}
          </div>
        )}
        {filtered.map(c => (
          <ThoughtCard
            key={c.id}
            c={c}
            onImageClick={(src, alt) => setLightbox({ src, alt })}
            allowInteract={cloud && Boolean(user && supabase)}
            onToggleUpvote={
              cloud && user && supabase
                ? async () => {
                    await toggleComplaintUpvote(supabase, c.id, user.id, c.upvoted_by_me);
                    await refreshThoughts();
                  }
                : undefined
            }
            onSendComment={
              cloud && user && supabase
                ? async text => {
                    await addComplaintCommentRow(supabase, {
                      complaint_id: c.id,
                      user_id: user.id,
                      text,
                      parent_id: null,
                    });
                    await refreshThoughts();
                  }
                : undefined
            }
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-secondary/20">
          <p className="text-muted-foreground">No thoughts found matching your filters.</p>
        </div>
      )}

      <ImageLightbox src={lightbox?.src ?? null} alt={lightbox?.alt ?? ''} onClose={closeLightbox} />
        </div>

        <aside className="hidden lg:block min-w-0 space-y-4 pt-2 lg:sticky lg:top-20 xl:top-24 self-start">
          <section className="premium-panel border-border/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <h2 className="text-sm" style={{ fontWeight: 700 }}>
                Live feed
              </h2>
              <Radio className="w-3.5 h-3.5 text-muted-foreground ml-auto" aria-hidden />
            </div>
            <ul className="space-y-3 max-h-[min(52vh,28rem)] overflow-y-auto pr-1 -mr-1">
              {liveFeedItems.map(item => (
                <li key={item.id} className="text-xs leading-snug">
                  <p className="text-muted-foreground">
                    <span className="text-foreground" style={{ fontWeight: 600 }}>
                      {item.label}
                    </span>{' '}
                    {item.action}
                  </p>
                  <p className="text-[11px] text-muted-foreground/90 mt-0.5 line-clamp-2">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.time}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="premium-panel border-border/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm" style={{ fontWeight: 700 }}>
                Active users
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {cloud
                ? `${topPeople.length} on the leaderboard snapshot`
                : (
                  <>
                    <span className="text-foreground tabular-nums" style={{ fontWeight: 600 }}>
                      {47}
                    </span>{' '}
                    online now (demo)
                  </>
                )}
            </p>
            <div className="flex flex-wrap gap-2">
              {activePreview.map(u => (
                <div key={u.id} className="relative shrink-0" title={firstNameOnly(u.name)}>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-[11px] ring-1 ring-border/50"
                    style={{ fontWeight: 700 }}
                  >
                    {firstNameOnly(u.name).charAt(0)}
                  </span>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
