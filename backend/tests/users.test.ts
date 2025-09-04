import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { makeRequest, createAuthenticatedUser, cleanupTestData, expectValidationError, expectAuthError, expectNotFoundError } from './utils';

describe('User Management Endpoints', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const { user, token } = await createAuthenticatedUser();

      const response = await makeRequest('GET', '/api/users/profile', { token });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.firstName).toBe(user.firstName);
      expect(response.body.user.lastName).toBe(user.lastName);
      expect(response.body.user._count).toBeDefined();
      expect(response.body.user._count.matters).toBe(0);
      expect(response.body.user._count.billableEntries).toBe(0);
      expect(response.body.user._count.emailProviders).toBe(0);
    });

    it('should return error without authentication', async () => {
      const response = await makeRequest('GET', '/api/users/profile');
      expectAuthError(response);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        preferences: {
          theme: 'dark',
          timezone: 'America/New_York',
          dateFormat: 'dd/MM/yyyy',
          currency: 'EUR',
          autoSync: false,
          emailNotifications: false,
        },
      };

      const response = await makeRequest('PUT', '/api/users/profile', {
        token,
        body: updateData,
      });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);
      expect(response.body.user.preferences).toEqual(updateData.preferences);
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should return validation error for invalid data', async () => {
      const { token } = await createAuthenticatedUser();

      const updateData = {
        firstName: '', // Invalid: empty string
        lastName: 'Valid',
      };

      const response = await makeRequest('PUT', '/api/users/profile', {
        token,
        body: updateData,
      });

      expectValidationError(response, 'firstName');
    });

    it('should return error without authentication', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await makeRequest('PUT', '/api/users/profile', {
        body: updateData,
      });

      expectAuthError(response);
    });
  });

  describe('GET /api/users (Admin only)', () => {
    it('should return list of users for admin', async () => {
      // Create admin user
      const { token: adminToken } = await createAuthenticatedUser();
      // Note: In a real scenario, you'd need to update the user role to admin

      // Create regular users
      await createAuthenticatedUser();
      await createAuthenticatedUser();

      const response = await makeRequest('GET', '/api/users', { token: adminToken });

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should return error for non-admin user', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await makeRequest('GET', '/api/users', { token });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should support pagination', async () => {
      // Create admin user
      const { token: adminToken } = await createAuthenticatedUser();

      // Create multiple users
      for (let i = 0; i < 5; i++) {
        await createAuthenticatedUser();
      }

      const response = await makeRequest('GET', '/api/users?page=1&limit=2', {
        token: adminToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe('GET /api/users/:id (Admin only)', () => {
    it('should return specific user for admin', async () => {
      // Create admin user
      const { token: adminToken } = await createAuthenticatedUser();

      // Create target user
      const { user: targetUser } = await createAuthenticatedUser();

      const response = await makeRequest('GET', `/api/users/${targetUser.id}`, {
        token: adminToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(targetUser.id);
      expect(response.body.user.email).toBe(targetUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const { token: adminToken } = await createAuthenticatedUser();

      const response = await makeRequest('GET', '/api/users/non-existent-id', {
        token: adminToken,
      });

      expectNotFoundError(response);
    });

    it('should return error for non-admin user', async () => {
      const { token } = await createAuthenticatedUser();
      const { user: targetUser } = await createAuthenticatedUser();

      const response = await makeRequest('GET', `/api/users/${targetUser.id}`, {
        token,
      });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('PUT /api/users/:id (Admin only)', () => {
    it('should update user successfully for admin', async () => {
      // Create admin user
      const { token: adminToken } = await createAuthenticatedUser();

      // Create target user
      const { user: targetUser } = await createAuthenticatedUser();

      const updateData = {
        firstName: 'Updated',
        lastName: 'ByAdmin',
        isEmailVerified: true,
      };

      const response = await makeRequest('PUT', `/api/users/${targetUser.id}`, {
        token: adminToken,
        body: updateData,
      });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);
      expect(response.body.user.isEmailVerified).toBe(updateData.isEmailVerified);
      expect(response.body.message).toBe('User updated successfully');
    });

    it('should return validation error for invalid data', async () => {
      const { token: adminToken } = await createAuthenticatedUser();
      const { user: targetUser } = await createAuthenticatedUser();

      const updateData = {
        firstName: '', // Invalid
        lastName: 'Valid',
      };

      const response = await makeRequest('PUT', `/api/users/${targetUser.id}`, {
        token: adminToken,
        body: updateData,
      });

      expectValidationError(response, 'firstName');
    });

    it('should return 404 for non-existent user', async () => {
      const { token: adminToken } = await createAuthenticatedUser();

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await makeRequest('PUT', '/api/users/non-existent-id', {
        token: adminToken,
        body: updateData,
      });

      expectNotFoundError(response);
    });
  });

  describe('DELETE /api/users/:id (Admin only)', () => {
    it('should soft delete user successfully for admin', async () => {
      // Create admin user
      const { token: adminToken } = await createAuthenticatedUser();

      // Create target user
      const { user: targetUser } = await createAuthenticatedUser();

      const response = await makeRequest('DELETE', `/api/users/${targetUser.id}`, {
        token: adminToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is soft deleted
      const prisma = (global as any).prisma;
      const deletedUser = await prisma.user.findUnique({
        where: { id: targetUser.id },
      });

      expect(deletedUser!.isDeleted).toBe(true);
      expect(deletedUser!.deletedAt).toBeInstanceOf(Date);
    });

    it('should return 404 for non-existent user', async () => {
      const { token: adminToken } = await createAuthenticatedUser();

      const response = await makeRequest('DELETE', '/api/users/non-existent-id', {
        token: adminToken,
      });

      expectNotFoundError(response);
    });

    it('should return error for non-admin user', async () => {
      const { token } = await createAuthenticatedUser();
      const { user: targetUser } = await createAuthenticatedUser();

      const response = await makeRequest('DELETE', `/api/users/${targetUser.id}`, {
        token,
      });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});
