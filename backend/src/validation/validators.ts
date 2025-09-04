import {
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types';
import {
  User,
  Matter,
  BillableEntry,
  EmailProvider
} from '../entities';
import { createValidationError } from '../errors';

// Base validator interface
export interface Validator<T> {
  validate(data: Partial<T>): ValidationResult;
  validateField(field: keyof T, value: any): ValidationError[];
}

// Email validation utility
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation utility
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Date validation utilities
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function isFutureDate(date: Date): boolean {
  return date > new Date();
}

export function isWithinLastYears(date: Date, years: number): boolean {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years);
  return date >= cutoffDate;
}

// User validator
export class UserValidator implements Validator<User> {
  validate(data: Partial<User>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!data.email) {
      errors.push(createValidationError('Email is required', 'email', 'REQUIRED_EMAIL'));
    } else if (!isValidEmail(data.email)) {
      errors.push(createValidationError('Invalid email format', 'email', 'INVALID_EMAIL_FORMAT'));
    }

    if (!data.firstName?.trim()) {
      errors.push(createValidationError('First name is required', 'firstName', 'REQUIRED_FIRST_NAME'));
    } else if (data.firstName.length > 50) {
      errors.push(createValidationError('First name must be less than 50 characters', 'firstName', 'FIRST_NAME_TOO_LONG'));
    }

    if (!data.lastName?.trim()) {
      errors.push(createValidationError('Last name is required', 'lastName', 'REQUIRED_LAST_NAME'));
    } else if (data.lastName.length > 50) {
      errors.push(createValidationError('Last name must be less than 50 characters', 'lastName', 'LAST_NAME_TOO_LONG'));
    }

    // Password validation (only if provided)
    if (data.passwordHash && !isValidPassword(data.passwordHash)) {
      errors.push(createValidationError('Password must be at least 8 characters with uppercase, lowercase, and number', 'passwordHash', 'INVALID_PASSWORD'));
    }

