import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware to verify JWT token and protect API routes.
 * Expects header format: Authorization: Bearer <token>
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      status: 'error',
      message: 'Access Denied: No Token Provided'
    });
  }

  // Extract the token (split "Bearer <token>")
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(400).json({
      status: 'error',
      message: 'Access Denied: Invalid Authorization Header Format (must be Bearer <token>)'
    });
  }

  const token = tokenParts[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        status: 'error',
        message: 'Internal configuration error: JWT Secret is not configured.'
      });
    }
    const verified = jwt.verify(token, jwtSecret);
    // Attach verified user payload to the request object
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({
      status: 'error',
      message: 'Access Denied: Invalid or Expired Token'
    });
  }
};

/**
 * Middleware to restrict access to authorized roles.
 * Must be used AFTER verifyToken.
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: Access restricted. Required permissions: [${roles.join(', ')}]`
      });
    }
    
    next();
  };
};
