import { useState } from 'react';
import { Search, Sparkles, Plus, Bot, User, Send, Filter, BookOpen, Users, Clock3, Star, ArrowUpRight, Mic, Paperclip } from 'lucide-react';
import { useSound } from '../audio/sound-context';

const CHAT_THREADS = [
  { id: 't1', title: 'Appeal grade complaint drafting', updatedAt: '2m ago', unread: true },
  { id: 't2', title: 'How to escalate safety issue', updatedAt: '18m ago', unread: false },
  { id: 't3', title: 'Campus transport complaint format', updatedAt: '1h ago', unread: false },
  { id: 't4', title: 'Scholarship office delay case', updatedAt: '3h ago', unread: false },
];

const STARTER_PROMPTS = [
  'Draft a complaint about broken lab equipment.',
  'Summarize my unresolved complaints and suggest next steps.',
  'Create a respectful response to an admin update.',
  'Generate a weekly report from my complaint statuses.',
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
    text: 'For IT complaints, mention exact lab room + affected devices. Admin asked us to always add this.',
    upvotes: 16,
    time: '26m ago',
  },
  {
    id: 'c3',
    student: 'Lina',
    role: 'Student',
    text: 'If your complaint is urgent safety-related, mark High priority and link previous complaint IDs.',
    upvotes: 12,
    time: '40m ago',
  },
];

export function AIAssistantPage() {
  const { play } = useSound();
  const [selectedThread, setSelectedThread] = useState('t1');

  return (
    <div className="premium-page max-w-7xl mx-auto">
      <div className="premium-header gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl" style={{ fontWeight: 700 }}>AI Assistant Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan, draft, and refine complaints with AI plus student-supported responses.</p>
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
            onClick={() => play('panel')}
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
            {CHAT_THREADS.map(thread => (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  play('tap');
                  setSelectedThread(thread.id);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                  selectedThread === thread.id
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:bg-accent'
                }`}
              >
                <p className="text-sm truncate" style={{ fontWeight: 600 }}>{thread.title}</p>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                  <span>{thread.updatedAt}</span>
                  {thread.unread && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
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
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-sm">
                I can help draft complaints, summarize status updates, and suggest next steps. What should we work on?
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-sm">
                Draft a structured complaint about recurring internet outages in Block B.
              </div>
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-sm">
                Draft prepared. I included issue timeline, impact on classes, and request for ETA. You can refine tone before posting.
              </div>
            </div>
          </div>

          <div className="px-3 sm:px-4 pb-3 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => play('tap')}
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
                placeholder="Ask AI Assistant..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
              <button type="button" onClick={() => play('send')} className="p-2.5 rounded-xl bg-primary text-primary-foreground">
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
              <button type="button" onClick={() => play('tap')} className="w-full text-left text-sm px-3 py-2 rounded-xl bg-secondary hover:bg-accent">
                Draft Complaint
              </button>
              <button type="button" onClick={() => play('tap')} className="w-full text-left text-sm px-3 py-2 rounded-xl bg-secondary hover:bg-accent">
                Summarize Updates
              </button>
              <button type="button" onClick={() => play('tap')} className="w-full text-left text-sm px-3 py-2 rounded-xl bg-secondary hover:bg-accent">
                Generate Weekly Report
              </button>
              <button type="button" onClick={() => play('tap')} className="w-full text-left text-sm px-3 py-2 rounded-xl bg-secondary hover:bg-accent">
                Escalation Template
              </button>
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
