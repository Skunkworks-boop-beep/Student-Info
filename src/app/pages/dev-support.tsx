import { useState } from 'react';
import { Heart, Send, Sparkles, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { SUPPORT_EMAIL } from '../config/app';

const DEVS = [
  { id: 'd1', name: 'Damilola', role: 'Tech Lead', tokens: 42 },
  { id: 'd2', name: 'Aseel', role: 'Platform, workflow & analytics', tokens: 28 },
  { id: 'd3', name: 'Erik', role: 'AI, map & student experience', tokens: 35 },
  { id: 'd4', name: 'Abilio', role: 'Engagement & feedback loops', tokens: 22 },
  { id: 'd5', name: 'Zanela', role: 'Categories, mobility & support', tokens: 31 },
  { id: 'd6', name: 'Nora', role: 'Product breadth & operations', tokens: 19 },
];

export function DevSupportPage() {
  const [selectedDev, setSelectedDev] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const supportMail =
    SUPPORT_EMAIL ||
    (typeof window !== 'undefined' ? `${window.location.hostname}@support.local` : 'support@example.com');

  const handleSend = () => {
    if (SUPPORT_EMAIL) {
      const subject = encodeURIComponent(
        selectedDev ? `Student.Info note for ${DEVS.find(d => d.id === selectedDev)?.name ?? 'team'}` : 'Student.Info support'
      );
      const body = encodeURIComponent(message.trim() || '(no message)');
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      setMessage('');
      setSelectedDev('');
      return;
    }
    if (!selectedDev) return;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setMessage('');
    setSelectedDev('');
  };

  return (
    <div className="premium-page max-w-5xl">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 700 }}>Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {SUPPORT_EMAIL ? (
            <>
              Messages open your mail client to{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-medium hover:underline">
                {SUPPORT_EMAIL}
              </a>
              . Set <code className="text-xs bg-muted px-1 rounded">VITE_SUPPORT_EMAIL</code> per deployment.
            </>
          ) : (
            <>
              For production, set <code className="text-xs bg-muted px-1 rounded">VITE_SUPPORT_EMAIL</code> so this page
              sends mail to your helpdesk. Below is optional in-app recognition UI for internal demos.
            </>
          )}
        </p>
      </div>

      {sent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />{' '}
          {SUPPORT_EMAIL ? 'Mail composer opened — send when ready.' : 'Thanks! (Demo: no mail sent — configure support email.)'}
        </motion.div>
      )}

      {SUPPORT_EMAIL && (
        <div className="premium-panel p-6 space-y-3">
          <h2 className="text-sm flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Mail className="w-4 h-4" />
            Contact your organization
          </h2>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe what you need help with…"
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm resize-none"
          />
          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <Send className="w-4 h-4" />
            Open mail to {supportMail}
          </button>
        </div>
      )}

      {/* Optional internal "shout out" cards when no support email — or always as secondary */}
      <div>
        <h2 className="text-sm text-muted-foreground mt-6 mb-3" style={{ fontWeight: 600 }}>
          {SUPPORT_EMAIL ? 'Team directory (optional)' : 'Team shout-outs (demo)'}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEVS.map(dev => (
            <button
              key={dev.id}
              type="button"
              onClick={() => setSelectedDev(dev.id)}
              className={`bg-card rounded-2xl border p-5 text-left transition-all ${
                selectedDev === dev.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg mb-3" style={{ fontWeight: 600 }}>
                {dev.name.charAt(0)}
              </div>
              <p className="text-sm" style={{ fontWeight: 600 }}>{dev.name}</p>
              <p className="text-xs text-muted-foreground">{dev.role}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-primary">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span style={{ fontWeight: 600 }}>{dev.tokens} tokens received</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {!SUPPORT_EMAIL && selectedDev && (
        <div className="premium-panel p-6">
          <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Note for {DEVS.find(d => d.id === selectedDev)?.name}
          </h2>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write an optional message of appreciation…"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm resize-none mb-4"
          />
          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <Send className="w-4 h-4" />
            Clear draft (demo)
          </button>
        </div>
      )}
    </div>
  );
}
