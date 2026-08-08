/**
 * Common constants for the application
 */

export const APP_CONSTANTS = {
  API_VERSION: 'v1',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SESSION_TIMEOUT_MINUTES: 30,
  PASSWORD_MIN_LENGTH: 8,
  BCRYPT_COST_FACTOR: 10,
} as const;

export const HTTP_STATUS_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  BAD_REQUEST: 'Invalid request parameters',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
} as const;
