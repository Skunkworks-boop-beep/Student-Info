import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Map,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  Trophy,
  Shield,
  LayoutDashboard,
  Users,
  Layers,
} from 'lucide-react';
import { useTheme } from '../components/theme-provider';
import { useAuth } from '../components/auth-context';
import { paths } from '../paths';
import { useSound, SoundToggleIconButton } from '../audio/sound-context';
import { APP_NAME, APP_TAGLINE } from '../config/app';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Thoughts feed',
    desc: 'Filterable catalog of sample threads with optional photos, upvotes, and detail pages.',
  },
  {
    icon: Map,
    title: 'Campus intelligence',
    desc: 'Tactical heat grid and pins driven by bundled facility scenarios; role-based zone inspection.',
  },
  {
    icon: Sparkles,
    title: 'AI surfaces',
    desc: 'Full assistant workspace (static layout) plus a floating widget with keyword-based help—not a hosted LLM in this build.',
  },
  {
    icon: Trophy,
    title: 'UNI XP & leaderboard',
    desc: 'Sample rankings and XP callouts; submit and dev-support flows show local XP feedback.',
  },
] as const;

/** Feature framework: one row per capability; contributors lists everyone who owned that idea (collaboration). */
const FEATURE_FRAMEWORK = [
  {
    id: 'notify',
    title: 'Auto-notification',
    summary: 'When an admin changes status, the backend raises an event and the system sends email or in-app alerts.',
    detail:
      'Ties admin workflow to student awareness — complements track-complaints and analytics.',
    contributors: ['Aseel', 'Nora'] as const,
  },
  {
    id: 'track',
    title: 'Track complaints',
    summary: 'Each item has a status field: Pending → Reviewed → Processing → Resolved, surfaced in the UI.',
    detail: 'Progress visibility for students and admins.',
    contributors: ['Aseel', 'Nora'] as const,
  },
  {
    id: 'workflow',
    title: 'System workflow improvement',
    summary: 'Rules in the backend (e.g. if priority is High → mark urgent → notify admin immediately).',
    detail: 'Automates escalation and routing.',
    contributors: ['Aseel'] as const,
  },
  {
    id: 'security',
    title: 'Security control',
    summary: 'Each user has a role — admin or student — with controlled access to portals and actions.',
    detail: 'Foundation for all admin vs student experiences.',
    contributors: ['Aseel', 'Nora'] as const,
  },
  {
    id: 'heatmap',
    title: 'Heat map',
    summary: 'Complaints store a location; the backend counts per location and the frontend shows density (e.g. red = high volume).',
    detail: 'Helps students see where issues cluster on campus.',
    contributors: ['Aseel', 'Nora'] as const,
  },
  {
    id: 'comments-model',
    title: 'Comments & discussion',
    summary: 'Comments table (comment, user, complaint, text, time) enabling discussion on complaints.',
    detail: 'Shared foundation for threads, replies, and moderation stories.',
    contributors: ['Aseel', 'Nora', 'Abilio', 'Zanela'] as const,
  },
  {
    id: 'analytics',
    title: 'Dashboard analytics',
    summary: 'Queries such as COUNT by status and category; results feed charts for admins.',
    detail: 'Operational visibility — pairs with auto-notification and workflow.',
    contributors: ['Aseel', 'Nora'] as const,
  },
  {
    id: 'translator',
    title: 'AI translator',
    summary: 'Students write in their language; recipients see content in theirs (e.g. French in → English out).',
    detail: 'Cross-language complaints and responses.',
    contributors: ['Erik'] as const,
  },
  {
    id: 'ois',
    title: 'Front-desk quick window',
    summary: 'A compact kiosk or counter tablet so students can submit issues quickly during office hours.',
    detail: 'Embedded or corner UI for immediate intake at student services.',
    contributors: ['Erik'] as const,
  },
  {
    id: 'status-color',
    title: 'Status color coding',
    summary: 'Visual language for processing state — e.g. green solved, yellow in progress, gray in general library.',
    detail: 'Clarifies lifecycle at a glance.',
    contributors: ['Erik'] as const,
  },
  {
    id: 'rating',
    title: 'Evaluation & ratings',
    summary: 'Five-star service and problem-solving ratings to measure speed and quality.',
    detail: 'Feeds improvement loops for operations.',
    contributors: ['Erik'] as const,
  },
  {
    id: 'ai-map',
    title: 'AI assistant & campus map',
    summary:
      'AI for minor problems and wayfinding; interactive campus map with typical zones such as classrooms, halls, and offices.',
    detail: 'Assistant can point to blocks and show locations on the map.',
    contributors: ['Erik'] as const,
  },
  {
    id: 'peer-honesty',
    title: 'Peer help & honesty',
    summary: 'Other students can help — with checks so false solutions are discouraged.',
    detail: 'Trust layer on community answers.',
    contributors: ['Erik'] as const,
  },
  {
    id: 'reply-translate',
    title: 'Replies & translation under comments',
    summary: 'Reply to another student’s comment; optional translation alongside the thread.',
    detail: 'Shared UX across several teammates.',
    contributors: ['Abilio', 'Nora', 'Zanela'] as const,
  },
  {
    id: 'video-faq',
    title: 'Video & FAQ surfacing',
    summary: 'Pop-out video suggestions for common issues; quick access to frequently asked questions.',
    detail: 'Self-serve help next to formal complaints.',
    contributors: ['Abilio', 'Nora', 'Zanela'] as const,
  },
  {
    id: 'ai-chat',
    title: 'AI chat mode',
    summary: 'Dedicated mode to chat with AI to work through problems.',
    detail: 'Overlaps product narrative with Abilio, Nora, and Zanela.',
    contributors: ['Abilio', 'Nora', 'Zanela'] as const,
  },
  {
    id: 'kudos',
    title: 'Kudos, tokens & developer support',
    summary: 'Page to gift or support developers (Kudos / support tokens, donations) to improve the system.',
    detail: 'In-system support for ongoing development.',
    contributors: ['Abilio', 'Nora', 'Zanela'] as const,
  },
  {
    id: 'ringtone',
    title: 'Resolved ringtone',
    summary: 'Distinct in-app sound when a problem is marked solved.',
    detail: 'Celebrates closure and drives return visits.',
    contributors: ['Abilio'] as const,
  },
  {
    id: 'uni-xp',
    title: 'UNI XP & activity points',
    summary: 'Points for engaging with the app — motivates interaction and quality participation.',
    detail: 'Gamification layer tied to complaints and solutions.',
    contributors: ['Abilio', 'Zanela'] as const,
  },
  {
    id: 'categories-bus',
    title: 'Categories, appreciation & bus tracker',
    summary: 'Categories inside complaints, appreciation boxes, and bus tracker experience.',
    detail: 'Structured intake plus mobility context.',
    contributors: ['Nora', 'Zanela'] as const,
  },
  {
    id: 'tech-lead',
    title: 'Technical leadership',
    summary: 'Architecture, backend components, integration patterns, and delivery alignment across features.',
    detail: 'Cross-cutting ownership — works with everyone where systems meet.',
    contributors: ['Damilola'] as const,
  },
] as const;

