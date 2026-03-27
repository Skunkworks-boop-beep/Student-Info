/**
 * Person display names: show first name only (first token), so surnames never appear in the UI
 * even if mock/API data includes them.
 */
export function firstNameOnly(name: string | null | undefined): string {
  if (!name?.trim()) return '';
  return name.trim().split(/\s+/)[0] ?? '';
}
