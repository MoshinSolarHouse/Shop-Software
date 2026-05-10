'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  shopIds: string[];
  permissions: Record<string, string[]>;
}

interface AuthContextType {
  user: any | null;
  token: string | null;
  payload: JWTPayload | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessShop: (shopId: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  payload: null,
  loading: true,
  login: async () => ({ error: null }),
  logout: () => {},
  hasPermission: () => false,
  canAccessShop: () => false,
  refreshPermissions: async () => {},
});

const SYNC_INTERVAL = 15000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string |null>(null);
  const [payload, setPayload] = useState<JWTPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshPermissions = useCallback(async () => {
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!currentToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const serverUser = data.data;
        const serverPerms = serverUser.permissions || {};
        const currentPerms = payload?.permissions || {};

        const permsChanged = JSON.stringify(serverPerms) !== JSON.stringify(currentPerms);
        const roleChanged = serverUser.role !== payload?.role;
        const shopsChanged = JSON.stringify((serverUser.shopIds || []).sort()) !== JSON.stringify((payload?.shopIds || []).sort());

        if (permsChanged || roleChanged || shopsChanged) {
          const newPayload: JWTPayload = {
            userId: serverUser._id,
            email: serverUser.email,
            role: serverUser.role,
            shopIds: serverUser.shopIds || [],
            permissions: serverPerms,
          };
          setPayload(newPayload);
          setUser(serverUser);
          localStorage.setItem('user', JSON.stringify(serverUser));
        }
      }
    } catch {}
  }, [payload]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      try {
        const parts = savedToken.split('.');
        const p = JSON.parse(atob(parts[1]));
        setPayload(p);
      } catch {}
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      refreshPermissions();
      intervalRef.current = setInterval(refreshPermissions, SYNC_INTERVAL);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) return { error: data.message || 'Login failed' };
      setToken(data.data.token);
      setUser(data.data.user);
      try {
        const parts = data.data.token.split('.');
        const p = JSON.parse(atob(parts[1]));
        setPayload(p);
      } catch {}
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPayload(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const hasPermission = useCallback((resource: string, action: string) => {
    if (!payload) return false;
    if (payload.role === 'super-admin') return true;
    const perms = payload.permissions;
    if (!perms || !perms[resource]) return false;
    return perms[resource].includes(action);
  }, [payload]);

  const canAccessShop = useCallback((shopId: string) => {
    if (!payload) return false;
    if (payload.role === 'super-admin') return true;
    return payload.shopIds.includes(shopId);
  }, [payload]);

  return (
    <AuthContext.Provider value={{ user, token, payload, loading, login, logout, hasPermission, canAccessShop, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
