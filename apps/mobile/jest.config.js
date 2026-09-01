const jestExpoPreset = require('jest-expo/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
  ...jestExpoPreset,
  setupFiles: [...(jestExpoPreset.setupFiles || []), '<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
};
