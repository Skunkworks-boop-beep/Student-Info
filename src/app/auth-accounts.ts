import { currentUser, adminUser, type User } from './data/mock-data';
import { DEMO_PASSWORD } from './config/app';

const ACCOUNTS_KEY = 'si_accounts_v1';
const SESSION_KEY = 'si_session_v1';

/** Stored credential record (local demo only — not for production secrets). */
export type AccountRecord = {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  university_name: string;
  uni_xp: number;
  badges: string[];
  created_at: string;
  streak: number;
  avatar?: string;
  /** Demo accounts only: switch-role toggles to this username without re-entering password. */
  switch_to_username?: string | null;
  /** Show username in UI instead of first name. */
  anonymous_mode: boolean;
};

function seedAccounts(): AccountRecord[] {
  return [
    {
      ...currentUser,
      username: 'student',
      password: DEMO_PASSWORD,
      university_name: 'Sample University',
      switch_to_username: 'admin',
      anonymous_mode: false,
    },
    {
      ...adminUser,
      username: 'admin',
      password: DEMO_PASSWORD,
      university_name: 'Sample University',
      switch_to_username: 'student',
      anonymous_mode: false,
    },
  ];
}

function readAccounts(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      const seed = seedAccounts();
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = seedAccounts();
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seed));
      return seed;
    }
    return (parsed as AccountRecord[]).map(normalizeAccount);
  } catch {
    const seed = seedAccounts();
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seed));
    } catch {
      /* ignore */
    }
    return seed;
  }
}

function writeAccounts(accounts: AccountRecord[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/** Merge defaults for records stored before new fields existed. */
function normalizeAccount(a: AccountRecord): AccountRecord {
  return {
    ...a,
    anonymous_mode: a.anonymous_mode === true,
  };
}

export function accountToUser(a: AccountRecord): User {
  const u: User = {
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    uni_xp: a.uni_xp,
    badges: a.badges,
    created_at: a.created_at,
    streak: a.streak,
    username: a.username,
    university_name: a.university_name,
  };
  if (a.avatar) u.avatar = a.avatar;
  u.anonymous_mode = a.anonymous_mode === true;
  return u;
}

export function getSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setSessionUserId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getAccountById(id: string): AccountRecord | undefined {
  return readAccounts().find(a => a.id === id);
}

export function getAccountByUsername(username: string): AccountRecord | undefined {
  const u = username.trim().toLowerCase();
  return readAccounts().find(a => a.username.toLowerCase() === u);
}

export function loginWithCredentials(username: string, password: string): { ok: true; user: User } | { ok: false; error: string } {
  const acc = getAccountByUsername(username);
  if (!acc) return { ok: false, error: 'No account found for that username.' };
  if (acc.password !== password) return { ok: false, error: 'Incorrect password.' };
  setSessionUserId(acc.id);
  return { ok: true, user: accountToUser(acc) };
}

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;

export function registerAccount(params: {
  username: string;
  password: string;
  name: string;
  university_name: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  const username = params.username.trim();
  const name = params.name.trim();
  const university_name = params.university_name.trim();
  const password = params.password;

  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: 'Username must be 3–32 characters (letters, numbers, . _ - only).',
    };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  if (name.length < 1 || name.length > 80) {
    return { ok: false, error: 'Please enter your name (1–80 characters).' };
  }
  if (university_name.length < 2 || university_name.length > 120) {
    return { ok: false, error: 'University name should be 2–120 characters.' };
  }
  const reserved = ['student', 'admin'];
  if (reserved.includes(username.toLowerCase())) {
    return { ok: false, error: 'That username is reserved. Choose another.' };
  }
  if (getAccountByUsername(username)) {
    return { ok: false, error: 'That username is already taken.' };
  }

  const id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  const email = `${username.toLowerCase()}@student.info`;
  const today = new Date().toISOString().slice(0, 10);
  const record: AccountRecord = {
    id,
    username: username.toLowerCase(),
    password,
    name,
    email,
    role: 'student',
    university_name,
    uni_xp: 0,
    badges: [],
    created_at: today,
    streak: 0,
    switch_to_username: null,
    anonymous_mode: false,
  };

  const accounts = readAccounts();
  accounts.push(record);
  writeAccounts(accounts);
  setSessionUserId(id);
  return { ok: true, user: accountToUser(record) };
}

export function switchToPairedAccount(currentId: string): User | null {
  const acc = getAccountById(currentId);
  const targetName = acc?.switch_to_username;
  if (!targetName) return null;
  const next = getAccountByUsername(targetName);
  if (!next) return null;
  setSessionUserId(next.id);
  return accountToUser(next);
}

export function setAccountAnonymousMode(userId: string, anonymous_mode: boolean): User | null {
  const accounts = readAccounts();
  const i = accounts.findIndex(a => a.id === userId);
  if (i < 0) return null;
  const next = normalizeAccount({ ...accounts[i], anonymous_mode });
  accounts[i] = next;
  writeAccounts(accounts);
  return accountToUser(next);
}
