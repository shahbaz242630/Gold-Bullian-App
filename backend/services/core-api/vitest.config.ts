import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts", "src/**/*.test.ts", "test/**/*.spec.ts"],
    coverage: {
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        "test/",
        "**/*.spec.ts",
        "**/*.d.ts",
        "dist/",
      ],
    },
  },
});

