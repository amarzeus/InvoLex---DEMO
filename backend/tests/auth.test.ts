import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { makeRequest, createTestUser, cleanupTestData, expectValidationError, expectAuthError } from './utils';
import bcrypt from 'bcrypt';

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await makeRequest('POST', '/api/auth/register', { body: userData });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.isEmailVerified).toBe(false);
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.message).toBe('User registered successfully');
    });

    it('should hash the password correctly', async () => {
      const userData = {
        email: 'hashuser@example.com',
        password: 'password123',
        firstName: 'Hash',
        lastName: 'Test',
      };

      await makeRequest('POST', '/api/auth/register', { body: userData });

      // Verify password is hashed in database
      const prisma = (global as any).prisma;
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user).toBeDefined();
      expect(user!.passwordHash).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, user!.passwordHash)).toBe(true);
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await makeRequest('POST', '/api/auth/register', { body: userData });
      expectValidationError(response, 'email');
    });

    it('should return validation error for short password', async () => {
      const userData = {
        email: 'shortpass@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await makeRequest('POST', '/api/auth/register', { body: userData });
      expectValidationError(response, 'password');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Register first user
      await makeRequest('POST', '/api/auth/register', { body: userData });

      // Try to register again with same email
      const response = await makeRequest('POST', '/api/auth/register', { body: userData });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('USER_EXISTS');
      expect(response.body.error.message).toMatch(/already exists/i);
    });

    it('should return validation error for missing required fields', async () => {
      const userData = {
        email: 'incomplete@example.com',
        // Missing password, firstName, lastName
      };

      const response = await makeRequest('POST', '/api/auth/register', { body: userData });
      expectValidationError(response);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      // Create a test user
      const userData = {
        email: 'loginuser@example.com',
        password: 'password123',
        firstName: 'Login',
        lastName: 'Test',
      };

      await makeRequest('POST', '/api/auth/register', { body: userData });

      // Login with the same credentials
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await makeRequest('POST', '/api/auth/login', { body: loginData });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
      expect(response.body.message).toBe('Login successful');
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await makeRequest('POST', '/api/auth/login', { body: loginData });
      expectAuthError(response, 'INVALID_CREDENTIALS');
    });

    it('should return error for wrong password', async () => {
      // Create a test user
      await createTestUser({ email: 'wrongpass@example.com' });

      const loginData = {
        email: 'wrongpass@example.com',
        password: 'wrongpassword',
      };

      const response = await makeRequest('POST', '/api/auth/login', { body: loginData });
      expectAuthError(response, 'INVALID_CREDENTIALS');
    });

    it('should update lastLoginAt on successful login', async () => {
      // Create a test user
      const user = await createTestUser({ email: 'lastlogin@example.com' });
      const originalLastLogin = user.lastLoginAt;

      // Login
      const loginData = {
        email: 'lastlogin@example.com',
        password: 'password123',
      };

      await makeRequest('POST', '/api/auth/login', { body: loginData });

      // Check if lastLoginAt was updated
      const prisma = (global as any).prisma;
      const updatedUser = await prisma.user.findUnique({
        where: { email: 'lastlogin@example.com' },
      });

      expect(updatedUser!.lastLoginAt).not.toBe(originalLastLogin);
      expect(updatedUser!.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      // Create and login user
      const userData = {
        email: 'profile@example.com',
        password: 'password123',
        firstName: 'Profile',
        lastName: 'Test',
      };

      const registerResponse = await makeRequest('POST', '/api/auth/register', { body: userData });
      const token = registerResponse.body.token;

      // Get profile
      const response = await makeRequest('GET', '/api/auth/me', { token });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
    });

    it('should return error without token', async () => {
      const response = await makeRequest('GET', '/api/auth/me');
      expectAuthError(response);
    });

    it('should return error with invalid token', async () => {
      const response = await makeRequest('GET', '/api/auth/me', { token: 'invalid-token' });
      expectAuthError(response, 'INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      // Create and login user
      const userData = {
        email: 'logout@example.com',
        password: 'password123',
        firstName: 'Logout',
        lastName: 'Test',
      };

      const registerResponse = await makeRequest('POST', '/api/auth/register', { body: userData });
      const token = registerResponse.body.token;

      // Logout
      const response = await makeRequest('POST', '/api/auth/logout', { token });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should return error without token', async () => {
      const response = await makeRequest('POST', '/api/auth/logout');
      expectAuthError(response);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Create and login user
      const userData = {
        email: 'refresh@example.com',
        password: 'password123',
        firstName: 'Refresh',
        lastName: 'Test',
      };

      const registerResponse = await makeRequest('POST', '/api/auth/register', { body: userData });
      const originalToken = registerResponse.body.token;

      // Refresh token
      const response = await makeRequest('POST', '/api/auth/refresh', { token: originalToken });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(originalToken); // Should be a new token
      expect(response.body.message).toBe('Token refreshed successfully');
    });

    it('should return error without token', async () => {
      const response = await makeRequest('POST', '/api/auth/refresh');
      expectAuthError(response);
    });
  });
});
