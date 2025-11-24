import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAccountStore } from "@/stores/useAccountStore";

/**
 * Custom hook to automatically fetch and sync user data with the account store
 * Triggers when user logs in or session is restored
 */
export function useUserData() {
  const { data: session, status } = useSession();
  const { setUser } = useAccountStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchUserData = async () => {
      // Prevent multiple fetches
      if (hasFetched.current) return;

      try {
        hasFetched.current = true;
        const { getUserData } = await import("@/lib/api-services");
        const userData = await getUserData();
        setUser(userData);
      } catch (error) {
        hasFetched.current = false;
        console.error("Error fetching user data:", error);
        // Don't reset user data on error, it might be a temporary network issue
      }
    };

    // Fetch user data when authenticated
    if (status === "authenticated" && session?.user) {
      fetchUserData();
    } else if (status === "unauthenticated") {
      hasFetched.current = false;
    }
  }, [status, session?.user?.email, setUser]);

  return {
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
