const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token is required' 
    });
  }

  // Keep default secret consistent with AuthController
  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware kiểm tra role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Middleware chỉ cho phép admin
 */
const requireAdmin = requireRole(['admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  // Allow requests to proceed without a token while still decoding if provided
  optionalAuthenticateToken: (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return next();
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) return next();
      const token = parts[1];
  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
        if (!err && user) {
          req.user = user;
        }
        return next();
      });
    } catch {
      return next();
    }
  }
};