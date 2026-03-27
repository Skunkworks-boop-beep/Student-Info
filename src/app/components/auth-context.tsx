import { createContext, useContext, useState, type ReactNode } from 'react';
import { currentUser, adminUser, type User } from '../data/mock-data';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  login: () => false,
  logout: () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string) => {
    if (email.includes('admin')) {
      setUser(adminUser);
    } else {
      setUser(currentUser);
    }
    return true;
  };

  const logout = () => setUser(null);

  const switchRole = () => {
    if (user?.role === 'student') setUser(adminUser);
    else setUser(currentUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
