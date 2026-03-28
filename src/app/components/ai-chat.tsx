import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../audio/sound-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const FAQ_RESPONSES: Record<string, string> = {
  'how do i submit':
    'Use **New Thought** in the sidebar. Add title, description, category, priority, optional location, anonymity, and attachments (images/video per the on-screen limits). Submit runs validation and a success screen; the list feed still shows the bundled sample thoughts.',
  track:
    'Open **Dashboard** for your counts and recent threads, or **Thoughts** for the full feed. Each thread has a status stepper: Pending → Reviewed → Processing → Resolved (from the static record on the detail page).',
  anonymous:
    'On New Thought, turn on **Submit anonymously** so other students see a generic name; the sample data model still ties a record to an id for admins in a real backend.',
  xp:
    'UNI XP is the gamification layer: the UI shows earning +10 on a successful submit flow, +5 for comments in the product story, leaderboard ranks from bundled data, and Dev Support tokens (+8) as a local toast.',
  where:
    'Use **Campus Map** for the tactical grid and pins. Names match the sample campus; your school would replace geometry and issue data.',
  office:
    'Sample copy in this assistant points to Admin Building rooms for demo wayfinding—not tied to your real campus.',
  help:
    'I match keywords to short answers about thoughts, the map, XP, and navigation. I am not a live LLM—use **AI Assistant** in the nav for the richer (still static) workspace UI.',
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key)) return response.replace(/\*\*(.*?)\*\*/g, '$1');
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hi — I'm the floating help widget. I answer common questions from built-in shortcuts (not a remote AI). Try asking how to submit a thought or what UNI XP is.";
  }
  return "I didn't match a preset topic. I can explain New Thought, the Thoughts feed, dashboard summaries, campus map, XP, or anonymous mode. For the full assistant layout, open AI Assistant in the sidebar.";
}

export function AIChatWidget() {
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Hi — quick answers about Student.Info: thoughts, map, XP, and navigation. I use keyword shortcuts in this build, not a live model.',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = () => {
    if (!input.trim()) return;
    play('send');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const reply: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: getAIResponse(userMsg.text) };
      setMessages(prev => [...prev, reply]);
      setTyping(false);
    }, 800 + Math.random() * 700);
  };

  const quickActions = [
    'How do I submit a thought?',
    'Track my thoughts',
    'What is UNI XP?',
    'Where is the student office?',
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-[26rem] max-h-[72vh] bg-card/95 backdrop-blur-md border border-border/80 rounded-3xl shadow-[0_28px_80px_rgba(15,23,42,0.22)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div>
                  <p className="text-sm" style={{ fontWeight: 600 }}>Help</p>
                  <p className="text-xs opacity-80">Shortcuts · Student.Info</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  play('tap');
                  setOpen(false);
                }}
                className="p-1 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary rounded-tl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {typing && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-muted-foreground">Typing...</div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick actions */}
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickActions.map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    play('tap');
                    setInput(action);
                  }}
                  className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/80 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about thoughts, map, XP..."
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => {
                  play('send');
                  send();
                }}
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => {
          play(open ? 'tap' : 'notify');
          setOpen(!open);
        }}
        className="fixed bottom-6 right-4 sm:right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-primary/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
