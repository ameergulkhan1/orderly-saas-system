import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { prisma } from '../src/config/database';
import { clearDatabase, createTestBusiness, createTestUser, createTestOrder } from './helpers/testHelpers';
import { generateTestToken } from './helpers/authHelpers';

// Global test setup
beforeAll(async () => {
  // Ensure database is clean before tests
  await clearDatabase();
});

beforeEach(async () => {
  // Clean database between tests
  await clearDatabase();
});

afterEach(async () => {
  // Clean up after each test
  await clearDatabase();
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Export common test utilities
export { createTestBusiness, createTestUser, createTestOrder, generateTestToken };