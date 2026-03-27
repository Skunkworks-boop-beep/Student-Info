/** Authenticated app shell — landing and login live outside this prefix. */
export const APP_BASE = '/app';

export const paths = {
  landing: '/',
  login: '/login',
  app: APP_BASE,
  complaints: `${APP_BASE}/complaints`,
  complaint: (id: string) => `${APP_BASE}/complaints/${id}`,
  submit: `${APP_BASE}/submit`,
  leaderboard: `${APP_BASE}/leaderboard`,
  map: `${APP_BASE}/map`,
  support: `${APP_BASE}/support`,
  assistant: `${APP_BASE}/assistant`,
  admin: `${APP_BASE}/admin`,
  adminComplaints: `${APP_BASE}/admin/complaints`,
  adminUsers: `${APP_BASE}/admin/users`,
  adminHeatmap: `${APP_BASE}/admin/heatmap`,
  adminRules: `${APP_BASE}/admin/rules`,
} as const;
