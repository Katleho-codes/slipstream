// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        fileParallelism: false, // Prevents multiple test files from conflicting in the DB
        clearMocks: true, // resets vi.fn() call history/return values between tests
        setupFiles: ["./tests/setup.ts"],
        environment: "node",
        coverage: {
            reporter: ["text", "html"],
        },
    },
});
