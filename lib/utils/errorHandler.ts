/**
 * Error Handler Utility
 * Provides functions to format and handle errors consistently across the application
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  fieldErrors?: Record<string, string[]>;
  statusCode?: number;
  originalError?: any;
}

/**
 * Determine error type from HTTP status code
 */
export function getErrorType(statusCode?: number): ErrorType {
  if (!statusCode) return ErrorType.NETWORK;

  if (statusCode === 401) return ErrorType.UNAUTHORIZED;
  if (statusCode === 403) return ErrorType.FORBIDDEN;
  if (statusCode === 404) return ErrorType.NOT_FOUND;
  if (statusCode === 422 || statusCode === 400) return ErrorType.VALIDATION;
  if (statusCode >= 500) return ErrorType.SERVER;

  return ErrorType.UNKNOWN;
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred';

  // String error
  if (typeof error === 'string') return error;

  // Error object with message
  if (error.message) return error.message;

  // API error response
  if (error.error) return error.error;
  if (error.detail) return error.detail;

  // Validation errors
  if (error.non_field_errors && Array.isArray(error.non_field_errors)) {
    return error.non_field_errors[0];
  }

  // Network error - fetch failures
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error: Unable to connect to server. Please check your internet connection and ensure the API server is running.';
  }
  
  // AbortError (timeout)
  if (error.name === 'AbortError') {
    return 'Request timeout: The server took too long to respond.';
  }

  return 'An unexpected error occurred';
}

/**
 * Extract field-specific validation errors
 */
export function extractFieldErrors(error: any): Record<string, string[]> | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const fieldErrors: Record<string, string[]> = {};

  // Django REST Framework format
  Object.keys(error).forEach((key) => {
    if (key !== 'error' && key !== 'detail' && key !== 'non_field_errors') {
      const value = error[key];
      if (Array.isArray(value)) {
        fieldErrors[key] = value;
      } else if (typeof value === 'string') {
        fieldErrors[key] = [value];
      }
    }
  });

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

/**
 * Format error for user display
 */
export function formatError(error: any, statusCode?: number): ErrorDetails {
  const type = getErrorType(statusCode);
  const message = extractErrorMessage(error);
  const fieldErrors = extractFieldErrors(error);

  return {
    type,
    message,
    fieldErrors,
    statusCode,
    originalError: error,
  };
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyMessage(errorDetails: ErrorDetails): string {
  const { type, message } = errorDetails;

  switch (type) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case ErrorType.UNAUTHORIZED:
      return 'Your session has expired. Please log in again.';
    case ErrorType.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorType.VALIDATION:
      return message || 'Please check your input and try again.';
    case ErrorType.SERVER:
      return 'Server error occurred. Please try again later or contact support if the problem persists.';
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(errorDetails: ErrorDetails): boolean {
  return (
    errorDetails.type === ErrorType.NETWORK ||
    errorDetails.type === ErrorType.SERVER ||
    errorDetails.statusCode === 408 || // Request Timeout
    errorDetails.statusCode === 429 // Too Many Requests
  );
}

/**
 * Log error for debugging (can be extended to send to error tracking service)
 */
export function logError(errorDetails: ErrorDetails, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]`, {
      type: errorDetails.type,
      message: errorDetails.message,
      statusCode: errorDetails.statusCode,
      fieldErrors: errorDetails.fieldErrors,
      originalError: errorDetails.originalError,
    });
  }

  // In production, you could send to error tracking service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   errorTrackingService.captureException(errorDetails.originalError, {
  //     tags: { errorType: errorDetails.type },
  //     extra: { context, errorDetails },
  //   });
  // }
}

