const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'buildpro-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Verify JWT token middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
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
}

// Require specific role middleware
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
}

// Require specific permission middleware
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { hasPermission } = require('../config/roles');

        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                required: permission,
                role: req.user.role
            });
        }

        next();
    };
}

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    verifyToken,
    requireRole,
    requirePermission
};
