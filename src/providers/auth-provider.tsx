"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UNAUTHORIZED_EVENT, tokenStorage } from "@/lib/api";
import * as authService from "@/services/auth";
import type { AuthResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean; // true selama pengecekan sesi awal
  signIn: (res: AuthResponse) => void; // dipanggil setelah login/register sukses
  updateUser: (user: User) => void; // dipanggil setelah edit profil sukses
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cek sesi saat aplikasi dibuka atau di-refresh
  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null)) // 401: token sudah dibersihkan oleh api.ts
      .finally(() => setLoading(false));
  }, []);

  // Token ditolak di request mana pun -> anggap sudah logout
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const signIn = useCallback((res: AuthResponse) => {
    tokenStorage.set(res.token);
    setUser(res.user);
  }, []);

  const updateUser = useCallback((next: User) => setUser(next), []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    // Reload penuh ke /login: state bersih, dan guard tidak sempat
    // menampilkan peringatan "silakan login" setelah logout yang disengaja.
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, updateUser, logout }),
    [user, loading, signIn, updateUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used in AuthProvider");
  return ctx;
}