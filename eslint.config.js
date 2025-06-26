import js from '@eslint/js';
import * as importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';

// Recommended rules from eslint‑plugin‑import (converted for flat config)
const importRecommendedRules = importPlugin.configs.recommended.rules;

// Remove the unsupported `root` key from @eslint/js recommended flat config
const { root: _removedRoot, ...eslintRecommendedNoRoot } = js.configs.recommended;

export default [
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
      // ...
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.test.js'],
    rules: {
      // override per i test
    },
  },
];
