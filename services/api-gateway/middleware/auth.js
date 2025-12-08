const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'buildpro-secret-key-change-in-production';

// Middleware to verify JWT token
function authMiddleware(req, res, next) {
    // Skip authentication for auth endpoints
    // Check full path including /api prefix
    const fullPath = req.originalUrl || req.url;

    if (fullPath.startsWith('/api/auth/')) {
        console.log('[Auth Middleware] Skipping auth for public endpoint:', fullPath);
        return next();
    }

    // Extract token and decode user info
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // DEVELOPMENT MODE: Still decode token to get user info
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded; // Attach user info to request
            console.log('[Auth Middleware] User authenticated:', req.user.email, 'Role:', req.user.role);
        } catch (error) {
            console.warn('[Auth Middleware] Invalid token, but allowing in dev mode:', error.message);
            // In dev mode, we still allow the request but without user info
        }
    } else {
        console.warn('[Auth Middleware] No token provided');
    }

    next();

    /* PRODUCTION CODE - Replace above with strict auth:
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required. Please login.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message
        });
    }
    */
}

module.exports = authMiddleware;
