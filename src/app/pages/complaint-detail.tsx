import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, ArrowUp, MapPin, Send, MessageSquare } from 'lucide-react';
import { paths } from '../paths';
import { complaints, type Complaint } from '../data/mock-data';
import { firstNameOnly } from '../utils/display-name';
import { StatusBadge, PriorityBadge } from '../components/status-badge';
import { StatusStepper } from '../components/status-stepper';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../components/auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import {
  addComplaintCommentRow,
  getComplaintById,
  toggleComplaintUpvote,
} from '../api/supabase-api';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../audio/sound-context';

function LoadingSkeleton() {
  return (
    <div className="premium-page max-w-5xl space-y-4 animate-pulse">
      <div className="h-4 w-28 bg-muted rounded-lg" />
      <div className="premium-panel p-6 space-y-4">
        <div className="h-6 w-2/3 bg-muted rounded-lg" />
        <div className="h-4 w-1/3 bg-muted rounded-lg" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-muted rounded-full" />
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-5/6 bg-muted rounded" />
          <div className="h-4 w-4/6 bg-muted rounded" />
        </div>
      </div>
      <div className="premium-panel p-6 h-32 bg-muted rounded-2xl" />
      <div className="premium-panel p-6 h-48 bg-muted rounded-2xl" />
    </div>
  );
}

export function ComplaintDetailPage() {
  const { id } = useParams();
  const { user, backendMode } = useAuth();
  const { play } = useSound();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(cloud);
  const [loadError, setLoadError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [optimisticUpvoted, setOptimisticUpvoted] = useState<boolean | null>(null);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    if (!cloud) {
      setComplaint(complaints.find(c => c.id === id) ?? null);
      setLoadError('');
      setLoading(false);
      return;
    }
    if (!supabase) {
      setComplaint(null);
      setLoadError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const row = await getComplaintById(supabase, id, user?.id);
      setComplaint(row);
      setOptimisticUpvoted(null);
      setOptimisticUpvotes(null);
    } catch {
      setComplaint(null);
      setLoadError('Could not load this thought from Supabase.');
    } finally {
      setLoading(false);
    }
  }, [id, cloud, supabase, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) return <LoadingSkeleton />;

  if (!complaint) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{loadError || 'Thought not found.'}</p>
        <Link to={paths.complaints} className="text-primary hover:underline text-sm mt-2 inline-block">Back to thoughts</Link>
      </div>
    );
  }

  const canInteract = cloud ? Boolean(user && supabase) : true;
  const displayUpvoted = optimisticUpvoted ?? complaint.upvoted_by_me;
  const displayUpvotes = optimisticUpvotes ?? complaint.upvotes;

  const handleUpvote = async () => {
    if (!user) return;
    play('tap');
    const newUpvoted = !displayUpvoted;
    setOptimisticUpvoted(newUpvoted);
    setOptimisticUpvotes(displayUpvotes + (newUpvoted ? 1 : -1));
    if (!cloud || !supabase) return;
    setBusy(true);
    try {
      await toggleComplaintUpvote(supabase, complaint.id, user.id, complaint.upvoted_by_me);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || busy) return;
    play('send');
    setBusy(true);
    if (!cloud || !supabase || !user) {
      // local optimistic only
      setComplaint(prev => prev ? {
        ...prev,
        comments: [...prev.comments, {
          id: `local-${Date.now()}`,
          user_id: user?.id ?? 'demo',
          user_name: user?.name ?? 'You',
          text: newComment.trim(),
          parent_id: null,
          created_at: new Date().toISOString(),
        }],
      } : prev);
      setNewComment('');
      setBusy(false);
      play('success');
      return;
    }
    try {
      await addComplaintCommentRow(supabase, {
        complaint_id: complaint.id,
        user_id: user.id,
        text: newComment.trim(),
        parent_id: null,
      });
      setNewComment('');
      await refresh();
      play('success');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="premium-page max-w-5xl"
    >
      <Link to={paths.complaints} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to thoughts
      </Link>

      <div className="premium-panel p-6 mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl mb-2" style={{ fontWeight: 700 }}>{complaint.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{complaint.is_anonymous ? 'Anonymous' : firstNameOnly(complaint.user_name)}</span>
              <span>·</span>
              <span>{format(new Date(complaint.created_at), 'MMM d, yyyy')}</span>
              {complaint.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{complaint.location}</span>
                </>
              )}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            type="button"
            disabled={!canInteract || busy}
            onClick={() => void handleUpvote()}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors ${
              displayUpvoted ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
            } disabled:opacity-50`}
          >
            <ArrowUp className="w-4 h-4" />
            <span className="text-sm tabular-nums" style={{ fontWeight: 600 }}>{displayUpvotes}</span>
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{complaint.category}</span>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">{complaint.description}</p>
      </div>

      <div className="premium-panel p-6">
        <h2 className="text-sm mb-5" style={{ fontWeight: 600 }}>Status Progress</h2>
        <StatusStepper currentStatus={complaint.status} />

        {complaint.status_log.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border space-y-3">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider">History</h3>
            {complaint.status_log.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p>
                    <span style={{ fontWeight: 500 }}>{log.old_status}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span style={{ fontWeight: 500 }}>{log.new_status}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{log.note} · {format(new Date(log.timestamp), 'MMM d, h:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="premium-panel">
        <div className="flex items-center gap-2 p-5 border-b border-border">
          <MessageSquare className="w-4 h-4" />
          <h2 className="text-sm" style={{ fontWeight: 600 }}>Comments ({complaint.comments.length})</h2>
        </div>

        <div className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {complaint.comments.map(c => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`p-5 ${c.parent_id ? 'ml-8 border-l-2 border-primary/20' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs" style={{ fontWeight: 600 }}>
                    {firstNameOnly(c.user_name).charAt(0)}
                  </div>
                  <span className="text-sm" style={{ fontWeight: 500 }}>{firstNameOnly(c.user_name)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{c.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {complaint.comments.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No comments yet. Be the first!</div>
          )}
        </div>

        <form onSubmit={handleComment} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!newComment.trim() || busy}
              className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
