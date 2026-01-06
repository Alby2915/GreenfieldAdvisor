import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '../services/AuthService';
import { login as apiLogin, register as apiRegister, me } from '../services/AuthService';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialToken = localStorage.getItem('auth.token'); 
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!initialToken);

useEffect(() => {

    if (!initialToken) return;

    me(initialToken)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('auth.token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [initialToken]);

  const setAuth = (res: { token: string; user: AuthUser }) => {
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('auth.token', res.token);
  };

  const login = async (req: LoginRequest) => {
    const res = await apiLogin(req);
    setAuth(res);
  };

  const register = async (req: RegisterRequest) => {
    const res = await apiRegister(req);
    setAuth(res);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth.token');
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
