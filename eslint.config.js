import js from '@eslint/js';
import * as importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';

// Recommended rules from eslint‑plugin‑import (converted for flat config)
const importRecommendedRules = importPlugin.configs.recommended.rules;
const nodeEnv = js.environments.node;

// eslint-disable-next-line no-unused-vars
const { root: _unused, ...eslintRecommendedNoRoot } = js.configs.recommended;

export default [
  nodeEnv, // Node environment globals
  eslintRecommendedNoRoot, // base ESLint rules (root key removed)
  {
    plugins: {
      import: importPlugin,
      prettier,
    },
    rules: {
      // import plugin defaults
      ...importRecommendedRules,

      // tue regole personalizzate / override
      'prettier/prettier': 'error',
      'import/no-unresolved': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
      // ...
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.test.{js,ts}', 'scan-test/**/*.js', 'scan-test/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
      },
    },
  },
];
