/**
 * Centralized error exports
 * All error classes, utilities, and handlers available from one import
 */

// ============================================================================
// Base Errors
// ============================================================================

export {
  AppError,
  DatabaseError,
  ExternalServiceError,
  ConfigurationError,
  FileSystemError,
  NetworkError,
  TimeoutError,
  isOperationalError,
  isAppError,
  isDatabaseError,
  isExternalServiceError,
} from './base';

// ============================================================================
// HTTP Errors
// ============================================================================

export {
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodNotAllowedError,
  ConflictError,
  GoneError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  NotImplementedError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
} from './http';

// ============================================================================
// Business/Domain Errors
// ============================================================================

export {
  BusinessRuleError,
  BookingError,
  InvalidStateTransitionError,
  BookingAlreadyConfirmedError,
  BookingExpiredError,
  PaymentError,
  PaymentAlreadyProcessedError,
  PaymentFailedError,
  InsufficientFundsError,
  PackageError,
  PackageNotAvailableError,
  PackageQuotaExceededError,
  TenantError,
  TenantNotActiveError,
  TenantQuotaExceededError,
  InvalidTenantKeyError,
  IdempotencyError,
  IdempotencyConflictError,
  AuthError,
  InvalidCredentialsError,
  TokenExpiredError,
  InvalidTokenError,
  InsufficientPermissionsError,
} from './business';

// ============================================================================
// Error Handlers
// ============================================================================

export {
  handlePrismaError,
  handleStripeError,
  handleError,
  withErrorHandling,
} from './handlers';

// ============================================================================
// API Error Responses
// ============================================================================

export {
  type ApiErrorResponse,
  type ApiSuccessResponse,
  createApiError,
  createApiSuccess,
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError,
  internalServerError,
  fieldError,
  validateRequiredFields,
  isErrorResponse,
  isSuccessResponse,
} from './api-errors';

// ============================================================================
// Error Handler Middleware
// ============================================================================

export {
  type ErrorResponse,
  formatErrorResponse,
  enhancedErrorMiddleware,
  asyncHandler,
  isOperationalError as isOperationalErrorUtil,
} from './error-handler';

// ============================================================================
// Request Context
// ============================================================================

export {
  requestIdMiddleware,
  type ContextLogger,
  createLogger,
  getRequestLogger,
  getRequestMetadata,
  timingMiddleware,
} from './request-context';

// ============================================================================
// Sentry Integration
// ============================================================================

export {
  type SentryConfig,
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  isSentryEnabled,
  sentryRequestHandler,
  sentryErrorHandler,
} from './sentry';
