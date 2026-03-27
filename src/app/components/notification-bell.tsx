import { useState } from 'react';
import { Bell, X, MessageSquare, RefreshCw, AlertCircle, CheckCircle2, AtSign } from 'lucide-react';
import { notifications } from '../data/mock-data';
import { formatDistanceToNow } from 'date-fns';
import { useSound } from '../audio/sound-context';

const TYPE_ICON: Record<string, React.ReactNode> = {
  status_change: <RefreshCw className="w-4 h-4 text-blue-500" />,
  new_comment: <MessageSquare className="w-4 h-4 text-purple-500" />,
  mention: <AtSign className="w-4 h-4 text-primary" />,
  complaint_resolved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  system_alert: <AlertCircle className="w-4 h-4 text-amber-500" />,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const unread = items.filter(n => !n.is_read).length;
  const { play } = useSound();

  const markAllRead = () => {
    play('tap');
    setItems(items.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(o => {
            if (!o) play('notify');
            else play('tap');
            return !o;
          });
        }}
        className="relative p-2.5 rounded-xl border border-transparent hover:border-border/70 hover:bg-card transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              play('tap');
              setOpen(false);
            }}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.16)] z-50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    play('tap');
                    setOpen(false);
                  }}
                  className="p-1 hover:bg-accent rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 p-4 border-b border-border hover:bg-accent/40 transition-colors ${
                    !n.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="mt-0.5">{TYPE_ICON[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
