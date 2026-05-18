import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Plus, Bot, User, Send, Filter, BookOpen, Users, Clock3, Star, ArrowUpRight, Mic, Paperclip } from 'lucide-react';
import { useSound } from '../audio/sound-context';
import { motion, AnimatePresence } from 'motion/react';

type Message = { role: 'ai' | 'user'; text: string };

const THREAD_HISTORIES: Record<string, Message[]> = {
  t1: [
    { role: 'ai', text: 'Hi! I can help you draft a grade appeal. Tell me which subject and what went wrong — I\'ll structure it professionally.' },
    { role: 'user', text: 'My MIS midterm grade doesn\'t reflect my work. I lost 15 marks with no feedback.' },
    { role: 'ai', text: 'Got it. Here\'s a draft:\n\n"Dear [Lecturer\'s name],\n\nI am writing to formally appeal my MIS 201 midterm grade of [X]. Having reviewed the rubric, I believe [specific section] may have been marked in error — I completed all required steps as outlined in the brief.\n\nI kindly request written feedback and a re-evaluation of my submission.\n\nThank you for your time."' },
  ],
  t2: [
    { role: 'ai', text: 'Safety issues get priority handling. Describe what happened and where — I\'ll help you format it for the fastest possible review.' },
    { role: 'user', text: 'The stairwell lights in Block D have been out for two weeks. Students are tripping.' },
    { role: 'ai', text: 'This is a High priority safety issue. I\'d recommend this format:\n\n**Title:** Stairwell lighting failure — Block D (ongoing 2 weeks)\n**Category:** Safety · Priority: High\n**Location:** Block D, all stairwells\n\nInclude the date you first noticed it and any incident reports. Tagging it High will auto-notify the facilities admin immediately.' },
  ],
  t3: [
    { role: 'ai', text: 'Campus transport thoughts work best with route numbers and specific times. What\'s the issue?' },
    { role: 'user', text: 'Route 3 is always 20 minutes late between 8–9 AM.' },
    { role: 'ai', text: 'Here\'s a structured format for transport thoughts:\n\n**Route:** Route 3 (morning peak)\n**Pattern:** Consistent 15–25 min delays, 08:00–09:00\n**Impact:** Late arrivals to 08:30 lectures\n**Request:** Schedule review or additional vehicle during peak\n\nInclude 3–5 specific dates when it happened — admin can cross-reference GPS logs.' },
  ],
  t4: [
    { role: 'ai', text: 'Scholarship delays can be stressful. I can help draft a professional follow-up. What stage is your application at?' },
    { role: 'user', text: 'Applied 6 weeks ago, no response. The deadline for fee payment is next week.' },
    { role: 'ai', text: 'Here\'s an urgent follow-up template:\n\n"Dear Scholarship Office,\n\nI submitted my application on [date] (Reference: [ID if available]) and have not received a response in 6 weeks. My tuition payment deadline is [date], making this time-sensitive.\n\nCould you please confirm the status and an expected timeline?\n\nThank you,\n[Your name]"\n\nMark this thought as High priority so it escalates to the financial aid coordinator.' },
  ],
};

