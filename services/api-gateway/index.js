const express = require('express');
const cors = require('cors');
const axios = require('axios');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Service URLs from Environment Variables (with defaults for local dev)
const SERVICES = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:5005',
    PROJECT: process.env.PROJECT_SERVICE_URL || 'http://localhost:5001',
    MATERIAL: process.env.MATERIAL_SERVICE_URL || 'http://localhost:5002',
    VENDOR: process.env.VENDOR_SERVICE_URL || 'http://localhost:5003',
    PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004'
};

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.url}`);
    next();
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'API Gateway',
        status: 'Active',
        version: '2.0.0',
        routes: SERVICES
    });
});

// Apply authentication middleware to /api routes (except auth endpoints)
app.use('/api', authMiddleware);

// Proxy middleware - catches all /api/ requests
app.use('/api', async (req, res, next) => {
    try {
        let targetUrl;
        let path = req.url; // req.url is already without /api prefix

        // Route to appropriate service
        if (path.startsWith('/auth')) {
            const authPath = path.replace('/auth', '');
            targetUrl = SERVICES.AUTH;
            path = authPath || '/';

            console.log(`[DEBUG] Auth route: original=${req.url}, forwarding to=${targetUrl}${path}`);
        } else if (path.startsWith('/projects')) {
            targetUrl = SERVICES.PROJECT;
        } else if (path.startsWith('/update-progress')) {
            // RBAC: Only ADMIN and PROJECT_MANAGER can update progress
            if (req.user && !['ADMIN', 'PROJECT_MANAGER'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Access Denied: Insufficient permissions' });
            }
            targetUrl = SERVICES.PROJECT;
        } else if (path.startsWith('/materials')) {
            // RBAC for Materials
            if (path.includes('/restock') && req.method === 'POST') {
                // Only ADMIN and PM can restock
                if (req.user && !['ADMIN', 'PROJECT_MANAGER'].includes(req.user.role)) {
                    return res.status(403).json({ success: false, message: 'Access Denied: Only Admin/PM can restock' });
                }
            } else if (path.includes('/update-price') && req.method === 'POST') {
                // VENDOR, ADMIN, PM can update price. VIEWER cannot.
                if (req.user && !['ADMIN', 'PROJECT_MANAGER', 'VENDOR'].includes(req.user.role)) {
                    return res.status(403).json({ success: false, message: 'Access Denied: Insufficient permissions' });
                }
            }
            targetUrl = SERVICES.MATERIAL;
        } else if (path.startsWith('/vendor')) {
            path = path.replace('/vendor', ''); // Remove /vendor prefix for Go service
            targetUrl = SERVICES.VENDOR;
        } else if (path.startsWith('/payments')) {
            // RBAC: VENDOR and VIEWER cannot view payments
            if (req.user && (req.user.role === 'VENDOR' || req.user.role === 'VIEWER')) {
                return res.status(403).json({ success: false, message: 'Access Denied: Insufficient permissions to view payments' });
            }
            targetUrl = SERVICES.PAYMENT;
        } else {
            return next(); // Not found
        }

        console.log(`[DEBUG] Forwarding to: ${targetUrl}${path}`);

        // Forward request with user info if authenticated
        // Clean headers - remove problematic ones
        const headers = { ...req.headers };
        delete headers.host; // Remove host header
        delete headers.connection; // Remove connection header
        delete headers['content-length']; // Let axios calculate this

        if (req.user) {
            headers['x-user-id'] = req.user.id;
            headers['x-user-email'] = req.user.email;
            headers['x-user-role'] = req.user.role;
        }

        // Forward request
        const response = await axios({
            method: req.method,
            url: `${targetUrl}${path}`,
            data: req.body,
            params: req.query,
            headers: {
                'content-type': 'application/json',
                ...headers
            },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error(`[ERROR]`, error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log('==========================================');
    console.log(`🌐 API Gateway running on port ${PORT}`);
    console.log('Version: 2.0.0 (with Authentication)');
    console.log('Routes:', SERVICES);
    console.log('==========================================');
});
