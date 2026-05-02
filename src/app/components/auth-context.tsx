import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import type { User } from '../data/mock-data';
import { DEFAULT_CAMPUS_LABEL } from '../config/app';
import {
  accountToUser,
  clearSession,
  getAccountById,
  getSessionUserId,
  loginWithCredentials,
  registerAccount,
  setAccountAnonymousMode,
  switchToPairedAccount,
} from '../auth-accounts';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { fetchProfileForSession, updateProfileAnonymousModeApi } from '../api/supabase-api';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  campusName: string;
  canSwitchRole: boolean;
  anonymousMode: boolean;
  setAnonymousMode: (on: boolean) => void | Promise<void>;
  backendMode: 'supabase' | 'local';
  login: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signup: (params: {
    email?: string;
    username: string;
    password: string;
    name: string;
    university_name: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  switchRole: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  campusName: DEFAULT_CAMPUS_LABEL,
  canSwitchRole: false,
  anonymousMode: false,
  setAnonymousMode: async () => {},
  backendMode: 'local',
  login: async () => ({ ok: false, error: 'Auth not ready' }),
  signup: async () => ({ ok: false, error: 'Auth not ready' }),
  logout: async () => {},
  switchRole: () => {},
  refreshProfile: async () => {},
});

function hydrateUserFromSession(): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  const acc = getAccountById(id);
  if (!acc) {
    clearSession();
    return null;
  }
  return accountToUser(acc);
}

async function loadSupabaseUserWithRetry(
  userId: string,
  email: string,
  attempts = 4
): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  for (let i = 0; i < attempts; i++) {
    const u = await fetchProfileForSession(supabase, userId, email);
    if (u) return u;
    await new Promise(r => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const backendMode = isSupabaseConfigured() ? 'supabase' : 'local';
  const [user, setUser] = useState<User | null>(null);

  const refreshProfile = useCallback(async () => {
    if (backendMode !== 'supabase') return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;
    const u = await fetchProfileForSession(
      supabase,
      session.user.id,
      session.user.email ?? `${session.user.user_metadata?.username ?? ''}@users.local`
    );
    if (u) setUser(u);
  }, [backendMode]);

  useEffect(() => {
    if (backendMode === 'local') {
      setUser(hydrateUserFromSession());
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setUser(null);
      return;
    }

    let cancelled = false;

    const applySession = async (session: Session | null) => {
      if (cancelled) return;
      if (!session?.user) {
        setUser(null);
        return;
      }
      const u = await loadSupabaseUserWithRetry(
        session.user.id,
        session.user.email ?? ''
      );
      if (!cancelled) setUser(u);
    };

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [backendMode]);

  const campusName = useMemo(() => {
    if (user?.university_name?.trim()) return user.university_name.trim();
    return DEFAULT_CAMPUS_LABEL;
  }, [user]);

  const canSwitchRole = useMemo(() => {
    if (backendMode === 'supabase') return false;
    if (!user) return false;
    const acc = getAccountById(user.id);
    return Boolean(acc?.switch_to_username);
  }, [user, backendMode]);

  const anonymousMode = user?.anonymous_mode === true;

  const setAnonymousMode = useCallback(
    async (on: boolean) => {
      if (backendMode === 'supabase') {
        const supabase = getSupabaseClient();
        if (!supabase || !user) return;
        await updateProfileAnonymousModeApi(supabase, user.id, on);
        await refreshProfile();
        return;
      }
      setUser(prev => {
        if (!prev) return prev;
        const updated = setAccountAnonymousMode(prev.id, on);
        return updated ?? prev;
      });
    },
    [backendMode, user, refreshProfile]
  );

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      if (backendMode === 'local') {
        const result = loginWithCredentials(usernameOrEmail, password);
        if (!result.ok) return result;
        setUser(result.user);
        return { ok: true as const };
      }

      const supabase = getSupabaseClient();
      if (!supabase) return { ok: false as const, error: 'Supabase is not configured.' };

      const email = usernameOrEmail.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false as const, error: error.message };

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return { ok: false as const, error: 'No session after sign-in.' };

      const u = await loadSupabaseUserWithRetry(session.user.id, session.user.email ?? email);
      if (!u) return { ok: false as const, error: 'Profile not ready yet. Try again in a moment.' };
      setUser(u);
      return { ok: true as const };
    },
    [backendMode]
  );

  const signup = useCallback(
    async (params: {
      email?: string;
      username: string;
      password: string;
      name: string;
      university_name: string;
    }) => {
      if (backendMode === 'local') {
        const result = registerAccount({
          username: params.username,
          password: params.password,
          name: params.name,
          university_name: params.university_name,
        });
        if (!result.ok) return result;
        setUser(result.user);
        return { ok: true as const };
      }

      const supabase = getSupabaseClient();
      if (!supabase) return { ok: false as const, error: 'Supabase is not configured.' };

      const email = (params.email ?? '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return { ok: false as const, error: 'Enter a valid email address.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: params.password,
        options: {
          data: {
            username: params.username.trim().toLowerCase(),
            display_name: params.name.trim(),
            university_name: params.university_name.trim(),
          },
        },
      });

      if (error) return { ok: false as const, error: error.message };

      if (data.session?.user) {
        const u = await loadSupabaseUserWithRetry(data.session.user.id, data.session.user.email ?? email);
        if (u) setUser(u);
      }

      if (!data.session && data.user) {
        return {
          ok: false as const,
          error:
            'Check your email to confirm your account before signing in (or disable email confirmation in the Supabase Auth settings for staging).',
        };
      }

      return { ok: true as const };
    },
    [backendMode]
  );

  const logout = useCallback(async () => {
    if (backendMode === 'local') {
      clearSession();
      setUser(null);
      return;
    }
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, [backendMode]);

  const switchRole = useCallback(() => {
    if (!user || backendMode === 'supabase') return;
    const next = switchToPairedAccount(user.id);
    if (next) setUser(next);
  }, [user, backendMode]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        campusName,
        canSwitchRole,
        anonymousMode,
        setAnonymousMode,
        backendMode,
        login,
        signup,
        logout,
        switchRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