const CANNED_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['grade', 'appeal', 'marks', 'exam', 'assignment', 'lecturer', 'professor'],
    response: 'Here\'s a revised draft for your grade appeal. Key elements I\'ve included: specific module code, the assessment in question, a reference to the marking rubric, and a polite request for a written explanation. Would you like me to make the tone more formal or add specific dates?',
  },
  {
    keywords: ['internet', 'wifi', 'network', 'outage', 'lab', 'computer', 'IT', 'connection'],
    response: 'For IT issues, include: exact lab room or building, the number of affected devices, when it started, and whether it\'s intermittent or constant. I\'ve formatted your thought with all of these — it\'s ready to submit under the IT category with Medium priority.',
  },
  {
    keywords: ['safety', 'light', 'dark', 'stairwell', 'broken', 'dangerous', 'emergency', 'fire'],
    response: 'Safety thoughts auto-escalate when marked High priority. I\'ve formatted this with a clear incident description, location, and start date. I\'ve also added a note requesting an urgent timeline — campus security typically responds within 24 hours to High priority safety items.',
  },
  {
    keywords: ['bus', 'transport', 'route', 'late', 'delay', 'shuttle', 'schedule'],
    response: 'Transport thought drafted. I\'ve included the route number, the time window, and an estimated impact on lecture attendance. Adding 3–5 specific dates where this occurred will strengthen your case — shall I add some placeholder dates you can fill in?',
  },
  {
    keywords: ['scholarship', 'bursary', 'financial', 'fee', 'payment', 'funding', 'award'],
    response: 'Drafted a formal follow-up for the scholarship office. I\'ve flagged it as urgent given your payment deadline, included a reference request, and CC\'d the financial aid escalation path. Do you have an application reference number I can include?',
  },
  {
    keywords: ['summarize', 'summary', 'overview', 'report', 'weekly', 'status'],
    response: 'Here\'s your thought summary:\n\n• 2 thoughts pending admin response (oldest: 12 days)\n• 1 thought in Processing — expected resolution this week\n• 1 thought Resolved last week (IT lab issue)\n\nRecommended next step: follow up on the Academic thought — it\'s been pending the longest. Want me to draft a polite nudge?',
  },
  {
    keywords: ['draft', 'write', 'format', 'template', 'create', 'help me'],
    response: 'Draft ready. I\'ve structured it with a clear title, category, priority, and a three-paragraph body: what happened, how long it\'s been an issue, and what resolution you\'re requesting. Would you like to adjust the priority level or add a specific location?',
  },
];

const DEFAULT_RESPONSE =
  'Got it. Based on what you\'ve described, I\'d suggest submitting this under the most relevant category with Medium priority. I can help you refine the title, add supporting detail, or adjust the tone. What would you like to change?';

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const { keywords, response } of CANNED_RESPONSES) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) return response;
  }
  return DEFAULT_RESPONSE;
}

const STARTER_PROMPTS = [
  'Draft a thought about broken lab equipment.',
  'Summarize my unresolved thoughts and suggest next steps.',
  'Create a respectful response to an admin update.',
  'Generate a weekly report from my thought statuses.',
];

const COMMUNITY_RESPONSES = [
  {
    id: 'c1',
    student: 'Aseel',
    role: 'Student Mentor',
    text: 'For grade appeals, include timeline + assignment rubric screenshots. This usually gets faster review.',
    upvotes: 23,
    time: '11m ago',
  },
  {
    id: 'c2',
    student: 'Erik',
    role: 'Engineering Student',
    text: 'For IT thoughts, mention exact lab room + affected devices. Admin asked us to always add this.',
    upvotes: 16,
    time: '26m ago',
  },
  {
    id: 'c3',
    student: 'Lina',
    role: 'Student',
    text: 'If your thought is urgent safety-related, mark High priority and link previous thought IDs.',
    upvotes: 12,
    time: '40m ago',
  },
];

const TOOL_PROMPTS: Record<string, string> = {
  'Draft thought': 'Draft a structured campus thought for me.',
  'Summarize Updates': 'Summarize my unresolved thoughts and suggest next steps.',
  'Generate Weekly Report': 'Generate a weekly report from my thought statuses.',
  'Escalation Template': 'Give me an escalation template for an unresolved issue.',
};

