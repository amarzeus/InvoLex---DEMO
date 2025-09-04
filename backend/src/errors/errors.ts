import { EntityError } from '../types';

// Error factory functions for easier error creation
export function createValidationError(message: string, field: string, code: string): EntityError {
  return new EntityError(message, code, 400);
}

export function createNotFoundError(entityType: string, id: string): EntityError {
  return new EntityError(`${entityType} with id ${id} not found`, 'NOT_FOUND', 404);
}

export function createConflictError(message: string, field: string): EntityError {
  return new EntityError(message, 'CONFLICT', 409);
}

export function createPermissionError(message?: string): EntityError {
  return new EntityError(message || 'Insufficient permissions', 'PERMISSION_DENIED', 403);
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
}
