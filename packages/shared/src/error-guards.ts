/**
 * Type guards for safe error handling
 * Use these utilities to safely access error properties in catch blocks
 */

/**
 * API Error structure from fetch/axios responses
 */
export interface ApiError {
  status: number;
  body: unknown;
  message?: string;
}

/**
 * Standard Error with message
 */
export interface ErrorWithMessage {
  message: string;
}

/**
 * Error with status code
 */
export interface ErrorWithStatus {
  status: number;
}

/**
 * Check if error is an API error with status and body
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    'body' in error
  );
}

/**
 * Check if error has a status code property
 */
export function hasStatusCode(error: unknown): error is ErrorWithStatus {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

/**
 * Check if error has a message property
 */
export function hasMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Check if error is a standard Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (hasMessage(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Safely extract status code from error
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (hasStatusCode(error)) {
    return error.status;
  }
  return undefined;
}

/**
 * Check if value is a record/object type
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
