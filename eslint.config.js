import js from '@eslint/js';
import * as importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals'; // 👈 nuovo

// Recommended rules from eslint‑plugin‑import (converted for flat config)
const importRecommendedRules = importPlugin.configs.recommended.rules;

const { root: _unused, ...eslintRecommendedNoRoot } = js.configs.recommended;

export default [
  {
    // 👈 blocco per i globali Node
    languageOptions: {
      globals: globals.node,
    },
  },
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
