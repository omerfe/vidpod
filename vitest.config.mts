import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, defineProject } from "vitest/config";

const rootDirectory = fileURLToPath(new URL(".", import.meta.url));
const alias = {
  "@": path.resolve(rootDirectory),
};

export default defineConfig({
  test: {
    projects: [
      defineProject({
        resolve: {
          alias,
        },
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
      }),
      defineProject({
        test: {
          name: "convex",
          environment: "edge-runtime",
          globals: true,
          include: ["convex/**/*.test.ts"],
        },
      }),
    ],
  },
});
