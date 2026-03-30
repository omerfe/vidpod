import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "."),
};

export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    projects: [
      {
        test: {
          name: "frontend",
          environment: "jsdom",
          globals: true,
          include: [
            "app/**/*.test.{ts,tsx}",
            "components/**/*.test.{ts,tsx}",
            "lib/**/*.test.{ts,tsx}",
          ],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        test: {
          name: "convex",
          environment: "edge-runtime",
          globals: true,
          include: ["convex/**/*.test.ts"],
        },
      },
    ],
  },
});
