"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { clearAllClientStores, useAuthStore } from "@/stores/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setIsLoading = useAuthStore((s) => s.setIsLoading);
  const queryClient = useQueryClient();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? null;

      if (event === "SIGNED_OUT") {
        clearAllClientStores();
        queryClient.clear();
        lastUserIdRef.current = null;
      } else if (
        event === "SIGNED_IN" &&
        lastUserIdRef.current &&
        userId &&
        lastUserIdRef.current !== userId
      ) {
        clearAllClientStores();
        queryClient.clear();
      }

      lastUserIdRef.current = userId;
      setIsAuthenticated(!!session);

      if (event === "INITIAL_SESSION") {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setIsAuthenticated, setIsLoading, queryClient]);

  return <>{children}</>;
}
