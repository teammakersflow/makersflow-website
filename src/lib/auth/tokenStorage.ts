/**
 * MakersFlow Web Token & User Storage
 * Provides isolated, namespaced storage for access tokens, refresh tokens, and cached user profile.
 */

export interface StoredUser {
  id: string;
  email: string;
  name?: string | null;
  full_name?: string | null;
  profileImage?: string | null;
  avatar_url?: string | null;
  role: string;
  grade?: string | null;
  school?: string | null;
  phone?: string | null;
  bio?: string | null;
  university?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const ACCESS_TOKEN_KEY = "mf_access_token";
const REFRESH_TOKEN_KEY = "mf_refresh_token";
const USER_KEY = "mf_user";

// In-memory token cache for fast access & security
let inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    if (typeof window === "undefined") return null;
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) inMemoryAccessToken = token;
      return token;
    } catch {
      return null;
    }
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
    if (typeof window === "undefined") return;
    try {
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    } catch (e) {
      console.warn("[tokenStorage] Failed to write access token:", e);
    }
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string | null): void {
    if (typeof window === "undefined") return;
    try {
      if (token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch (e) {
      console.warn("[tokenStorage] Failed to write refresh token:", e);
    }
  },

  setTokens(tokens: { accessToken: string; refreshToken?: string }): void {
    if (tokens.accessToken) {
      this.setAccessToken(tokens.accessToken);
    }
    if (tokens.refreshToken) {
      this.setRefreshToken(tokens.refreshToken);
    }
  },

  getUser<T = StoredUser>(): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user: StoredUser | null): void {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn("[tokenStorage] Failed to write user cache:", e);
    }
  },

  clear(): void {
    inMemoryAccessToken = null;
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Clean up legacy Supabase keys
      localStorage.removeItem("makersflow.auth");
      sessionStorage.removeItem("makersflow.auth");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.startsWith("supabase-") || key.startsWith("supabase:"))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn("[tokenStorage] Failed to clear storage:", e);
    }
  },
};
