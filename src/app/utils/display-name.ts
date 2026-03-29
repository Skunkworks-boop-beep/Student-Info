import type { User } from '../data/mock-data';

/**
 * Person display names: show first name only (first token), so surnames never appear in the UI
 * even when the data source includes a full name string.
 */
export function firstNameOnly(name: string | null | undefined): string {
  if (!name?.trim()) return '';
  return name.trim().split(/\s+/)[0] ?? '';
}

/** Logged-in user: first name, or username when anonymous mode is on. */
export function userPublicLabel(user: User | null | undefined, anonymousMode: boolean): string {
  if (!user) return '';
  if (anonymousMode && user.username?.trim()) return user.username.trim();
  return firstNameOnly(user.name);
}
