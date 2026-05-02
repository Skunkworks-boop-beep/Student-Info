/**
 * White-label defaults. Swap values per deployment (SSO, branding, map center).
 */
export const APP_NAME = 'Student.Info';
export const APP_TAGLINE = 'Thoughts, map & admin tools';

/** Shown when no session or account has no university (e.g. legacy data). */
export const DEFAULT_CAMPUS_LABEL = APP_TAGLINE;

/** Seeded demo accounts (`student` / `admin`) use this password; minimum length for all sign-ups. */
export const DEMO_PASSWORD = 'demo123';

/** Quick sign-in usernames (see `auth-accounts` seed). */
export const DEMO_USERNAME_STUDENT = 'student';
export const DEMO_USERNAME_ADMIN = 'admin';

export const USERNAME_PLACEHOLDER = 'your.username';

/** Support inbox shown on Support page (mailto). Set `VITE_SUPPORT_EMAIL` in production. */
export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() ?? '';
