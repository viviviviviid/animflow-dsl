"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthContextValue {
  readonly configured: boolean;
  readonly loading: boolean;
  readonly user: User | null;
  readonly error?: string;
  readonly signInWithGoogle: () => Promise<void>;
  readonly signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    void client.auth.getUser().then(({ data, error: authError }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setError(authError && authError.name !== "AuthSessionMissingError" ? authError.message : undefined);
      setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
      setError(undefined);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const signInWithGoogle = useCallback(async () => {
    if (!client) throw new Error("Cloud login is not configured for this deployment.");
    setError(undefined);
    const next = `${window.location.pathname}${window.location.search}`;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: signInError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) return;
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    }
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(client),
    error,
    loading,
    signInWithGoogle,
    signOut,
    user,
  }), [client, error, loading, signInWithGoogle, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
