import { PrismaClient } from '@prisma/client';
import { jest, expect, beforeAll, afterAll } from '@jest/globals';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
    }
  }
}

expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass,
    };
  },
});

// Global test database client
let prisma: PrismaClient;

beforeAll(async () => {
  // Use test database URL if available, otherwise use main database
  const databaseUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

  prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  });

  // Clean up database before tests
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Make prisma available globally for tests
(global as any).prisma = prisma;

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
