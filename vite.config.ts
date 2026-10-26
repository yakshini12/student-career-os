import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The app is a single local React workspace; tests cover pure model code.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/test/**/*.test.ts"],
  },
});
