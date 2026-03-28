import { useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Building2, BookOpen, Coffee, Bus, Shield, Crosshair, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../audio/sound-context';
import { useAuth } from '../components/auth-context';

export type IssueSeverity = 'low' | 'medium' | 'high';

export type CampusIssue = {
  id: string;
  title: string;
  category: string;
  severity: IssueSeverity;
  summary: string;
  reportedAt: string;
};

const GRID_COLS = 12;
const GRID_ROWS = 9;

function cellKey(row: number, col: number) {
  return `${row}-${col}`;
}

function coordsToCell(x: number, y: number) {
  const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor((x / 100) * GRID_COLS)));
  const row = Math.min(GRID_ROWS - 1, Math.max(0, Math.floor((y / 100) * GRID_ROWS)));
  return { row, col, key: cellKey(row, col) };
}

/** Facility pins (dormitory removed). Issues are aggregated into grid cells by coordinates. */
const BUILDINGS = [
  {
    id: 'lib',
    name: 'Main Library',
    type: 'Academic',
    icon: BookOpen,
    x: 35,
    y: 30,
    issues: [
      {
        id: 'i-lib-1',
        title: 'Study room HVAC uneven',
        category: 'Facilities',
        severity: 'medium' as const,
        summary: 'Temperature swings between floors; students report discomfort during exam weeks.',
        reportedAt: '2026-03-20',
      },
      {
        id: 'i-lib-2',
        title: 'Quiet zone noise bleed',
        category: 'Other',
        severity: 'low' as const,
        summary: 'Group work from adjacent wing carries into silent study rows.',
        reportedAt: '2026-03-18',
      },
    ],
  },
  {
    id: 'eng',
    name: 'Engineering Building',
    type: 'Academic',
    icon: Building2,
    x: 60,
    y: 25,
    issues: [
      {
        id: 'i-eng-1',
        title: 'Lab equipment calibration backlog',
        category: 'IT',
        severity: 'high' as const,
        summary: 'Three benches waiting on vendor calibration; lab sections sharing slots.',
        reportedAt: '2026-03-22',
      },
      {
        id: 'i-eng-2',
        title: 'Elevator wait times',
        category: 'Facilities',
        severity: 'medium' as const,
        summary: 'Peak-hour congestion between classes; average wait over 6 minutes.',
        reportedAt: '2026-03-19',
      },
      {
        id: 'i-eng-3',
        title: 'Project room booking conflicts',
        category: 'Administrative',
        severity: 'medium' as const,
        summary: 'Double-bookings in the shared project rooms reported weekly.',
        reportedAt: '2026-03-17',
      },
    ],
  },
  {
    id: 'caf',
    name: 'Main Cafeteria',
    type: 'Services',
    icon: Coffee,
    x: 45,
    y: 55,
    issues: [
      {
        id: 'i-caf-1',
        title: 'Vegan line throughput',
        category: 'Other',
        severity: 'low' as const,
        summary: 'Line length spikes at 12:30; students requesting a second prep station.',
        reportedAt: '2026-03-21',
      },
    ],
  },
  {
    id: 'admin',
    name: 'Admin Building',
    type: 'Administrative',
    icon: Shield,
    x: 25,
    y: 50,
    issues: [
      {
        id: 'i-adm-1',
        title: 'Registrar queue signage',
        category: 'Administrative',
        severity: 'low' as const,
        summary: 'Visitors unclear which desk handles transcripts vs. enrollment holds.',
        reportedAt: '2026-03-16',
      },
    ],
  },
  {
    id: 'bus',
    name: 'Bus Stop',
    type: 'Transport',
    icon: Bus,
    x: 15,
    y: 70,
    issues: [
      {
        id: 'i-bus-1',
        title: 'Evening route gaps',
        category: 'Transport',
        severity: 'medium' as const,
        summary: '30+ minute gap between shuttles after 18:00 on weekdays.',
        reportedAt: '2026-03-22',
      },
    ],
  },
  {
    id: 'lab',
    name: 'Computer Lab (Block D)',
    type: 'Academic',
    icon: Building2,
    x: 55,
    y: 45,
    issues: [
      {
        id: 'i-lab-1',
        title: 'GPU workstation downtime',
        category: 'IT',
        severity: 'high' as const,
        summary: 'Two high-memory machines offline; ML course sections impacted.',
        reportedAt: '2026-03-23',
      },
      {
        id: 'i-lab-2',
        title: 'Printer driver mismatch',
        category: 'IT',
        severity: 'low' as const,
        summary: 'macOS Sonoma clients failing on lab printers until re-profiled.',
        reportedAt: '2026-03-15',
      },
    ],
  },
  {
    id: 'sports',
    name: 'Sports Complex',
    type: 'Facilities',
    icon: Building2,
    x: 80,
    y: 35,
    issues: [
      {
        id: 'i-spo-1',
        title: 'Court lighting flicker',
        category: 'Facilities',
        severity: 'low' as const,
        summary: 'North court LEDs flicker during warmup; maintenance ticket opened.',
        reportedAt: '2026-03-14',
      },
    ],
  },
];

