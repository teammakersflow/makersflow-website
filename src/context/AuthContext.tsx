/**
 * MakersFlow Authentication Context & Provider
 * Manages reactive user state, session restoration, Google login, and logout.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  customAuthService,
  AuthUser,
  mapBackendUserToAuthUser,
} from "@/lib/auth/customAuthService";
import { tokenStorage } from "@/lib/auth/tokenStorage";

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => customAuthService.getCachedUser());
  const [loading, setLoading] = useState<boolean>(true);

  const restoreSession = useCallback(async () => {
    if (!customAuthService.hasStoredSession()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await customAuthService.getCurrentUser();
      if (res.data) {
        setUser(mapBackendUserToAuthUser(res.data));
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn("[AuthProvider] Session restoration error:", e);
      // If error occurred and tokens were cleared by apiClient interceptor
      if (!tokenStorage.getRefreshToken()) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    const handleUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };

    const handleLogout = () => {
      setUser(null);
      setLoading(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("makersflow:unauthorized", handleUnauthorized);
      window.addEventListener("makersflow:logout", handleLogout);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("makersflow:unauthorized", handleUnauthorized);
        window.removeEventListener("makersflow:logout", handleLogout);
      }
    };
  }, [restoreSession]);

  const loginWithGoogle = async (
    idToken: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const res = await customAuthService.loginWithGoogle(idToken);
      if (res.data?.user) {
        const mappedUser = mapBackendUserToAuthUser(res.data.user);
        setUser(mappedUser);
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: res.message || "Login failed" };
    } catch (err: unknown) {
      setLoading(false);
      const errorMsg =
        err instanceof Error ? err.message : "Google authentication failed. Please try again.";
      return { success: false, error: errorMsg };
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await customAuthService.logout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const res = await customAuthService.getCurrentUser();
      if (res.data) {
        setUser(mapBackendUserToAuthUser(res.data));
      }
    } catch (e) {
      console.warn("[AuthProvider] Refresh user error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
