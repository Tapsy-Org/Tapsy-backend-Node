import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import jsdocPlugin from "eslint-plugin-jsdoc";
import securityPlugin from "eslint-plugin-security";
import globals from "globals";

export default [
  {
    files: ["src/**/*.{ts,js}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...(js.configs.recommended.languageOptions?.globals ?? {}),
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier: prettierPlugin,
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
      jsdoc: jsdocPlugin,
      security: securityPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      // Disable base rule in favor of TS-aware rule
      "no-unused-vars": "off",
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "jsdoc/check-alignment": "warn",
      // Turn off indentation rule to avoid noisy warnings in Swagger JSDoc blocks
      "jsdoc/check-indentation": "off",
      "jsdoc/require-description": "warn",
      "security/detect-object-injection": "off",
    },
    settings: {
      "import/resolver": {
        typescript: {},
      },
    },
  },
  // Relax rules for declaration files
  {
    files: ["**/*.d.ts"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];


