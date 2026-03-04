import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

interface AuthUser {
  id: number | string;
  email?: string;
  displayName?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  register: (email: string, password: string, displayName?: string) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const data = await authApi.me() as { user?: AuthUser | null };
        if (mounted) setUser(data?.user || null);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email: string, password: string) {
        const data = await authApi.login(email, password) as { user?: AuthUser | null };
        setUser(data?.user || null);
        return data?.user || null;
      },
      async register(email: string, password: string, displayName?: string) {
        const data = await authApi.register(email, password, displayName) as { user?: AuthUser | null };
        setUser(data?.user || null);
        return data?.user || null;
      },
      async logout() {
        await authApi.logout();
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
