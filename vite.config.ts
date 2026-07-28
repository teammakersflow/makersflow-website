import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
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
