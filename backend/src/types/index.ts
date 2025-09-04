// Base entity types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Transaction types
export interface Transaction {
  id: string;
  operations: TransactionOperation[];
  status: 'pending' | 'committed' | 'rolled_back';
}

export interface TransactionOperation {
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: string;
  data?: any;
}

// Factory interface
export interface EntityFactory<T extends BaseEntity> {
  create(data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<T | null>;
  findAll(filter?: any): Promise<T[]>;
  validate(data: Partial<T>): ValidationResult;
  exists(id: string): Promise<boolean>;
}

// Error types
export class EntityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'EntityError';
  }
}

export class ValidationError extends EntityError {
  constructor(
    message: string,
    public field: string,
    public validationCode: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends EntityError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends EntityError {
  constructor(message: string, public field: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class PermissionError extends EntityError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'PermissionError';
  }
}

// Common entity fields
export interface Auditable {
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

export interface SoftDeletable {
  deletedAt?: Date;
  deletedBy?: string;
  isDeleted: boolean;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
