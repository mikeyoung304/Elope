/**
 * Client-side error handling utilities
 * Provides error classes and handlers for API and application errors
 */

import { captureException } from './sentry';

// ============================================================================
// API Error Classes
// ============================================================================

/**
 * Base API error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'APIError';
  }

  /**
   * Checks if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Checks if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Network error - for connection issues
 */
export class NetworkError extends Error {
  constructor(message: string = 'Network error - please check your connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Validation error - for form/input validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Error Handler Functions
// ============================================================================

/**
 * Handles API response errors
 * Converts fetch responses into appropriate error types
 */
export async function handleAPIResponse(response: Response): Promise<any> {
  // Success response
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  // Extract request ID from response headers
  const requestId = response.headers.get('X-Request-ID') || undefined;

  // Try to parse error response
  let errorData: any;
  try {
    errorData = await response.json();
  } catch {
    // If JSON parsing fails, create generic error
    throw new APIError(
      `Request failed with status ${response.status}`,
      response.status,
      undefined,
      requestId
    );
  }

  // Extract error details
  const message = errorData.message || errorData.error || 'An error occurred';
  const code = errorData.code || errorData.error;

  // Handle validation errors specially
  if (errorData.errors && Array.isArray(errorData.errors)) {
    throw new ValidationError(message, errorData.errors);
  }

  // Throw APIError with details
  throw new APIError(message, response.status, code, requestId);
}

/**
 * Handles fetch errors (network issues, etc.)
 */
export function handleFetchError(error: unknown): never {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new NetworkError();
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error('An unexpected error occurred');
}

/**
 * Generic error handler that reports to Sentry
 */
export function handleError(error: Error, context?: Record<string, any>): void {
  console.error('Error:', error);

  // Report to Sentry if it's not a client error
  if (error instanceof APIError) {
    if (error.isServerError()) {
      captureException(error, { ...context, requestId: error.requestId });
    }
  } else {
    captureException(error, context);
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Checks if error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Checks if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Checks if error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

// ============================================================================
// User-Friendly Error Messages
// ============================================================================

/**
 * Converts an error to a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Gets user-friendly error title
 */
export function getErrorTitle(error: unknown): string {
  if (error instanceof APIError) {
    if (error.statusCode === 401) return 'Unauthorized';
    if (error.statusCode === 403) return 'Forbidden';
    if (error.statusCode === 404) return 'Not Found';
    if (error.statusCode === 409) return 'Conflict';
    if (error.statusCode >= 500) return 'Server Error';
    return 'Request Error';
  }

  if (error instanceof ValidationError) {
    return 'Validation Error';
  }

  if (error instanceof NetworkError) {
    return 'Network Error';
  }

  return 'Error';
}
