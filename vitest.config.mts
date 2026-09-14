import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Native replacement for vite-tsconfig-paths; resolves the `@/*` alias.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Playwright owns e2e/; Vitest must not try to run those specs.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    css: true,
    restoreMocks: true,
    // Fixed values so tests never depend on a developer's .env.local.
    env: {
      API_BASE_URL: "https://api.test.local",
      NEXT_PUBLIC_SITE_URL: "https://test.local",
      NEXT_PUBLIC_API_URL: "https://api.test.local",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        // Vendored from the shadcn registry; upstream owns their tests.
        "src/components/ui/**",
        // Framework file conventions — exercised by the Playwright suite.
        "src/app/**/{layout,error,global-error,not-found,loading}.tsx",
        "src/app/**/{sitemap,robots}.ts",
        // `import "server-only"` throws outside a React Server Component, so
        // these cannot be imported by Vitest at all. Covered by e2e instead.
        "src/lib/api/server.ts",
        "src/features/**/queries.ts",
        // Provider wiring with no branching logic of its own.
        "src/components/providers.tsx",
        "src/env.ts",
        "**/*.d.ts",
      ],
      thresholds: {
        // A floor to ratchet upward, not a target. Raise as coverage grows.
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
  },
});
