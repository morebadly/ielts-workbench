"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthState {
  loading: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
}

export function useAuth() {
  const supa = getSupabase();
  const configured = isSupabaseConfigured();

  const [state, setState] = useState<AuthState>(() => ({
    loading: configured,
    configured,
    session: null,
    user: null,
    error: null
  }));

  useEffect(() => {
    if (!supa) return;
    let cancelled = false;
    supa.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState((s) => ({
        ...s,
        loading: false,
        session: data.session,
        user: data.session?.user ?? null
      }));
    });
    const { data: sub } = supa.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        loading: false,
        session,
        user: session?.user ?? null
      }));
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supa]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supa) {
        setState((s) => ({ ...s, error: "Supabase 未配置" }));
        return false;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) {
        setState((s) => ({ ...s, loading: false, error: error.message }));
        return false;
      }
      setState((s) => ({ ...s, loading: false }));
      return true;
    },
    [supa]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supa) {
        setState((s) => ({ ...s, error: "Supabase 未配置" }));
        return false;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      const { error } = await supa.auth.signUp({ email, password });
      if (error) {
        setState((s) => ({ ...s, loading: false, error: error.message }));
        return false;
      }
      setState((s) => ({ ...s, loading: false }));
      return true;
    },
    [supa]
  );

  const signOut = useCallback(async () => {
    if (!supa) return;
    await supa.auth.signOut();
  }, [supa]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return { ...state, signIn, signUp, signOut, clearError };
}
