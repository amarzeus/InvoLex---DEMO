import { BaseEntityFactory } from './base-factory';
import { User, UserPreferences } from '../entities';
import { ValidationService } from '../validation';

// In-memory storage for demo purposes
// In a real application, this would be replaced with database operations
const userStorage = new Map<string, User>();

export class UserFactory extends BaseEntityFactory<User> {
  constructor(validationService: ValidationService) {
    super('user', validationService);
  }

  protected async createEntity(data: Partial<User>): Promise<User> {
    const baseEntity = this.createBaseEntity();

    const user: User = {
      ...baseEntity,
      version: 1,
      isDeleted: false,
      email: data.email!,
      firstName: data.firstName!,
      lastName: data.lastName!,
      passwordHash: data.passwordHash,
      isEmailVerified: data.isEmailVerified ?? false,
      lastLoginAt: data.lastLoginAt,
      preferences: data.preferences || {
        theme: 'system',
        timezone: 'UTC',
        dateFormat: 'MM/dd/yyyy',
        currency: 'USD',
        autoSync: true,
        emailNotifications: true
      },
      role: data.role || 'user'
    };

    // Store in memory
    userStorage.set(user.id, user);

    return user;
  }

  protected async findEntityById(id: string): Promise<User | null> {
    return userStorage.get(id) || null;
  }

  protected async findEntities(filter?: any): Promise<User[]> {
    const users = Array.from(userStorage.values());

    if (!filter) {
      return users;
    }

    // Apply filters
    return users.filter(user => {
      if (filter.email && user.email !== filter.email) {
        return false;
      }
      if (filter.role && user.role !== filter.role) {
        return false;
      }
      if (filter.isEmailVerified !== undefined && user.isEmailVerified !== filter.isEmailVerified) {
        return false;
      }
      return true;
    });
  }

  protected async updateEntity(id: string, data: Partial<User>): Promise<User> {
    const existingUser = userStorage.get(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: User = {
      ...existingUser,
      ...data,
      updatedAt: this.updateTimestamp()
    };

    userStorage.set(id, updatedUser);
    return updatedUser;
  }

  protected async deleteEntity(id: string): Promise<void> {
    userStorage.delete(id);
  }

  protected async entityExists(id: string): Promise<boolean> {
    return userStorage.has(id);
  }

  // Additional user-specific methods
  async findByEmail(email: string): Promise<User | null> {
    for (const user of userStorage.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findByRole(role: string): Promise<User[]> {
    return Array.from(userStorage.values()).filter(user => user.role === role);
  }

  async updateLastLogin(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return this.update(id, { lastLoginAt: new Date() });
  }

  async verifyEmail(id: string): Promise<User> {
    return this.update(id, { isEmailVerified: true });
  }

  async updateProfile(id: string, profileData: Partial<Pick<User, 'firstName' | 'lastName'>>): Promise<User> {
    return this.update(id, profileData);
  }

  async updatePreferences(id: string, preferences: Partial<UserPreferences>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedPreferences = { ...user.preferences, ...preferences };
    return this.update(id, { preferences: updatedPreferences });
  }
}
