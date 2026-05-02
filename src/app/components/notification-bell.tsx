import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Bell, X, MessageSquare, RefreshCw, AlertCircle, CheckCircle2, AtSign, Heart, UserPlus } from 'lucide-react';
import { notifications } from '../data/mock-data';
import { formatDistanceToNow } from 'date-fns';
import { useSound } from '../audio/sound-context';
import { useAuth } from './auth-context';
import { getSupabaseClient } from '../../lib/supabase';
import { listNotifications, markAllNotificationsRead } from '../api/supabase-api';
import type { Notification } from '../data/mock-data';

const TYPE_ICON: Record<string, ReactNode> = {
  status_change: <RefreshCw className="w-4 h-4 text-blue-500" />,
  new_comment: <MessageSquare className="w-4 h-4 text-purple-500" />,
  mention: <AtSign className="w-4 h-4 text-primary" />,
  complaint_resolved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  system_alert: <AlertCircle className="w-4 h-4 text-amber-500" />,
  post_like: <Heart className="w-4 h-4 text-rose-500" />,
  new_follower: <UserPlus className="w-4 h-4 text-emerald-500" />,
  post_comment: <MessageSquare className="w-4 h-4 text-sky-500" />,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const unread = items.filter(n => !n.is_read).length;
  const { play } = useSound();
  const { user, backendMode } = useAuth();
  const supabase = getSupabaseClient();
  const cloud = backendMode === 'supabase';

  const reload = useCallback(async () => {
    if (!cloud) {
      setItems(notifications);
      return;
    }
    if (!supabase || !user) {
      setItems([]);
      return;
    }
    try {
      const list = await listNotifications(supabase, user.id);
      setItems(list);
    } catch {
      setItems([]);
    }
  }, [cloud, supabase, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const markAllRead = () => {
    play('tap');
    if (cloud && supabase && user) {
      void (async () => {
        await markAllNotificationsRead(supabase, user.id);
        await reload();
      })();
      return;
    }
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
                  className={`p-4 border-b border-border last:border-0 text-sm ${!n.is_read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">{TYPE_ICON[n.type] ?? <Bell className="w-4 h-4" />}</div>
                    <div>
                      <p className="leading-snug">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground text-center">No notifications yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
