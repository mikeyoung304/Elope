/**
 * Error mapping utilities
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class UnprocessableEntityError extends DomainError {
  constructor(message: string) {
    super(message, 'UNPROCESSABLE_ENTITY', 422);
    this.name = 'UnprocessableEntityError';
  }
}

export function mapErrorToStatus(error: unknown): { statusCode: number; message: string; code: string } {
  if (error instanceof DomainError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
    };
  }

  // Unknown errors
  return {
    statusCode: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  };
}
