/**
 * MakersFlow Custom Auth Service
 * Interfaces with the NestJS Backend Auth Endpoints:
 * - POST /auth/google
 * - POST /auth/refresh
 * - GET  /auth/me
 * - POST /auth/logout
 */

import { apiClient, ApiResponse } from "./apiClient";
import { tokenStorage, StoredUser } from "./tokenStorage";

export interface BackendUser {
  id: string;
  email: string;
  name?: string;
  full_name?: string | null;
  profileImage?: string;
  avatar_url?: string | null;
  role: string;
  grade?: string | null;
  school?: string | null;
  phone?: string | null;
  bio?: string | null;
  university?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  notifications_enabled?: boolean;
  onboarding_completed?: boolean;
  is_banned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface GoogleLoginResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user: BackendUser;
}

export interface RefreshTokenResponseData {
  accessToken: string;
  expiresIn?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  grade?: string | null;
  school?: string | null;
  // Backward compatibility shims for existing UI:
  user_metadata: {
    full_name: string | null;
    name: string | null;
    avatar_url: string | null;
    phone: string | null;
    bio?: string | null;
    university?: string | null;
    major?: string | null;
    graduation_year?: string | null;
    [key: string]: unknown;
  };
  app_metadata: {
    provider: string;
    [key: string]: unknown;
  };
  identities: Array<{ provider: string }>;
  [key: string]: unknown;
}

export function mapBackendUserToAuthUser(raw: BackendUser | StoredUser): AuthUser {
  const displayName =
    (raw.full_name as string | undefined) ||
    (raw.name as string | undefined) ||
    (raw.email ? raw.email.split("@")[0] : "Maker");
  const avatar =
    (raw.avatar_url as string | undefined) || (raw.profileImage as string | undefined) || null;

  return {
    id: raw.id,
    email: raw.email || "",
    full_name: displayName,
    avatar_url: avatar,
    role: raw.role || "student",
    grade: (raw.grade as string | null) ?? null,
    school: (raw.school as string | null) ?? null,
    user_metadata: {
      full_name: displayName,
      name: displayName,
      avatar_url: avatar,
      phone: (raw.phone as string | null) ?? null,
      bio: (raw.bio as string | null) ?? null,
      university: (raw.university as string | null) ?? null,
      major: (raw.major as string | null) ?? null,
      graduation_year: (raw.graduation_year as string | null) ?? null,
    },
    app_metadata: {
      provider: "google",
    },
    identities: [{ provider: "google" }],
  };
}

export const customAuthService = {
  /**
   * Authenticate user with Google idToken (POST /auth/google)
   */
  async loginWithGoogle(idToken: string): Promise<ApiResponse<GoogleLoginResponseData>> {
    const res = await apiClient.post<GoogleLoginResponseData>(
      "/auth/google",
      { idToken },
      { skipAuth: true },
    );

    if (res.data) {
      tokenStorage.setTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      tokenStorage.setUser(res.data.user);
    }

    return res;
  },

  /**
   * Refresh current access token using stored refresh token (POST /auth/refresh)
   */
  async refreshAccessToken(): Promise<ApiResponse<RefreshTokenResponseData>> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const res = await apiClient.post<RefreshTokenResponseData>(
      "/auth/refresh",
      { refreshToken },
      { skipAuth: true },
    );

    if (res.data?.accessToken) {
      tokenStorage.setAccessToken(res.data.accessToken);
    }

    return res;
  },

  /**
   * Fetch current authenticated user (GET /auth/me)
   */
  async getCurrentUser(): Promise<ApiResponse<BackendUser>> {
    const res = await apiClient.get<BackendUser>("/auth/me");
    if (res.data) {
      tokenStorage.setUser(res.data);
    }
    return res;
  },

  /**
   * Log out user from backend and clear local tokens (POST /auth/logout)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      console.warn("[customAuthService] Backend logout notice:", e);
    } finally {
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("makersflow:logout"));
      }
    }
  },

  /**
   * Check if a stored session exists
   */
  hasStoredSession(): boolean {
    return Boolean(tokenStorage.getRefreshToken() || tokenStorage.getAccessToken());
  },

  /**
   * Get cached user synchronously if available
   */
  getCachedUser(): AuthUser | null {
    const user = tokenStorage.getUser();
    return user ? mapBackendUserToAuthUser(user) : null;
  },
};
