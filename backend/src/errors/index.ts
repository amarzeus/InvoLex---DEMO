import { EntityError, ValidationError, NotFoundError, ConflictError, PermissionError } from '../types';

// Error factory functions for easier error creation
export function createValidationError(message: string, field: string, code: string): ValidationError {
  return new ValidationError(message, field, code);
}

export function createNotFoundError(entityType: string, id: string): NotFoundError {
  return new NotFoundError(entityType, id);
}

export function createConflictError(message: string, field: string): ConflictError {
  return new ConflictError(message, field);
}

export function createPermissionError(message?: string): PermissionError {
  return new PermissionError(message);
}

// Error response formatter
export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    details?: any[];
    code?: string;
  };
}

export function formatErrorResponse(error: EntityError): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      type: error.name,
      message: error.message,
      code: error.code
    }
  };

  // Add specific details for validation errors
  if (error instanceof ValidationError) {
    response.error.details = [{
      field: error.field,
      validationCode: error.validationCode
    }];
  }

  return response;
}

// Error handler utility
export class ErrorHandler {
  static handle(error: any): ErrorResponse {
    if (error instanceof EntityError) {
      return formatErrorResponse(error);
    }

    // Handle generic errors
    return {
      error: {
        type: 'InternalServerError',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      }
    };
  }

  static isValidationError(error: any): error is ValidationError {
    return error instanceof ValidationError;
  }

  static isNotFoundError(error: any): error is NotFoundError {
    return error instanceof NotFoundError;
  }

  static isConflictError(error: any): error is ConflictError {
    return error instanceof ConflictError;
  }

  static isPermissionError(error: any): error is PermissionError {
    return error instanceof PermissionError;
  }
}
