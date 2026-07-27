/**
 * Minimal Deno global type stubs for IDE support.
 * Supabase Edge Functions run in the Deno runtime — these declarations
 * prevent TypeScript errors in editors that don't have the Deno SDK installed.
 * This file has no effect on the deployed edge function.
 */
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
  }
  const env: Env;

  function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: Record<string, unknown>,
  ): void;
}
