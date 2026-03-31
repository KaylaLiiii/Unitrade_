import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkAppState = async () => {
    setIsLoadingAuth(true);
    setIsLoadingPublicSettings(true);
    setAuthError(null);

    try {
      const auth = await base44.auth.isAuthenticated();
      if (!auth) {
        setUser(null);
        setIsAuthenticated(false);
        return { isAuthenticated: false, user: null };
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      return { isAuthenticated: true, user: currentUser };
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setUser(null);
        setIsAuthenticated(false);
        return { isAuthenticated: false, user: null };
      }

      setAuthError({
        type: "unknown",
        message: error?.message || "Failed to load session",
      });
      setUser(null);
      setIsAuthenticated(false);
      return { isAuthenticated: false, user: null };
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  useEffect(() => {
    checkAppState();
  }, []);

  const refreshUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setUser(null);
        setIsAuthenticated(false);
      }
      throw error;
    }
  };

  const navigateToLogin = (returnTo) => base44.auth.redirectToLogin(returnTo || window.location.href);

  const logout = (returnTo) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    base44.auth.logout(returnTo);
  };

  const requireAuth = async (redirect = true) => {
    if (!isLoadingAuth && !isAuthenticated && redirect) {
      navigateToLogin();
    }
    return isAuthenticated;
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    logout,
    navigateToLogin,
    requireAuth,
    refreshUser,
    checkAppState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
