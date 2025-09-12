/**
 * Main test suite for Scenarium Interpolation System
 * 
 * This file imports and runs all test suites to ensure
 * comprehensive coverage of the interpolation functionality.
 * 
 * Run with: npm test
 * Run with coverage: npm run test:coverage
 * Run in watch mode: npm run test:watch
 */

// Import all test suites
import './interpolation.test';
import './scope-manager.test';
import './interpolation-context.test';
import './arithmetic-functions.test';
import './function-registry.test';

describe('Scenarium Interpolation System - Integration Tests', () => {
  test('should have all test suites available', () => {
    // This test ensures all test files are properly imported
    // and the test runner can find them
    expect(true).toBe(true);
  });
});

// Export test utilities for potential reuse
export const testUtils = {
  createMockContext: (userData = {}, scenarioData = {}) => ({
    userContext: {
      userId: 'test-user',
      data: userData
    },
    scenarioContext: scenarioData
  }),
  
  createMockInterpolationContext: () => {
    const { InterpolationContextBuilder } = require('../src/interpolation/InterpolationContext');
    return InterpolationContextBuilder.createContext({
      userContext: { data: {} },
      scenarioContext: {}
    });
  }
};
