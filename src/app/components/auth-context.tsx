import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  /** University from signup (or demo seed); use in shell and dashboards. */
  campusName: string;
  /** Demo student/admin pair can swap views without re-login. */
  canSwitchRole: boolean;
  /** When true, sidebar and dashboards show username instead of first name. */
  anonymousMode: boolean;
  setAnonymousMode: (on: boolean) => void;
  login: (username: string, password: string) => { ok: true } | { ok: false; error: string };
  signup: (params: {
    username: string;
    password: string;
    name: string;
    university_name: string;
  }) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  switchRole: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  campusName: DEFAULT_CAMPUS_LABEL,
  canSwitchRole: false,
  anonymousMode: false,
  setAnonymousMode: () => {},
  login: () => ({ ok: false, error: 'Auth not ready' }),
  signup: () => ({ ok: false, error: 'Auth not ready' }),
  logout: () => {},
  switchRole: () => {},
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(hydrateUserFromSession());
  }, []);

  const campusName = useMemo(() => {
    if (user?.university_name?.trim()) return user.university_name.trim();
    return DEFAULT_CAMPUS_LABEL;
  }, [user]);

  const canSwitchRole = useMemo(() => {
    if (!user) return false;
    const acc = getAccountById(user.id);
    return Boolean(acc?.switch_to_username);
  }, [user]);

  const anonymousMode = user?.anonymous_mode === true;

  const setAnonymousMode = useCallback((on: boolean) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = setAccountAnonymousMode(prev.id, on);
      return updated ?? prev;
    });
  }, []);

  const login = useCallback((username: string, password: string) => {
    const result = loginWithCredentials(username, password);
    if (!result.ok) return result;
    setUser(result.user);
    return { ok: true as const };
  }, []);

  const signup = useCallback(
    (params: { username: string; password: string; name: string; university_name: string }) => {
      const result = registerAccount(params);
      if (!result.ok) return result;
      setUser(result.user);
      return { ok: true as const };
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const switchRole = useCallback(() => {
    if (!user) return;
    const next = switchToPairedAccount(user.id);
    if (next) setUser(next);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        campusName,
        canSwitchRole,
        anonymousMode,
        setAnonymousMode,
        login,
        signup,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
