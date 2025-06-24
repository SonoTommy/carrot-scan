// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
  overrides: [
    {
      files: ["scan-test/**/*.js", "plugins/**/*.js"],
      rules: {
        "no-unused-vars": "off",
        "no-undef": "off"
      }
    }
  ]
};