/** Extra zone-only issues (walkways, parking) not tied to a named building pin */
const ZONE_ONLY_ISSUES: Record<string, CampusIssue[]> = {
  '5-6': [
    {
      id: 'z-1',
      title: 'North plaza drainage',
      category: 'Facilities',
      severity: 'medium',
      summary: 'Pooling after rain near the crosswalk; slip risk flagged by student council.',
      reportedAt: '2026-03-20',
    },
  ],
  '7-7': [
    {
      id: 'z-2',
      title: 'Bike rack capacity',
      category: 'Transport',
      severity: 'low',
      summary: 'Racks full by 9:00; bikes locked to railings.',
      reportedAt: '2026-03-18',
    },
  ],
};

function severityWeight(s: IssueSeverity) {
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  return 1;
}

function heatScore(issues: CampusIssue[]) {
  if (issues.length === 0) return 0;
  return issues.reduce((acc, i) => acc + severityWeight(i.severity), 0);
}

function heatTier(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score === 0) return 0;
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 7) return 3;
  return 4;
}

/** Military-inspired tactical palette — readable in light & dark */
const TACTICAL_TIERS = [
  {
    tier: 0 as const,
    label: 'Clear',
    sub: 'No open signals',
    className:
      'bg-[#c5cbb8]/80 dark:bg-[#1c2218]/90 border-[#8a9278]/50 dark:border-[#3d4a38]',
  },
  {
    tier: 1 as const,
    label: 'Watch',
    sub: 'Low activity',
    className:
      'bg-[#9faa8c]/85 dark:bg-[#2a3528]/95 border-[#6f7a5e]/60 dark:border-[#4a5c46]',
  },
  {
    tier: 2 as const,
    label: 'Caution',
    sub: 'Moderate',
    className:
      'bg-[#8b9a6e]/90 dark:bg-[#3d4a2f]/95 border-[#5f6b4a]/65 dark:border-[#5a6b47]',
  },
  {
    tier: 3 as const,
    label: 'Elevated',
    sub: 'High pressure',
    className:
      'bg-[#b89a4a]/90 dark:bg-[#6b4f28]/95 border-[#8a6f35]/70 dark:border-[#8b6914]',
  },
  {
    tier: 4 as const,
    label: 'Critical',
    sub: 'Immediate attention',
    className:
      'bg-[#c45c3a]/92 dark:bg-[#7a2e1f]/95 border-[#a84828]/75 dark:border-[#b4532a]',
  },
];

function buildCellIssueMap(): Map<string, CampusIssue[]> {
  const map = new Map<string, CampusIssue[]>();

  for (const b of BUILDINGS) {
    const { key } = coordsToCell(b.x, b.y);
    const list = map.get(key) ?? [];
    for (const issue of b.issues) {
      list.push(issue);
    }
    map.set(key, list);
  }

  for (const [k, issues] of Object.entries(ZONE_ONLY_ISSUES)) {
    const list = map.get(k) ?? [];
    map.set(k, [...list, ...issues]);
  }

  return map;
}

const TOOLTIP_GAP = 12;
const VIEW_EDGE_PAD = 8;
/** Side inset (px) — matches `100vw - 24px` tooltip width (12px each side). */
const TOOLTIP_H_GUTTER = 12;
/** ~max tooltip height for flip logic (preview + list). */
const TOOLTIP_EST_HEIGHT = 220;
/** Full-bleed tooltip between gutters (no translateX); avoids left/right clipping on phones. */
const NARROW_VIEWPORT_MAX = 640;

/**
 * Fixed tooltip: on narrow screens, stretch between horizontal gutters (no -50% centering).
 * On wider screens, center on pointer with `left` clamped using the same width as the box.
 */
