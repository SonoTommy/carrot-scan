import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',      // let espree handle modern syntax
      sourceType: 'module',
    },
  },
];