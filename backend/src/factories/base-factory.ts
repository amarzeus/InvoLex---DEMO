import { v4 as uuidv4 } from 'uuid';
import {
  BaseEntity,
  EntityFactory,
  ValidationResult,
  Transaction,
  TransactionOperation
} from '../types';
import { ValidationService } from '../validation';
import { createValidationError, createNotFoundError } from '../errors/errors';

// Base factory implementation
export abstract class BaseEntityFactory<T extends BaseEntity> implements EntityFactory<T> {
  protected validationService: ValidationService;
  protected entityType: string;

  constructor(entityType: string, validationService: ValidationService) {
    this.entityType = entityType;
    this.validationService = validationService;
  }

  // Abstract methods to be implemented by concrete factories
  protected abstract createEntity(data: Partial<T>): Promise<T>;
  protected abstract findEntityById(id: string): Promise<T | null>;
  protected abstract findEntities(filter?: any): Promise<T[]>;
  protected abstract updateEntity(id: string, data: Partial<T>): Promise<T>;
  protected abstract deleteEntity(id: string): Promise<void>;
  protected abstract entityExists(id: string): Promise<boolean>;

  // Public interface implementation
  async create(data: Partial<T>): Promise<T> {
    // Validate input data
    const validation = this.validate(data);
    if (!validation.isValid) {
      throw createValidationError(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`, 'validation', 'VALIDATION_FAILED');
    }

    // Pre-create hooks
    await this.beforeCreate(data);

    // Create entity
    const entity = await this.createEntity(data);

    // Post-create hooks
    await this.afterCreate(entity);

    return entity;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // Check if entity exists
    if (!(await this.exists(id))) {
      throw createNotFoundError(this.entityType, id);
    }

    // Validate input data
    const validation = this.validate(data);
    if (!validation.isValid) {
      throw createValidationError(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`, 'validation', 'VALIDATION_FAILED');
    }

    // Pre-update hooks
    await this.beforeUpdate(id, data);

    // Update entity
    const entity = await this.updateEntity(id, data);

    // Post-update hooks
    await this.afterUpdate(entity);

    return entity;
  }

  async delete(id: string): Promise<void> {
    // Check if entity exists
    if (!(await this.exists(id))) {
      throw createNotFoundError(this.entityType, id);
    }

    // Pre-delete hooks
    await this.beforeDelete(id);

    // Delete entity
    await this.deleteEntity(id);

    // Post-delete hooks
    await this.afterDelete(id);
  }

  async findById(id: string): Promise<T | null> {
    return this.findEntityById(id);
  }

  async findAll(filter?: any): Promise<T[]> {
    return this.findEntities(filter);
  }

  async exists(id: string): Promise<boolean> {
    return this.entityExists(id);
  }

  validate(data: Partial<T>): ValidationResult {
    return this.validationService.validate(this.entityType, data);
  }

  // Hook methods that can be overridden by subclasses
  protected async beforeCreate(data: Partial<T>): Promise<void> {
    // Default implementation - can be overridden
  }

  protected async afterCreate(entity: T): Promise<void> {
    // Default implementation - can be overridden
  }

  protected async beforeUpdate(id: string, data: Partial<T>): Promise<void> {
    // Default implementation - can be overridden
  }

  protected async afterUpdate(entity: T): Promise<void> {
    // Default implementation - can be overridden
  }

  protected async beforeDelete(id: string): Promise<void> {
    // Default implementation - can be overridden
  }

  protected async afterDelete(id: string): Promise<void> {
    // Default implementation - can be overridden
  }

  // Utility methods
  protected generateId(): string {
    return uuidv4();
  }

  protected getCurrentTimestamp(): Date {
    return new Date();
  }

  protected createBaseEntity(): Pick<BaseEntity, 'id' | 'createdAt' | 'updatedAt'> {
    const now = this.getCurrentTimestamp();
    return {
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
  }

  protected updateTimestamp(): Date {
    return this.getCurrentTimestamp();
  }
}

// Transaction-aware factory mixin
export interface TransactionAware {
  beginTransaction(): Promise<Transaction>;
  commitTransaction(transaction: Transaction): Promise<void>;
  rollbackTransaction(transaction: Transaction): Promise<void>;
  executeInTransaction<T>(operation: () => Promise<T>): Promise<T>;
}

// Factory registry for managing multiple factories
export class FactoryRegistry {
  private factories = new Map<string, EntityFactory<any>>();
  private validationService: ValidationService;

  constructor(validationService: ValidationService) {
    this.validationService = validationService;
  }

  registerFactory<T extends BaseEntity>(entityType: string, factory: EntityFactory<T>): void {
    this.factories.set(entityType, factory);
  }

  getFactory<T extends BaseEntity>(entityType: string): EntityFactory<T> | undefined {
    return this.factories.get(entityType);
  }

  getAllFactories(): Map<string, EntityFactory<any>> {
    return new Map(this.factories);
  }

  getAvailableEntityTypes(): string[] {
    return Array.from(this.factories.keys());
  }

  isEntityTypeSupported(entityType: string): boolean {
    return this.factories.has(entityType);
  }
}