/** Short bios for the team strip — aligned to the project brief (not the old placeholder roles). */
const TEAM_BIOS = [
  {
    name: 'Damilola',
    role: 'Tech Lead',
    highlight: true,
    blurb:
      'Overall architecture, backend components, integrations, and aligning the team on how features ship together.',
  },
  {
    name: 'Aseel',
    role: 'Platform, workflow & analytics',
    blurb:
      'Auto-notification, track complaints & status model, workflow rules, admin/student security, heat map, comments schema, dashboard analytics.',
  },
  {
    name: 'Erik',
    role: 'AI, map & student experience',
    blurb:
      'AI translator, front-desk quick window, status colors, evaluation, AI assistant, peer help with honesty checks, full campus map and wayfinding, ratings.',
  },
  {
    name: 'Abilio',
    role: 'Engagement & feedback loops',
    blurb:
      'Replies and translation UX, video and FAQ, AI chat mode, Kudos/tokens, resolved ringtone, UNI XP, donations, activity points, backend narrative for comments.',
  },
  {
    name: 'Nora',
    role: 'Product breadth & operations',
    blurb:
      'Overlapping scope on notifications, tracking, heat map, comments, analytics, workflow, security; plus donations, categories, appreciation, bus tracker with Zanela; shared reply/video/AI/gift flows.',
  },
  {
    name: 'Zanela',
    role: 'Categories, mobility & support',
    blurb:
      'Shared flows for replies, video, AI chat, developer support; categories and appreciation; bus tracker; UNI XP with Abilio.',
  },
] as const;

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { play } = useSound();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(15,23,42,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.06),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.06),transparent_45%)]" />

      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to={paths.landing} onClick={() => play('tap')} className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="text-sm" style={{ fontWeight: 800 }}>
                S
              </span>
            </div>
            <div className="text-left leading-tight">
              <p className="text-sm" style={{ fontWeight: 800 }}>
                {APP_NAME}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <SoundToggleIconButton />
            <button
              type="button"
              onClick={() => {
                play('theme');
                toggleTheme();
              }}
              className="rounded-xl border border-border/80 bg-card/90 p-2.5 transition hover:bg-accent"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {user ? (
              <Link
                to={paths.app}
                onClick={() => play('nav')}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground transition hover:opacity-90"
                style={{ fontWeight: 600 }}
              >
                <LayoutDashboard className="h-4 w-4" />
                Open app
              </Link>
            ) : (
              <Link
                to={paths.login}
                onClick={() => play('nav')}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground transition hover:opacity-90"
                style={{ fontWeight: 600 }}
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Campus issue intelligence
          </p>
          <h1 className="text-balance text-4xl sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]" style={{ fontWeight: 800 }}>
            One calm place for{' '}
            <span className="text-primary">thoughts</span>, maps, and action.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {APP_NAME} helps students surface what matters on campus — from quick thoughts with media to a tactical heat
            map and AI-guided help — without the noise of scattered channels.
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {user ? (
              <Link
                to={paths.app}
                onClick={() => play('nav')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-primary-foreground shadow-[0_12px_40px_rgba(15,23,42,0.18)] transition hover:opacity-95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                style={{ fontWeight: 700 }}
              >
                Go to dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  to={paths.login}
                  onClick={() => play('nav')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-primary-foreground shadow-[0_12px_40px_rgba(15,23,42,0.18)] transition hover:opacity-95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                  style={{ fontWeight: 700 }}
                >
                  Get started
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to={paths.login}
                  onClick={() => play('tap')}
                  className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-8 py-3.5 text-sm transition hover:bg-accent"
                  style={{ fontWeight: 600 }}
                >
                  I already have access
                </Link>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:gap-5"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i + 0.15 }}
              className="premium-panel premium-hover-lift rounded-2xl border border-border/80 p-5 sm:p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg" style={{ fontWeight: 700 }}>
                {f.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-16 rounded-2xl border border-dashed border-border/80 bg-secondary/30 px-6 py-8 text-center sm:px-10"
        >
          <p className="text-sm text-muted-foreground">
            Built for students and operations — anonymous options where it counts, moderation-ready workflows for admins,
            and a map that turns scattered reports into a clear picture of campus pressure.
          </p>
          {!user && (
            <Link
              to={paths.login}
              onClick={() => play('nav')}
              className="mt-5 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              style={{ fontWeight: 600 }}
            >
              Sign in with your school account
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
          className="mt-20 border-t border-border/60 pt-16 overflow-visible"
          aria-labelledby="credits-heading"
        >
          <div className="mx-auto max-w-3xl text-center mb-10">
            <p className="mb-3 inline-flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              Team & credits
            </p>
            <h2 id="credits-heading" className="text-2xl sm:text-3xl" style={{ fontWeight: 800 }}>
              Feature framework & ownership
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Each item summarizes the <span className="text-foreground/90">intended</span> capability from the team
              brief (events, schema, routing). The live preview implements matching UI with static data and client-side
              state—hover a card on desktop for detail and collaborators.
            </p>
          </div>

          <div className="mb-14">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <Layers className="h-4 w-4 text-primary" />
              Hover for details & collaborators
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURE_FRAMEWORK.map((item, i) => {
                const people = [...item.contributors];
                const collab = people.length > 1;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(0.04 * i, 0.4) }}
                    tabIndex={0}
                    className={`group relative rounded-2xl border bg-card/60 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      item.id === 'tech-lead'
                        ? 'border-primary/45 bg-primary/[0.05] ring-1 ring-primary/10'
                        : 'border-border/80 hover:border-border'
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <h3 className="text-sm leading-snug" style={{ fontWeight: 700 }}>
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {people.map(n => (
                          <span
                            key={n}
                            className="rounded-full border border-border/70 bg-secondary/60 px-2 py-0.5 text-[10px] text-foreground/90"
                            style={{ fontWeight: 600 }}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                      {collab && (
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          Collaboration — shared ownership on this capability.
                        </p>
                      )}
                      <p
                        className="mt-3 text-[10px] leading-relaxed text-[#1e2a1f] dark:text-[#e4e8df] lg:hidden rounded-lg border border-[#6f7a5e]/45 dark:border-[#4a5c46]/80 bg-[#9faa8c]/35 dark:bg-[#2a3528]/50 px-2.5 py-2"
                        style={{ fontWeight: 600 }}
                      >
                        {item.detail}
                      </p>
                    </div>
                    <div
                      className="pointer-events-none absolute left-0 right-0 top-[calc(100%-2px)] z-[60] hidden max-h-[min(70vh,320px)] overflow-y-auto rounded-xl border-2 border-[#6f7a5e]/60 dark:border-[#4a5c46] bg-[#9faa8c]/92 dark:bg-[#2a3528]/96 backdrop-blur-md p-4 text-left text-[#152018] shadow-xl opacity-0 ring-1 ring-[#6f7a5e]/20 dark:text-[#e8ebe3] dark:ring-white/5 transition-all duration-150 lg:block lg:translate-y-1 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:pointer-events-auto lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100"
                      role="tooltip"
                    >
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#3d4a38] dark:text-[#9faa8c]">
                        How it works
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#1a2419] dark:text-[#e4e8df]">{item.detail}</p>
                      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-[#3d4a38] dark:text-[#9faa8c]">
                        Contributors
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {people.map(n => (
                          <li key={n} className="text-xs text-[#152018] dark:text-[#f4f6f0]" style={{ fontWeight: 600 }}>
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mx-auto max-w-2xl text-center mb-8">
            <h3 className="text-lg" style={{ fontWeight: 800 }}>
              Team
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Summary by person — see the framework above for shared work.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_BIOS.map((member, i) => (
              <motion.article
                key={member.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
                className={`rounded-2xl border p-5 text-left ${
                  member.highlight
                    ? 'border-primary/50 bg-primary/[0.04] ring-1 ring-primary/10'
                    : 'border-border/80 bg-card/50'
                }`}
              >
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{member.role}</p>
                <h3 className="mt-1 text-lg" style={{ fontWeight: 800 }}>
                  {member.name}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{member.blurb}</p>
              </motion.article>
            ))}
          </div>

          <p className="mt-10 text-center text-[11px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Phased delivery, third-party services, and data integrations are coordinated at the project level; the
            framework cards stay the reference for who proposed each capability.
          </p>
        </motion.section>
      </main>

      <footer className="relative z-10 border-t border-border/60 py-8 px-4 text-center text-xs text-muted-foreground space-y-2">
        <p>© {new Date().getFullYear()} {APP_NAME}</p>
        <p className="text-[11px] max-w-md mx-auto leading-relaxed">
          Campus-ready template — connect your identity provider, map data, and notification channels for your institution.{' '}
          <a
            href="https://github.com/Skunkworks-boop-beep/Student-Info"
            className="text-primary hover:underline"
            style={{ fontWeight: 600 }}
            target="_blank"
            rel="noreferrer"
          >
            Source, credits and features
          </a>
        </p>
      </footer>
    </div>
  );
}