export function AIAssistantPage() {
  const { play } = useSound();
  const [selectedThread, setSelectedThread] = useState('t1');
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>(
    Object.fromEntries(Object.entries(THREAD_HISTORIES).map(([k, v]) => [k, [...v]]))
  );
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = threadMessages[selectedThread] ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    play('send');
    setInput('');
    setThreadMessages(prev => ({
      ...prev,
      [selectedThread]: [...(prev[selectedThread] ?? []), { role: 'user', text: trimmed }],
    }));
    setIsTyping(true);
    const delay = 900 + Math.random() * 800;
    setTimeout(() => {
      const response = getAIResponse(trimmed);
      setThreadMessages(prev => ({
        ...prev,
        [selectedThread]: [...(prev[selectedThread] ?? []), { role: 'ai', text: response }],
      }));
      setIsTyping(false);
      play('notify');
    }, delay);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="premium-page max-w-7xl mx-auto">
      <div className="premium-header gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl" style={{ fontWeight: 700 }}>AI Assistant Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask anything about your campus thoughts — drafting, escalation, or status summaries.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => play('tap')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-accent text-sm flex-1 sm:flex-none"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            type="button"
            onClick={() => {
              play('panel');
              const newId = `t${Date.now()}`;
              setThreadMessages(prev => ({
                ...prev,
                [newId]: [{ role: 'ai', text: 'New session started. What would you like to work on?' }],
              }));
              setSelectedThread(newId);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        {/* Left rail */}
        <aside className="xl:col-span-3 premium-panel p-3 sm:p-4 h-fit xl:h-[calc(100vh-15rem)] xl:overflow-y-auto">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search sessions..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="space-y-1.5">
            {Object.keys(threadMessages).map(id => {
              const label =
                id === 't1' ? 'Appeal grade thought drafting'
                : id === 't2' ? 'How to escalate a safety issue'
                : id === 't3' ? 'Campus transport thought format'
                : id === 't4' ? 'Scholarship office delay case'
                : 'New session';
              const lastMsg = threadMessages[id]?.at(-1);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    play('tap');
                    setSelectedThread(id);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                    selectedThread === id
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:bg-accent'
                  }`}
                >
                  <p className="text-sm truncate" style={{ fontWeight: 600 }}>{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {lastMsg?.text.slice(0, 40) ?? ''}…
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center conversation */}
        <section className="xl:col-span-6 premium-panel h-fit xl:h-[calc(100vh-15rem)] flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm" style={{ fontWeight: 700 }}>Assistant Conversation</p>
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Session details <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3 h-[320px] sm:h-[360px] xl:h-full overflow-y-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                      msg.role === 'ai'
                        ? 'rounded-tl-sm bg-secondary'
                        : 'rounded-tr-sm bg-primary text-primary-foreground'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 sm:px-4 pb-3 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  play('tap');
                  sendMessage(prompt);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="p-2.5 sm:p-3 border-t border-border">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => play('tap')} className="p-2 rounded-lg hover:bg-accent">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </button>
              <button type="button" onClick={() => play('tap')} className="p-2 rounded-lg hover:bg-accent">
                <Mic className="w-4 h-4 text-muted-foreground" />
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask AI Assistant..."
                disabled={isTyping}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Right insights + community */}
        <aside className="xl:col-span-3 space-y-4 h-fit xl:h-[calc(100vh-15rem)] xl:overflow-y-auto">
          <div className="premium-panel p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm" style={{ fontWeight: 700 }}>Tools & Navigation</p>
            </div>
            <div className="space-y-2">
              {Object.entries(TOOL_PROMPTS).map(([label, prompt]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    play('tap');
                    sendMessage(prompt);
                  }}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl bg-secondary hover:bg-accent transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="premium-panel p-3 sm:p-4 h-[420px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm" style={{ fontWeight: 700 }}>Student Responses</p>
              </div>
              <button className="text-xs text-muted-foreground hover:text-foreground">View all</button>
            </div>
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {COMMUNITY_RESPONSES.map(response => (
                <article key={response.id} className="rounded-xl border border-border/80 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div>
                      <p className="text-xs" style={{ fontWeight: 700 }}>{response.student}</p>
                      <p className="text-[11px] text-muted-foreground">{response.role}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <Clock3 className="w-3 h-3" />
                      {response.time}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{response.text}</p>
                  <div className="mt-2 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {response.upvotes} helpful votes
                  </div>
                </article>
              ))}
            </div>
            <button type="button" onClick={() => play('notify')} className="mt-3 w-full px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm shrink-0">
              Ask students for input
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
