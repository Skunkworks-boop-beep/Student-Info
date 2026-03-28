/**
 * Person display names: show first name only (first token), so surnames never appear in the UI
 * even when the data source includes a full name string.
 */
export function firstNameOnly(name: string | null | undefined): string {
  if (!name?.trim()) return '';
  return name.trim().split(/\s+/)[0] ?? '';
}
