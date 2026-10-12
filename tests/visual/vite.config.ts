import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  root: local("./"),
  envDir: local("./"),
  envPrefix: "ISOLATED_FIXTURE_PUBLIC_",
  cacheDir: local("./.cache"),
  publicDir: local("../../public"),
  resolve: { alias: [
    { find: "@/src/client/use-studio", replacement: local("./fixture-studio.tsx") },
    { find: "@/src/client/api", replacement: local("./fixture-api.ts") },
    { find: "@/src/client/recovery", replacement: local("./fixture-recovery.ts") },
    { find: "@", replacement: local("../../") },
  ] },
  plugins: [react(), {
    name: "isolated-ui-test-only",
    configResolved(config) {
      if (config.server.host !== "127.0.0.1" || config.server.port !== 5174 || !config.server.strictPort)
        throw new Error("Fixture must bind 127.0.0.1:5174 with strictPort.");
    },
    load(id) {
      if (/\/src\/(client\/(use-studio|api|recovery)\.|server\/)/.test(id))
        throw new Error(`Production side effects are forbidden in this fixture: ${id}`);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!['GET', 'HEAD'].includes(req.method || '') || /^\/api(?:\/|\?|$)/.test(req.url || '')) {
          res.statusCode = 403;
          res.end("ISOLATED UI TEST: API requests and mutations are forbidden.");
          return;
        }
        next();
      });
    },
  }],
  server: {
    host: "127.0.0.1", port: 5174, strictPort: true, hmr: false,
    watch: { useFsEvents: false, usePolling: true },
    headers: { "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'none'; object-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'" },
  },
  build: { outDir: local("./.build"), emptyOutDir: true, copyPublicDir: false },
});
