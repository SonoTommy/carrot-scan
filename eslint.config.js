import js from '@eslint/js';
import * as importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';


export default [
  js.configs.recommended,         // base ESLint rules
  importPlugin.configs.recommended,
  {
    plugins: {
      import: importPlugin,
      prettier,
    },
    rules: {
      // tue regole personalizzate
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