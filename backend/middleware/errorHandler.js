/**
 * Global Error Handler Middleware
 * Catches all errors passed via next(err) in Express routes.
 * Returns consistent JSON error responses with appropriate HTTP status codes.
 */

const errorHandler = (err, req, res, next) => {
  // Default to 500 if no statusCode set on error
  let statusCode = err.statusCode || err.status || 500;

  // Map common error types to correct status codes
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'UnauthorizedError') statusCode = 401;
  if (err.name === 'JsonWebTokenError') statusCode = 401;
  if (err.name === 'TokenExpiredError') statusCode = 401;
  if (err.name === 'ForbiddenError') statusCode = 403;
  if (err.name === 'NotFoundError') statusCode = 404;

  // Build response body
  const response = {
    success: false,
    message: err.message || 'An unexpected error occurred on the server.'
  };

  // Attach stack trace in development mode only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Log errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${req.method} ${req.path} — ${statusCode}: ${err.message}`);
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
