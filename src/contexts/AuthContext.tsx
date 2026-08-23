"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getToken, setToken, removeToken } from "@/lib/auth";
import * as api from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const token = getToken();
    if (!token) {
      // Nothing to verify — finish asynchronously so we never call
      // setState synchronously inside the effect body.
      const id = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(id);
    }

    api
      .getMe()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) removeToken();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string) => {
    const data = await api.login(username);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext value={{ user, loading, login, logout }}>
      {children}
    </AuthContext>
  );
}