    // Role validation
    if (data.role && !['admin', 'user', 'premium'].includes(data.role)) {
      errors.push(createValidationError('Invalid user role', 'role', 'INVALID_ROLE'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateField(field: keyof User, value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (field) {
      case 'email':
        if (!value) {
          errors.push(createValidationError('Email is required', 'email', 'REQUIRED_EMAIL'));
        } else if (!isValidEmail(value)) {
          errors.push(createValidationError('Invalid email format', 'email', 'INVALID_EMAIL_FORMAT'));
        }
        break;

      case 'firstName':
        if (!value?.trim()) {
          errors.push(createValidationError('First name is required', 'firstName', 'REQUIRED_FIRST_NAME'));
        } else if (value.length > 50) {
          errors.push(createValidationError('First name must be less than 50 characters', 'firstName', 'FIRST_NAME_TOO_LONG'));
        }
        break;

      case 'lastName':
        if (!value?.trim()) {
          errors.push(createValidationError('Last name is required', 'lastName', 'REQUIRED_LAST_NAME'));
        } else if (value.length > 50) {
          errors.push(createValidationError('Last name must be less than 50 characters', 'lastName', 'LAST_NAME_TOO_LONG'));
        }
        break;
    }

    return errors;
  }
}

// Matter validator
export class MatterValidator implements Validator<Matter> {
  validate(data: Partial<Matter>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!data.userId) {
      errors.push(createValidationError('User ID is required', 'userId', 'REQUIRED_USER_ID'));
    }

    if (!data.name?.trim()) {
      errors.push(createValidationError('Matter name is required', 'name', 'REQUIRED_MATTER_NAME'));
    } else if (data.name.length > 255) {
      errors.push(createValidationError('Matter name must be less than 255 characters', 'name', 'MATTER_NAME_TOO_LONG'));
    }

    if (data.rate !== undefined) {
      if (typeof data.rate !== 'number' || data.rate <= 0) {
        errors.push(createValidationError('Rate must be a positive number', 'rate', 'INVALID_RATE'));
      } else if (data.rate > 10000) {
        warnings.push({
          field: 'rate',
          message: 'Rate seems unusually high',
          code: 'HIGH_RATE_WARNING'
        });
      }
    }

    if (data.status && !['active', 'inactive', 'archived', 'completed'].includes(data.status)) {
      errors.push(createValidationError('Invalid matter status', 'status', 'INVALID_STATUS'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateField(field: keyof Matter, value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (field) {
      case 'name':
        if (!value?.trim()) {
          errors.push(createValidationError('Matter name is required', 'name', 'REQUIRED_MATTER_NAME'));
        } else if (value.length > 255) {
          errors.push(createValidationError('Matter name must be less than 255 characters', 'name', 'MATTER_NAME_TOO_LONG'));
        }
        break;

      case 'rate':
        if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
          errors.push(createValidationError('Rate must be a positive number', 'rate', 'INVALID_RATE'));
        }
        break;
    }

    return errors;
  }
}

// BillableEntry validator
export class BillableEntryValidator implements Validator<BillableEntry> {
  validate(data: Partial<BillableEntry>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!data.userId) {
      errors.push(createValidationError('User ID is required', 'userId', 'REQUIRED_USER_ID'));
    }

    if (!data.matterId) {
      errors.push(createValidationError('Matter ID is required', 'matterId', 'REQUIRED_MATTER_ID'));
    }

    if (!data.description?.trim()) {
      errors.push(createValidationError('Description is required', 'description', 'REQUIRED_DESCRIPTION'));
    } else if (data.description.length > 1000) {
      errors.push(createValidationError('Description must be less than 1000 characters', 'description', 'DESCRIPTION_TOO_LONG'));
    }

    // Hours validation
    if (data.hours !== undefined) {
      if (typeof data.hours !== 'number' || data.hours <= 0) {
        errors.push(createValidationError('Hours must be a positive number', 'hours', 'INVALID_HOURS'));
      } else if (data.hours > 24) {
        errors.push(createValidationError('Hours cannot exceed 24 per day', 'hours', 'HOURS_TOO_HIGH'));
      }
    }

    // Rate validation
    if (data.rate !== undefined) {
      if (typeof data.rate !== 'number' || data.rate <= 0) {
        errors.push(createValidationError('Rate must be a positive number', 'rate', 'INVALID_RATE'));
      }
    }

    // Date validation
    if (data.date) {
      if (!isValidDate(data.date)) {
        errors.push(createValidationError('Invalid date format', 'date', 'INVALID_DATE'));
      } else if (isFutureDate(data.date)) {
        errors.push(createValidationError('Date cannot be in the future', 'date', 'FUTURE_DATE'));
      } else if (!isWithinLastYears(data.date, 2)) {
        warnings.push({
          field: 'date',
          message: 'Date is more than 2 years old',
          code: 'OLD_DATE_WARNING'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateField(field: keyof BillableEntry, value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (field) {
      case 'description':
        if (!value?.trim()) {
          errors.push(createValidationError('Description is required', 'description', 'REQUIRED_DESCRIPTION'));
        } else if (value.length > 1000) {
          errors.push(createValidationError('Description must be less than 1000 characters', 'description', 'DESCRIPTION_TOO_LONG'));
        }
        break;

      case 'hours':
        if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
          errors.push(createValidationError('Hours must be a positive number', 'hours', 'INVALID_HOURS'));
        } else if (value > 24) {
          errors.push(createValidationError('Hours cannot exceed 24 per day', 'hours', 'HOURS_TOO_HIGH'));
        }
        break;
    }

    return errors;
  }
}

// EmailProvider validator
export class EmailProviderValidator implements Validator<EmailProvider> {
  validate(data: Partial<EmailProvider>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!data.userId) {
      errors.push(createValidationError('User ID is required', 'userId', 'REQUIRED_USER_ID'));
    }

    if (!data.provider) {
      errors.push(createValidationError('Provider is required', 'provider', 'REQUIRED_PROVIDER'));
    } else if (!['gmail', 'outlook', 'imap', 'exchange'].includes(data.provider)) {
      errors.push(createValidationError('Invalid email provider', 'provider', 'INVALID_PROVIDER'));
    }

    if (!data.email) {
      errors.push(createValidationError('Email is required', 'email', 'REQUIRED_EMAIL'));
    } else if (!isValidEmail(data.email)) {
      errors.push(createValidationError('Invalid email format', 'email', 'INVALID_EMAIL_FORMAT'));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateField(field: keyof EmailProvider, value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (field) {
      case 'provider':
        if (!value) {
          errors.push(createValidationError('Provider is required', 'provider', 'REQUIRED_PROVIDER'));
        } else if (!['gmail', 'outlook', 'imap', 'exchange'].includes(value)) {
          errors.push(createValidationError('Invalid email provider', 'provider', 'INVALID_PROVIDER'));
        }
        break;

      case 'email':
        if (!value) {
          errors.push(createValidationError('Email is required', 'email', 'REQUIRED_EMAIL'));
        } else if (!isValidEmail(value)) {
          errors.push(createValidationError('Invalid email format', 'email', 'INVALID_EMAIL_FORMAT'));
        }
        break;
    }

    return errors;
  }
}
