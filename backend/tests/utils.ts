import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const prisma = (global as any).prisma as PrismaClient;

// Test data factories
export const createTestUser = async (overrides: Partial<User> = {}): Promise<User> => {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    passwordHash: await bcrypt.hash('password123', 12),
    firstName: 'Test',
    lastName: 'User',
    role: 'user' as const,
    isEmailVerified: false,
    preferences: {
      theme: 'system',
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy',
      currency: 'USD',
      autoSync: true,
      emailNotifications: true,
    },
  };

  return await prisma.user.create({
    data: { ...defaultUser, ...overrides },
  });
};

export const generateTestToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const createAuthenticatedUser = async (): Promise<{ user: User; token: string }> => {
  const user = await createTestUser();
  const token = generateTestToken(user);
  return { user, token };
};

// Cleanup utilities
export const cleanupTestData = async (): Promise<void> => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
};

// HTTP request helpers for integration tests
export const makeRequest = async (
  method: string,
  url: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    token?: string;
  } = {}
): Promise<{ status: number; body: any; headers: any }> => {
  const { body, headers = {}, token } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`http://localhost:3001${url}`, requestOptions);
  const responseBody = await response.json().catch(() => ({}));

  return {
    status: response.status,
    body: responseBody,
    headers: Object.fromEntries(response.headers.entries()),
  };
};

// Validation helpers
export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.error).toBeDefined();
  expect(response.body.error.code).toBe('VALIDATION_ERROR');

  if (field) {
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: field })
      ])
    );
  }
};

export const expectAuthError = (response: any, code: string = 'AUTH_REQUIRED') => {
  expect(response.status).toBe(401);
  expect(response.body.error).toBeDefined();
  expect(response.body.error.code).toBe(code);
};

export const expectNotFoundError = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body.error).toBeDefined();
  expect(response.body.error.message).toMatch(/not found/i);
};
