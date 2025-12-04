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

    // DEVELOPMENT MODE: Skip authentication for ALL requests
    // TODO: Remove this in production and implement proper authentication
    // For now, allow all operations without token for testing
    console.log('[Auth Middleware] DEVELOPMENT MODE - Allowing request without auth:', req.method, fullPath);
    return next();

    /* PRODUCTION CODE - Uncomment when deploying:
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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
