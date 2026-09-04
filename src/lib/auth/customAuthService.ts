/**
 * MakersFlow Custom Auth Service
 * Interfaces with the NestJS Backend Auth & User Endpoints:
 * - POST  /auth/google
 * - POST  /auth/refresh
 * - GET   /auth/me
 * - POST  /auth/logout
 * - GET   /users/:id
 * - PATCH /users/profile
 */

import { apiClient, ApiResponse, ApiError } from "./apiClient";
import { tokenStorage, StoredUser } from "./tokenStorage";

export interface BackendUser {
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

export interface UpdateProfileInput {
  full_name?: string;
  grade?: string;
  school?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  university?: string;
  major?: string;
  graduation_year?: string;
  [key: string]: unknown;
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
      if (res.data.user) {
        tokenStorage.setUser(res.data.user);
      }
    }

    return res;
  },

  /**
   * Refresh current access token using stored refresh token (POST /auth/refresh)
   */
  async refreshAccessToken(): Promise<ApiResponse<RefreshTokenResponseData>> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError("No refresh token available", 401);
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
   * Session refresh alias
   */
  async refreshSession(): Promise<ApiResponse<RefreshTokenResponseData>> {
    return this.refreshAccessToken();
  },

  /**
   * Fetch current authenticated user:
   * 1. Calls GET /auth/me for JWT identity verification
   * 2. If profile fields are missing, calls GET /users/:id to hydrate full profile
   * 3. Merges and caches the normalized user
   */
  async getCurrentUser(): Promise<ApiResponse<BackendUser>> {
    const meRes = await apiClient.get<BackendUser>("/auth/me");
    if (!meRes.data || !meRes.data.id) {
      throw new ApiError("Failed to fetch authenticated identity", 401);
    }

    let fullUser: BackendUser = { ...meRes.data };

    // Fetch full profile from GET /users/:id if /auth/me gave minimal payload
    try {
      const userProfileRes = await apiClient.get<BackendUser>(`/users/${fullUser.id}`);
      if (userProfileRes.data) {
        fullUser = { ...fullUser, ...userProfileRes.data };
      }
    } catch {
      // If /users/:id is unavailable or restricted, fallback to cached user fields
      const cached = tokenStorage.getUser();
      if (cached && cached.id === fullUser.id) {
        fullUser = {
          ...cached,
          ...fullUser,
          name: fullUser.name ?? cached.name ?? null,
          full_name: fullUser.full_name ?? cached.full_name ?? null,
          avatar_url: fullUser.avatar_url ?? cached.avatar_url ?? null,
        };
      }
    }

    // Preserve any existing local user metadata if not returned by backend
    const existing = tokenStorage.getUser();
    if (existing && existing.id === fullUser.id) {
      fullUser = {
        ...existing,
        ...fullUser,
        name: fullUser.name ?? existing.name ?? null,
        full_name: fullUser.full_name ?? existing.full_name ?? null,
        avatar_url: fullUser.avatar_url ?? existing.avatar_url ?? null,
        phone: fullUser.phone ?? existing.phone ?? null,
        bio: fullUser.bio ?? existing.bio ?? null,
        university: fullUser.university ?? existing.university ?? null,
        major: fullUser.major ?? existing.major ?? null,
        graduation_year: fullUser.graduation_year ?? existing.graduation_year ?? null,
      };
    }

    tokenStorage.setUser(fullUser);
    return { ...meRes, data: fullUser };
  },

  /**
   * Update current user profile (PATCH /users/profile)
   */
  async updateProfile(dto: UpdateProfileInput): Promise<ApiResponse<BackendUser>> {
    // Only send backend supported fields to PATCH /users/profile:
    // full_name, grade, school, avatar_url
    const backendPayload: Record<string, unknown> = {};
    if (dto.full_name !== undefined) backendPayload.full_name = dto.full_name;
    if (dto.grade !== undefined) backendPayload.grade = dto.grade;
    if (dto.school !== undefined) backendPayload.school = dto.school;
    else if (dto.university !== undefined) backendPayload.school = dto.university;
    if (dto.grade !== undefined) backendPayload.grade = dto.grade;
    else if (dto.graduation_year !== undefined) backendPayload.grade = dto.graduation_year;
    if (dto.avatar_url !== undefined) backendPayload.avatar_url = dto.avatar_url;

    const res = await apiClient.patch<BackendUser>("/users/profile", backendPayload);

    // Merge with cached user
    const current = tokenStorage.getUser() || ({} as StoredUser);
    const updatedUser: StoredUser = {
      ...current,
      ...(res.data || {}),
      ...dto,
    };
    tokenStorage.setUser(updatedUser);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("makersflow:profile_updated", {
          detail: updatedUser,
        }),
      );
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
   * Controlled handler for legacy password login
   */
  async login(_email?: string, _password?: string): Promise<{ success: boolean; error: string }> {
    return {
      success: false,
      error: "Password authentication is not supported. Please sign in with Google.",
    };
  },

  /**
   * Controlled handler for legacy password signup
   */
  async signUp(_data?: unknown): Promise<{ success: boolean; error: string }> {
    return {
      success: false,
      error: "Account registration is managed via Google Sign-In. Please sign up with Google.",
    };
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
