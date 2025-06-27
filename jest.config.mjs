// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: {},

  collectCoverage: true,
  coverageDirectory: 'coverage',

  testMatch: ['**/scan-test/**/*.test.js'],
};
