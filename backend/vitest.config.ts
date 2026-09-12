// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./tests/setup.ts"],
        testTimeout: 15000,
        sequence: { concurrent: false },
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary"],
            include: [
                "src/controllers/**",
                "src/utils/**",
                "src/middleware/**",
            ],
            exclude: ["src/tests/**", "src/services/pdf.service.ts"],
        },
    },
});
