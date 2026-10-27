import React, { useEffect, useRef } from "react";
import { useGoogleOAuth } from "@react-oauth/google";

export interface GoogleButtonProps {
  onSuccess?: (idToken: string) => void;
  onError?: (error?: string) => void;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}

// Module-scoped singleton state to ensure initialize is called only once per clientId
let initializedClientId: string | null = null;
let activeSuccessHandler: ((idToken: string) => void) | null = null;
let activeErrorHandler: ((error?: string) => void) | null = null;

function ensureGsiInitialized(clientId: string) {
  if (initializedClientId === clientId) {
    return;
  }
  const google = typeof window !== "undefined" ? (window as any).google : undefined;
  if (!google?.accounts?.id) {
    return;
  }
  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: any) => {
      if (response?.credential) {
        activeSuccessHandler?.(response.credential);
      } else {
        activeErrorHandler?.("No Google credential returned.");
      }
    },
  });
  initializedClientId = clientId;
}

export function GoogleButton({
  onSuccess,
  onError,
  disabled,
  label = "Continue with Google",
  onClick,
}: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const hasSuccessHandler = Boolean(onSuccess);

  useEffect(() => {
    if (onSuccess) {
      activeSuccessHandler = onSuccess;
    }
    if (onError) {
      activeErrorHandler = onError;
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!hasSuccessHandler || !scriptLoadedSuccessfully || !clientId || !containerRef.current) {
      return;
    }

    // 1. Single controlled initialization path
    ensureGsiInitialized(clientId);

    // 2. Clear any prior button node in this container
    const container = containerRef.current;
    container.innerHTML = "";

    // 3. Render Google Identity Services button with valid numeric pixel width
    // GIS docs: width must be between 200 and 400 pixels
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        width: 384,
        text: "continue_with",
      });
    }
  }, [clientId, scriptLoadedSuccessfully, hasSuccessHandler]);

  if (onSuccess) {
    return (
      <div className="flex w-full items-center justify-center min-h-[48px]">
        <div
          ref={containerRef}
          className={`w-full flex justify-center [&>div]:w-full [&_iframe]:!w-full [&_iframe]:!max-w-full ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 font-sans text-sm font-medium text-[#1F1F1F] shadow-sm transition-all hover:border-primary/40 hover:shadow-md disabled:opacity-60"
    >
      <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.9 35.4 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
