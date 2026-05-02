import type { Complaint } from '../data/mock-data';

export const LIVE_GRID_COLS = 12;
export const LIVE_GRID_ROWS = 9;

export type LiveCampusIssue = {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  summary: string;
  reportedAt: string;
};

export function liveCellKey(row: number, col: number) {
  return `${row}-${col}`;
}

function stableHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

/** Stable grid cell from complaint id + location + title so live heat stays consistent. */
export function complaintLocationCell(complaint: Complaint): string {
  const basis = `${complaint.id}|${complaint.location || ''}|${complaint.title}`;
  const h = stableHash(basis);
  const row = h % LIVE_GRID_ROWS;
  const col = Math.floor(h / LIVE_GRID_ROWS) % LIVE_GRID_COLS;
  return liveCellKey(row, col);
}

export function complaintToLiveIssue(c: Complaint): LiveCampusIssue {
  const severity: LiveCampusIssue['severity'] =
    c.priority === 'High' ? 'high' : c.priority === 'Medium' ? 'medium' : 'low';
  const summary =
    c.description.length > 200 ? `${c.description.slice(0, 200)}…` : c.description;
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    severity,
    summary,
    reportedAt: c.created_at.slice(0, 10),
  };
}

/** Open (non-resolved) complaints aggregated by hash-derived grid cell — no sample data. */
export function buildLiveOpenComplaintCells(openComplaints: Complaint[]): Map<string, LiveCampusIssue[]> {
  const map = new Map<string, LiveCampusIssue[]>();
  for (const c of openComplaints) {
    if (c.status === 'Resolved') continue;
    const key = complaintLocationCell(c);
    const list = map.get(key) ?? [];
    list.push(complaintToLiveIssue(c));
    map.set(key, list);
  }
  return map;
}
