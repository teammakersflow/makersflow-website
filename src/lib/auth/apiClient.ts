/**
 * MakersFlow Canonical API Client
 *
 * Implements fetch with:
 * - Base URL configuration from VITE_API_URL
 * - Authorization Bearer header injection
 * - Concurrency-safe 401 interceptor with refresh token queuing
 * - Automatic single retry of original request
 * - Infinite loop prevention
 */

import { tokenStorage } from "./tokenStorage";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
};

// Queue for pending requests while a token refresh is in flight
let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers = [];
}

function onTokenRefreshFailed(error: Error) {
  refreshSubscribers.forEach((sub) => sub.reject(error));
  refreshSubscribers = [];
}

/**
 * Executes a token refresh request against POST /auth/refresh
 */
async function performTokenRefresh(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError("No refresh token available", 401);
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.error || "Token refresh failed";
    tokenStorage.clear();
    throw new ApiError(message, response.status, errorData);
  }

  const result = (await response.json()) as ApiResponse<{ accessToken: string }>;
  const newAccessToken = result.data?.accessToken;

  if (!newAccessToken) {
    tokenStorage.clear();
    throw new ApiError("Malformed refresh response: missing accessToken", 500);
  }

  // Update access token, KEEP existing refresh token
  tokenStorage.setAccessToken(newAccessToken);
  return newAccessToken;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  _isRetry?: boolean;
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new ApiError(networkError instanceof Error ? networkError.message : "Network error", 0);
  }

  // Handle 401 Unauthorized for authenticated endpoints
  if (
    response.status === 401 &&
    !options.skipAuth &&
    !options._isRetry &&
    !cleanEndpoint.startsWith("/auth/login") &&
    !cleanEndpoint.startsWith("/auth/google") &&
    !cleanEndpoint.startsWith("/auth/refresh")
  ) {
    if (isRefreshing) {
      // Refresh in progress, queue this request
      return new Promise<ApiResponse<T>>((resolve, reject) => {
        refreshSubscribers.push({
          resolve: async (newAccessToken: string) => {
            try {
              const retryHeaders = new Headers(options.headers || {});
              retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
              if (!retryHeaders.has("Content-Type") && !(options.body instanceof FormData)) {
                retryHeaders.set("Content-Type", "application/json");
              }
              const retryRes = await request<T>(cleanEndpoint, {
                ...options,
                headers: retryHeaders,
                _isRetry: true,
              });
              resolve(retryRes);
            } catch (err) {
              reject(err instanceof Error ? err : new Error(String(err)));
            }
          },
          reject: (err: Error) => reject(err),
        });
      });
    }

    isRefreshing = true;

    try {
      const newAccessToken = await performTokenRefresh();
      onTokenRefreshed(newAccessToken);

      // Retry the failed request once with the new access token
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      if (!retryHeaders.has("Content-Type") && !(options.body instanceof FormData)) {
        retryHeaders.set("Content-Type", "application/json");
      }

      return await request<T>(cleanEndpoint, {
        ...options,
        headers: retryHeaders,
        _isRetry: true,
      });
    } catch (refreshErr) {
      const err = refreshErr instanceof Error ? refreshErr : new Error(String(refreshErr));
      onTokenRefreshFailed(err);
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("makersflow:unauthorized"));
      }
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      (typeof data === "object" && data !== null && (data.message || data.error)) ||
      `HTTP Error ${response.status}: ${response.statusText}`;
    throw new ApiError(
      Array.isArray(errorMsg) ? errorMsg.join(", ") : String(errorMsg),
      response.status,
      data,
    );
  }

  return data as ApiResponse<T>;
}

export const apiClient = {
  get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },
};
