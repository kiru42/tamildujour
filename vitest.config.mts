import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Par défaut : node (données, services). Les tests de composants
    // passent en jsdom via `// @vitest-environment jsdom`.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