function getTooltipFixedStyle(clientX: number, clientY: number): CSSProperties {
  if (typeof window === 'undefined') {
    return {
      left: clientX,
      top: clientY,
      transform: 'translate(-50%, calc(-100% - 12px))',
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const innerTop = VIEW_EDGE_PAD;
  const innerBottom = vh - VIEW_EDGE_PAD;

  const spaceAbove = clientY - innerTop;
  const spaceBelow = innerBottom - clientY;
  const placeAbove =
    spaceAbove >= TOOLTIP_EST_HEIGHT + TOOLTIP_GAP || (spaceAbove > spaceBelow && spaceAbove >= 96);

  const maxH = (available: number) => Math.min(Math.max(120, available - TOOLTIP_GAP), vh * 0.7);

  if (vw <= NARROW_VIEWPORT_MAX) {
    const cap = placeAbove ? maxH(spaceAbove) : maxH(spaceBelow);
    return {
      left: TOOLTIP_H_GUTTER,
      right: TOOLTIP_H_GUTTER,
      width: 'auto',
      top: clientY,
      transform: placeAbove ? `translateY(calc(-100% - ${TOOLTIP_GAP}px))` : `translateY(${TOOLTIP_GAP}px)`,
      maxHeight: cap,
      boxSizing: 'border-box',
    };
  }

  /** Same width as Tailwind `min(100vw - 24px, 280px)` — center X must use this half-width. */
  const tooltipW = Math.min(vw - 2 * TOOLTIP_H_GUTTER, 280);
  const halfW = tooltipW / 2;
  const left = Math.min(Math.max(clientX, TOOLTIP_H_GUTTER + halfW), vw - TOOLTIP_H_GUTTER - halfW);

  if (placeAbove) {
    return {
      left,
      width: tooltipW,
      top: clientY,
      transform: `translate(-50%, calc(-100% - ${TOOLTIP_GAP}px))`,
      maxHeight: maxH(spaceAbove),
      boxSizing: 'border-box',
    };
  }
  return {
    left,
    width: tooltipW,
    top: clientY,
    transform: `translate(-50%, ${TOOLTIP_GAP}px)`,
    maxHeight: maxH(spaceBelow),
    boxSizing: 'border-box',
  };
}

interface CampusMapPageProps {
  showHeader?: boolean;
}

export function CampusMapPage({ showHeader = true }: CampusMapPageProps) {
  const { play } = useSound();
  const { isAdmin } = useAuth();
  const cellIssues = useMemo(() => buildCellIssueMap(), []);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  /** Viewport coords (clientX/clientY) — tooltip rendered in a portal so fixed positioning is correct. */
  const [hover, setHover] = useState<{
    key: string;
    issues: CampusIssue[];
    x: number;
    y: number;
  } | null>(null);

  const updateHoverPointer = (e: React.MouseEvent, key: string, issues: CampusIssue[]) => {
    setHover({ key, issues, x: e.clientX, y: e.clientY });
  };

  const selectedIssues = selectedKey ? cellIssues.get(selectedKey) ?? [] : [];
  const selectedTier = selectedKey ? heatTier(heatScore(selectedIssues)) : null;

  return (
    <div className="premium-page">
      {showHeader && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="premium-hero">
          <h1 className="text-3xl" style={{ fontWeight: 700 }}>Campus Intelligence Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? 'Tactical grid: hover any zone for bundled facility signals; click to open SITREP, including clear zones for ops confirmation.'
              : 'Hover any cell for a readout. Tap a cell that shows a signal count to open details—quiet cells are view-only. Pins and issues are sample data.'}
          </p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map + tactical grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-2 premium-panel premium-hover-lift p-4 relative overflow-hidden"
          style={{ minHeight: 430 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#5c6b4a]/12 via-transparent to-[#8b7355]/10 dark:from-[#2a3528]/40 dark:to-[#3d2a18]/30 pointer-events-none" />

          {/* Map chrome — stack on narrow viewports so labels never overlap */}
          <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 pointer-events-none">
            <div className="flex min-w-0 items-center gap-2 self-start rounded-md border border-[#6f7a5e]/50 bg-card/90 px-2.5 py-1 backdrop-blur-sm dark:border-[#4a5c46]/80 sm:max-w-[min(100%,65%)]">
              <Crosshair className="h-3.5 w-3.5 shrink-0 text-[#5c6b4a] dark:text-[#8faa7a]" />
              <span className="truncate text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.2em]">
                <span className="sm:hidden">Grid {GRID_COLS}×{GRID_ROWS} · ops</span>
                <span className="hidden sm:inline">Grid {GRID_COLS}×{GRID_ROWS} · campus ops</span>
              </span>
            </div>
            <p className="max-w-full shrink-0 self-start text-[10px] font-mono uppercase leading-snug tracking-wider text-muted-foreground/90 sm:max-w-[min(100%,48%)] sm:self-auto sm:text-right">
              <span className="sm:hidden">Tap cell · preview · detail</span>
              <span className="hidden sm:inline">Hover · preview · click · detail</span>
            </p>
          </div>

          {/* Subtle coordinate grid lines (under cells) */}
          <div
            className="absolute inset-0 opacity-[0.12] dark:opacity-[0.18] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(60,80,50,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(60,80,50,0.5) 1px, transparent 1px)',
              backgroundSize: `${100 / GRID_COLS}% ${100 / GRID_ROWS}%`,
            }}
          />

          {/* Campus paths (no dormitory segment) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M15 70 L25 50 L35 30 L60 25"
              stroke="currentColor"
              className="text-[#6f7a5e]/25 dark:text-[#5a6b4a]/35"
              strokeWidth="0.45"
              fill="none"
              strokeDasharray="1.5,2"
            />
            <path
              d="M25 50 L45 55 L55 45 L60 25"
              stroke="currentColor"
              className="text-[#6f7a5e]/25 dark:text-[#5a6b4a]/35"
              strokeWidth="0.45"
              fill="none"
              strokeDasharray="1.5,2"
            />
            <path
              d="M45 55 L65 52 L80 35"
              stroke="currentColor"
              className="text-[#6f7a5e]/25 dark:text-[#5a6b4a]/35"
              strokeWidth="0.45"
              fill="none"
              strokeDasharray="1.5,2"
            />
            <path
              d="M55 45 L80 35"
              stroke="currentColor"
              className="text-[#6f7a5e]/25 dark:text-[#5a6b4a]/35"
              strokeWidth="0.45"
              fill="none"
              strokeDasharray="1.5,2"
            />
          </svg>

          {/* Tactical heat grid */}
          <div className="absolute inset-3 sm:inset-4 rounded-lg overflow-hidden border-2 border-[#6f7a5e]/40 dark:border-[#3d4a38]/70 shadow-inner ring-1 ring-black/5 dark:ring-white/5">
            <div
              className="relative w-full h-full min-h-[340px]"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
                const row = Math.floor(i / GRID_COLS);
                const col = i % GRID_COLS;
                const key = cellKey(row, col);
                const issues = cellIssues.get(key) ?? [];
                const tier = heatTier(heatScore(issues));
                const style = TACTICAL_TIERS[tier];
                const isSelected = selectedKey === key;
                const canInspectZone = isAdmin || issues.length > 0;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={
                      canInspectZone
                        ? `Zone ${col + 1}-${row + 1}, ${style.label}`
                        : `Zone ${col + 1}-${row + 1}, ${style.label}, no open signals, selection reserved for admin`
                    }
                    className={`
                      relative border border-black/[0.06] dark:border-white/[0.06]
                      transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
                      ${style.className}
                      ${isSelected ? 'ring-2 ring-inset ring-primary z-[5] scale-[1.02]' : ''}
                      ${canInspectZone ? 'hover:brightness-95 dark:hover:brightness-110' : 'cursor-not-allowed'}
                    `}
                    onMouseEnter={e => updateHoverPointer(e, key, issues)}
                    onMouseMove={e => updateHoverPointer(e, key, issues)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => {
                      if (!canInspectZone) return;
                      play('tap');
                      setSelectedKey(isSelected ? null : key);
                    }}
                  >
                    {issues.length > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-sm bg-black/25 dark:bg-white/15 px-0.5 text-[9px] font-mono text-white dark:text-white">
                        {issues.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Building pins (labels only — no dorm) */}
          {BUILDINGS.map(b => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{ left: `${b.x}%`, top: `${b.y}%` }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-lg border border-[#5c4a32]/50 dark:border-[#8b7355]/50 bg-card/95 shadow-sm flex items-center justify-center text-foreground">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-tight bg-card/90 px-1 py-0.5 rounded border border-border/60 max-w-[84px] truncate text-center">
                    {b.name}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Portal: fixed + viewport coords — avoids wrong offset when a motion ancestor uses transform */}
          {typeof document !== 'undefined' &&
            createPortal(
              <AnimatePresence>
                {hover && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="pointer-events-none fixed z-[9999] flex max-w-none flex-col overflow-hidden"
                    style={getTooltipFixedStyle(hover.x, hover.y)}
                  >
                    <div className="min-h-0 overflow-y-auto rounded-xl border-2 border-[#6f7a5e]/60 dark:border-[#4a5c46] bg-card/95 px-3 py-2.5 shadow-xl backdrop-blur-md">
                      {hover.issues.length > 0 ? (
                        <>
                          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                            Zone {hover.key.replace('-', ' · ')} — signals
                          </p>
                          <ul className="max-h-[min(180px,40vh)] space-y-1.5 overflow-y-auto sm:max-h-[180px]">
                            {hover.issues.slice(0, 5).map(iss => (
                              <li key={iss.id} className="text-xs leading-snug border-l-2 border-primary/40 pl-2">
                                <span style={{ fontWeight: 600 }}>{iss.title}</span>
                                <span className="text-muted-foreground"> · {iss.category}</span>
                              </li>
                            ))}
                            {hover.issues.length > 5 && (
                              <li className="text-[10px] text-muted-foreground font-mono pl-2">
                                +{hover.issues.length - 5} more (click zone)
                              </li>
                            )}
                          </ul>
                        </>
                      ) : (
                        <p className="text-xs font-mono text-muted-foreground">
                          <span className="text-[10px] uppercase tracking-widest block mb-1 text-foreground">
                            Zone {hover.key.replace('-', ' · ')}
                          </span>
                          {isAdmin ? (
                            <>No open signals — grid clear. Click to confirm.</>
                          ) : (
                            <>No open signals in this zone. Full zone inspection is available to campus operations only.</>
                          )}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="premium-panel premium-hover-lift p-5">
            <h3 className="text-sm mb-1 font-mono uppercase tracking-wider" style={{ fontWeight: 600 }}>
              Legend · heat tiers
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3">Weighted by severity (low / medium / high).</p>
            <div className="space-y-2">
              {TACTICAL_TIERS.map(t => (
                <div key={t.tier} className="flex items-start gap-2 text-sm">
                  <div className={`mt-0.5 w-8 h-8 shrink-0 rounded-md border-2 ${t.className}`} />
                  <div>
                    <span style={{ fontWeight: 600 }}>{t.label}</span>
                    <span className="text-muted-foreground text-xs block">{t.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedKey && selectedIssues.length > 0 ? (
            <div className="premium-panel premium-hover-lift p-5">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Zone SITREP</p>
                  <p className="text-sm" style={{ fontWeight: 700 }}>
                    Grid {selectedKey.replace('-', ' × ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tier: {selectedTier != null ? TACTICAL_TIERS[selectedTier].label : '—'} · {selectedIssues.length}{' '}
                    signal{selectedIssues.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 shrink-0 rounded-lg border-2 sm:ml-auto ${TACTICAL_TIERS[selectedTier ?? 0].className}`}
                />
              </div>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {selectedIssues.map(iss => (
                  <article key={iss.id} className="rounded-xl border border-border/80 p-3 bg-secondary/30">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm" style={{ fontWeight: 600 }}>
                        {iss.title}
                      </p>
                      <span
                        className={`text-[10px] font-mono uppercase shrink-0 px-1.5 py-0.5 rounded ${
                          iss.severity === 'high'
                            ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                            : iss.severity === 'medium'
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                              : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400'
                        }`}
                      >
                        {iss.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{iss.category}</p>
                    <p className="text-sm leading-relaxed">{iss.summary}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-2">Reported {iss.reportedAt}</p>
                  </article>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 w-full text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-2 rounded-lg border border-dashed border-border"
                onClick={() => {
                  play('tap');
                  setSelectedKey(null);
                }}
              >
                Clear selection
              </button>
            </div>
          ) : selectedKey && selectedIssues.length === 0 ? (
            <div className="premium-panel premium-hover-lift p-5 text-center">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">This zone is clear — no open issues.</p>
              <button
                type="button"
                className="mt-3 text-xs font-mono uppercase text-primary hover:underline"
                onClick={() => {
                  play('tap');
                  setSelectedKey(null);
                }}
              >
                Clear selection
              </button>
            </div>
          ) : (
            <div className="premium-panel premium-hover-lift p-5 text-center">
              <Crosshair className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? 'Click a grid cell to open zone SITREP — including clear zones for ops confirmation.'
                  : 'Tap a cell that shows a signal count to open issue details. Quiet zones stay overview-only.'}
              </p>
            </div>
          )}

          <div className="premium-panel premium-hover-lift overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-mono uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Facilities (by load)
              </h3>
            </div>
            {[...BUILDINGS]
              .sort((a, b) => b.issues.length - a.issues.length)
              .map(b => {
                const { key } = coordsToCell(b.x, b.y);
                const tier = heatTier(heatScore(b.issues));
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      play('tap');
                      setSelectedKey(key);
                    }}
                    className={`flex w-full items-center gap-3 border-b border-border p-3 text-left transition-colors last:border-0 hover:bg-accent/50 ${
                      selectedKey === key ? 'bg-secondary/50' : ''
                    }`}
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-md border-2 ${TACTICAL_TIERS[tier].className}`} />
                    <span className="min-w-0 flex-1 truncate text-sm">{b.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{b.issues.length}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
