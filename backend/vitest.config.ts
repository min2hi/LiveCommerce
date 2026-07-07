import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tests/e2e', 'tests/load'],

    // Global test APIs (describe, it, expect) — no need to import
    globals: true,

    // Run tests in Node.js environment (not browser)
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      // Coverage thresholds — CI will fail if below
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      // Exclude from coverage
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'apps/*/main.ts', // Entrypoints
        'src/infrastructure/**', // Technical adapters (hard to unit test)
        '**/*.d.ts',
      ],
    },

    // Timeout per test
    testTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
  },
});
