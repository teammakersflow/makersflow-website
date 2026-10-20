/**
 * Auth integration bridge for MakersFlow Web.
 * Connects legacy auth callers directly to the canonical customAuthService & AuthContext.
 */

import { useAuthContext } from "@/context/AuthContext";
import { customAuthService, AuthUser } from "@/lib/auth/customAuthService";

export { useAuthContext };

/**
 * Returns current user & auth loading status.
 * Backwards compatible hook for existing Web components.
 */
export function useAuth() {
  try {
    const ctx = useAuthContext();
    return {
      user: ctx.user,
      session: ctx.user ? { user: ctx.user } : null,
      loading: ctx.loading,
      isAuthenticated: ctx.isAuthenticated,
    };
  } catch {
    // Fallback if rendered outside of AuthProvider
    const cached = customAuthService.getCachedUser();
    return {
      user: cached,
      session: cached ? { user: cached } : null,
      loading: false,
      isAuthenticated: Boolean(cached),
    };
  }
}

/**
 * Signs in user with Google ID Token via NestJS Backend
 */
export async function signInWithGoogle(idToken: string) {
  return customAuthService.loginWithGoogle(idToken);
}

/**
 * Logs out the current user from the NestJS Backend and clears local storage
 */
export async function signOut(_scope?: string) {
  await customAuthService.logout();
  return { error: null };
}

/**
 * Retrieves the current authenticated user from backend
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await customAuthService.getCurrentUser();
    return res.data ? customAuthService.getCachedUser() : null;
  } catch {
    return null;
  }
}

/**
 * Stubs for password authentication (Backend currently uses Google OAuth)
 */
export async function signInWithPassword(
  email: string,
  password: string,
) {
  try {
    const result = await customAuthService.login(email, password);

    if (!result.success) {
      return {
        data: null,
        error: { message: result.error },
      };
    }

    return {
      data: { user: customAuthService.getCachedUser() },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      },
    };
  }
}

export async function signUpWithPassword(
  _email: string,
  _password: string,
  _metadata?: Record<string, unknown>,
  _redirect?: string,
) {
  return {
    data: null,
    error: { message: "Registration is managed via Google Sign-In. Please use Google." },
  };
}

export async function sendPasswordReset(_email: string, _redirectPath = "/reset-password") {
  return {
    data: null,
    error: { message: "Password reset is not applicable for Google authenticated accounts." },
  };
}

export async function updatePassword(_newPassword: string) {
  return {
    data: null,
    error: { message: "Password management is managed via Google Account security." },
  };
}

export async function resendConfirmationEmail(_email: string) {
  return {
    data: null,
    error: { message: "Email verification is handled automatically by Google." },
  };
}
