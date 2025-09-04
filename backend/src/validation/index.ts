import {
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types';
import {
  UserValidator,
  MatterValidator,
  BillableEntryValidator,
  EmailProviderValidator,
  Validator
} from './validators';
import { createValidationError } from '../errors';

// Validation service
export class ValidationService {
  private validators = new Map<string, Validator<any>>();

  constructor() {
    this.registerValidator('user', new UserValidator());
    this.registerValidator('matter', new MatterValidator());
    this.registerValidator('billableEntry', new BillableEntryValidator());
    this.registerValidator('emailProvider', new EmailProviderValidator());
  }

  registerValidator<T>(entityType: string, validator: Validator<T>): void {
    this.validators.set(entityType, validator);
  }

  validate<T>(entityType: string, data: Partial<T>): ValidationResult {
    const validator = this.validators.get(entityType);
    if (!validator) {
      return {
        isValid: false,
        errors: [createValidationError(`No validator found for entity type: ${entityType}`, 'entityType', 'UNKNOWN_ENTITY_TYPE')],
        warnings: []
      };
    }

    return validator.validate(data);
  }

  validateField<T>(entityType: string, field: keyof T, value: any): ValidationError[] {
    const validator = this.validators.get(entityType) as Validator<T>;
    if (!validator) {
      return [createValidationError(`No validator found for entity type: ${entityType}`, 'entityType', 'UNKNOWN_ENTITY_TYPE')];
    }

    return validator.validateField(field, value);
  }

  // Utility method to validate multiple entities at once
  validateBatch<T>(entityType: string, entities: Partial<T>[]): {
    results: ValidationResult[];
    hasErrors: boolean;
    totalErrors: number;
  } {
    const results = entities.map(entity => this.validate(entityType, entity));
    const hasErrors = results.some(result => !result.isValid);
    const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);

    return {
      results,
      hasErrors,
      totalErrors
    };
  }

  // Get available entity types
  getAvailableEntityTypes(): string[] {
    return Array.from(this.validators.keys());
  }

  // Check if entity type is supported
  isEntityTypeSupported(entityType: string): boolean {
    return this.validators.has(entityType);
  }
}

// Export validators for direct use
export {
  UserValidator,
  MatterValidator,
  BillableEntryValidator,
  EmailProviderValidator
} from './validators';

// Export validation utilities
export {
  isValidEmail,
  isValidPassword,
  isValidDate,
  isFutureDate,
  isWithinLastYears
} from './validators';

export type { Validator } from './validators';
