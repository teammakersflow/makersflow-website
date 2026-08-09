import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Build a self-contained Node HTTP server instead of Lovable's default
  // Cloudflare fetch-handler output, so this can run in a container.
  nitro: {
    preset: "node-server",
  },
  vite: {
    server: {
      port: 8081,
      host: true,
    },
    resolve: {
      tsconfigPaths: true,
    },
  },
});
