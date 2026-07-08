import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: [
      "**/dist/**/*",
      "**/node_modules/**/*",
      "**/build/**/*",
      "**/.next/**/*",
      "*.js",
      "*.k6.js",
      "**/vite.config.ts",
      "**/playwright.config.ts"
    ]
  },
  {
    files: ["backend/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./backend/tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
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
      ]
    }
  },
  {
    files: [
      "backend/src/infrastructure/**/*.ts",
      "backend/src/stores/**/*.ts",
      "backend/shared/**/*.ts",
      "backend/apps/**/*.ts",
      "backend/scratch/**/*.ts"
    ],
    rules: {
      "no-restricted-imports": "off"
    }
  },
  {
    files: [
      "backend/tests/**/*.ts",
      "backend/**/*.test.ts",
      "backend/scratch/**/*.ts",
      "backend/seed-test-data.ts"
    ],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  },
  {
    files: ["frontend/**/*.ts", "frontend/**/*.tsx", "tests/e2e/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  },
  prettierConfig
];
