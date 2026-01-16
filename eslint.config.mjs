import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // TypeScript strict rules - 禁止 any
      '@typescript-eslint/no-explicit-any': 'error',
      // Note: no-unsafe-* rules are disabled because eslint-config-next
      // doesn't support type-aware linting by default. Enable by configuring
      // parserOptions.project if needed.
      // "@typescript-eslint/no-unsafe-assignment": "error",
      // "@typescript-eslint/no-unsafe-member-access": "error",
      // "@typescript-eslint/no-unsafe-call": "error",
      // "@typescript-eslint/no-unsafe-return": "error",
      // "@typescript-eslint/no-unsafe-argument": "error",
      // "@typescript-eslint/explicit-function-return-type": "warn",
      // "@typescript-eslint/explicit-module-boundary-types": "warn",
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // General best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'coverage/**',
    'playwright-report/**',
    // Config files (no type information available)
    '*.config.mjs',
    '*.config.js',
    // Spec files - not part of the TypeScript project
    'specs/**/*.js',
  ]),
]);

export default eslintConfig;
