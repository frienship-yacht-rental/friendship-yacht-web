import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      // eslint-config-next registers the jsx-a11y plugin but enables only a
      // handful of its rules. Accessibility is a legal requirement in most
      // markets, so pull in the full recommended set. The rules are spread
      // rather than the whole config, because re-declaring an already
      // registered plugin is a flat-config error.
      ...jsxA11y.flatConfigs.recommended.rules,

      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // Type-only imports are erased at compile time; `verbatimModuleSyntax`
      // requires them to be explicit.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",

      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
    },
  },

  // Application code reads configuration through the validated `@/env` module,
  // which guarantees a variable exists and is well-formed before it is used.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/env.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env']",
          message:
            "Import `env` from '@/env' instead of reading process.env directly.",
        },
      ],
    },
  },

  // shadcn/ui components are vendored from an upstream registry. Keep them
  // formatted and sorted, but do not fight their conventions.
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
      // Style-only rule; these files are overwritten on the next registry pull.
      eqeqeq: "off",
    },
  },

  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "e2e/**/*.ts",
      "src/test/**/*.{ts,tsx}",
    ],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Must stay last: disables every rule that would conflict with Prettier.
  prettier,
]);

export default eslintConfig;
