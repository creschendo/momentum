import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const data = await authApi.me();
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
      async login(email, password) {
        const data = await authApi.login(email, password);
        setUser(data?.user || null);
        return data?.user || null;
      },
      async register(email, password, displayName) {
        const data = await authApi.register(email, password, displayName);
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
