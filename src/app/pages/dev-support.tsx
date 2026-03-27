import React, { useState } from 'react';
import { Heart, Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

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

  const handleSend = () => {
    if (!selectedDev) return;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setMessage('');
    setSelectedDev('');
  };

  return (
    <div className="premium-page max-w-5xl">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 700 }}>Developer Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Show your appreciation with Support Tokens (+8 XP)</p>
      </div>

      {sent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Support Token sent! You earned +8 XP!
        </motion.div>
      )}

      {/* Dev cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEVS.map(dev => (
          <button
            key={dev.id}
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

      {/* Send token */}
      {selectedDev && (
        <div className="premium-panel p-6">
          <h2 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Send token to {DEVS.find(d => d.id === selectedDev)?.name}
          </h2>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write an optional message of appreciation..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-input-background border border-border focus:ring-2 focus:ring-primary/40 outline-none text-sm resize-none mb-4"
          />
          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <Send className="w-4 h-4" />
            Send Support Token
          </button>
        </div>
      )}
    </div>
  );
}
