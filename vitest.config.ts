import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  define: {
    // Stub import.meta.env for all test files so Supabase client init doesn't throw
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://placeholder.supabase.co"),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("placeholder-anon-key"),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify("placeholder-anon-key"),
    "import.meta.env.VITE_RAZORPAY_KEY_ID": JSON.stringify("rzp_test_placeholder"),
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
