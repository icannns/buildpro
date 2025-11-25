// Standardized error handler middleware
function errorHandler(err, req, res, next) {
    console.error('[ERROR]', err);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized access';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
    }

    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
}

module.exports = errorHandler;
