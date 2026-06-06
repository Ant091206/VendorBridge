/**
 * 404 Not Found Middleware
 * Catches any request that didn't match a registered route.
 * Must be registered after all route definitions in server.js.
 */

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: [${req.method}] ${req.originalUrl}`
  });
};

export default notFound;
