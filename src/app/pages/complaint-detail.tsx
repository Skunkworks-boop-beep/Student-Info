import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, ArrowUp, MapPin, Send, MessageSquare } from 'lucide-react';
import { paths } from '../paths';
import { complaints } from '../data/mock-data';
import { firstNameOnly } from '../utils/display-name';
import { StatusBadge, PriorityBadge } from '../components/status-badge';
import { StatusStepper } from '../components/status-stepper';
import { formatDistanceToNow, format } from 'date-fns';

export function ComplaintDetailPage() {
  const { id } = useParams();
  const complaint = complaints.find(c => c.id === id);
  const [newComment, setNewComment] = useState('');

  if (!complaint) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Thought not found.</p>
        <Link to={paths.complaints} className="text-primary hover:underline text-sm mt-2 inline-block">Back to thoughts</Link>
      </div>
    );
  }

  return (
    <div className="premium-page max-w-5xl">
      {/* Back */}
      <Link to={paths.complaints} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to thoughts
      </Link>

      {/* Header card */}
      <div className="premium-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl mb-2" style={{ fontWeight: 700 }}>{complaint.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{complaint.is_anonymous ? 'Anonymous' : firstNameOnly(complaint.user_name)}</span>
              <span>·</span>
              <span>{format(new Date(complaint.created_at), 'MMM d, yyyy')}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{complaint.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${complaint.upvoted_by_me ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'} transition-colors`}>
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm" style={{ fontWeight: 600 }}>{complaint.upvotes}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{complaint.category}</span>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">{complaint.description}</p>
      </div>

      {/* Status Stepper */}
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

      {/* Comments */}
      <div className="premium-panel">
        <div className="flex items-center gap-2 p-5 border-b border-border">
          <MessageSquare className="w-4 h-4" />
          <h2 className="text-sm" style={{ fontWeight: 600 }}>Comments ({complaint.comments.length})</h2>
        </div>

        <div className="divide-y divide-border">
          {complaint.comments.map(c => (
            <div key={c.id} className={`p-5 ${c.parent_id ? 'ml-8 border-l-2 border-primary/20' : ''}`}>
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
            </div>
          ))}

          {complaint.comments.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No comments yet. Be the first!</div>
          )}
        </div>

        {/* Add comment */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm"
            />
            <button
              disabled={!newComment.trim()}
              className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
