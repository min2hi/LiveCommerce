import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: [
      "dist/**/*",
      "node_modules/**/*",
      "*.js",
      "*.k6.js"
    ]
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      // ── TypeScript strictness ──────────────────────────
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",

      // ── Clean Architecture enforcement ─────────────────
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["pg", "redis", "amqplib"],
              "message": "Do NOT import DB/cache/queue libs directly in services. Use stores/ or infrastructure/ adapters."
            }
          ]
        }
      ],

      // ── General best practices ─────────────────────────
      "no-console": "off",
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "prefer-const": "error"
    }
  },
  {
    files: ["src/infrastructure/**/*.ts", "src/stores/**/*.ts", "shared/**/*.ts"],
    rules: {
      "no-restricted-imports": "off"
    }
  },
  {
    files: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  },
  prettierConfig
];
