"use client";

import { useState, useEffect } from "react";

export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false); // ✅ new

  useEffect(() => {
    const saved = localStorage.getItem("isSignedIn");
    setIsSignedIn(saved === "true");
    setLoaded(true); // mark as initialized
  }, []);

  const signIn = () => {
    localStorage.setItem("isSignedIn", "true");
    setIsSignedIn(true);
  };

  const signOut = () => {
    localStorage.removeItem("isSignedIn");
    setIsSignedIn(false);
  };

  return { isSignedIn, signIn, signOut, loaded };
}
