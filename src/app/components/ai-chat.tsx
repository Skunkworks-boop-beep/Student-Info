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
  'how do i submit': 'To submit a complaint, click the "New Complaint" button in the sidebar or dashboard. Fill in the title, description, category, and priority level. You can also attach files up to 5MB.',
  'track': 'You can track your complaints from the Dashboard or "My Complaints" page. Each complaint has a visual status stepper showing: Pending → Reviewed → Processing → Resolved.',
  'anonymous': 'Yes! When submitting a complaint, toggle the "Submit Anonymously" switch. Your identity will be hidden from other students, but admins can reach you via in-app messages tied to the complaint ID.',
  'xp': 'UNI XP is our gamification system! Earn points for submitting complaints (+10), commenting (+5), getting complaints resolved (+20), and more. Check the Leaderboard to see your ranking!',
  'where':
    'Most campuses include libraries, academic buildings, labs, dining, and recreation areas — exact names depend on your school. Use the Campus Map for interactive navigation and your institution’s layout.',
  'office': 'The Student Affairs Office is in the Admin Building, Room 102 (ground floor). Open Mon-Fri 9AM-5PM. The Registrar is in Room 201, same building.',
  'help': 'I can help you with: submitting complaints, tracking status, understanding UNI XP, finding campus locations, and general university FAQs. Just ask!',
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! 👋 I'm the Student.Info AI assistant. I can help you with complaints, campus navigation, XP system, and more. What would you like to know?";
  }
  return "I'm not sure about that specific question, but I can help with complaint submission, status tracking, campus locations, and the UNI XP system. Could you rephrase your question? For complex issues, please submit a complaint and our team will address it.";
}

export function AIChatWidget() {
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', text: "Hi! 👋 I'm your Student.Info AI assistant powered by AI. How can I help you today?" },
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

  const quickActions = ['How do I submit a complaint?', 'Track my complaint', 'What is UNI XP?', 'Where is the student office?'];

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
                  <p className="text-sm" style={{ fontWeight: 600 }}>AI Assistant</p>
                  <p className="text-xs opacity-80">Student.Info Helper</p>
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
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {typing && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick actions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quickActions.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      play('tap');
                      setInput(q);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setOpen(o => {
            if (!o) play('panel');
            else play('tap');
            return !o;
          });
        }}
        className="fixed bottom-4 right-4 sm:right-6 w-14 h-14 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground rounded-full shadow-[0_14px_34px_rgba(245,196,81,0.42)] hover:shadow-[0_18px_42px_rgba(245,196,81,0.48)] flex items-center justify-center z-50 transition-shadow"
        aria-label="AI Chat Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
