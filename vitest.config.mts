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
    // Fuseau fixe : les tests de dates (changement d'heure compris) donnent
    // le même résultat sur toutes les machines.
    env: { TZ: "Europe/Paris" },
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
