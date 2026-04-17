import { AppError } from './AppError';

export const Errors = {
  unauthorized: (msg = 'Unauthorized', details?: unknown) =>
    new AppError('AUTH_UNAUTHORIZED', msg, 401, details),
  forbidden: (msg = 'Forbidden', details?: unknown) =>
    new AppError('AUTH_FORBIDDEN', msg, 403, details),
  invalid: (msg = 'Validation failed', details?: unknown) =>
    new AppError('VALIDATION_ERROR', msg, 400, details),
  notFound: (msg = 'Not found', details?: unknown) =>
    new AppError('NOT_FOUND', msg, 404, details),
  conflict: (msg = 'Conflict', details?: unknown) =>
    new AppError('CONFLICT', msg, 409, details),
  rateLimited: (msg = 'Too Many Requests', details?: unknown) =>
    new AppError('RATE_LIMITED', msg, 429, details),
  db: (msg = 'Database error', details?: unknown) =>
    new AppError('DB_ERROR', msg, 500, details),
  internal: (msg = 'Internal error', details?: unknown) =>
    new AppError('INTERNAL_ERROR', msg, 500, details),
};
