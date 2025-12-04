const express = require('express');
const cors = require('cors');
const axios = require('axios');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Service URLs from Environment Variables (with defaults for local dev)
const SERVICES = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:5004',
    PROJECT: process.env.PROJECT_SERVICE_URL || 'http://localhost:5003',
    MATERIAL: process.env.MATERIAL_SERVICE_URL || 'http://localhost:5002',
    VENDOR: process.env.VENDOR_SERVICE_URL || 'http://localhost:5005',
    PAYMENT: process.env.BUDGET_SERVICE_URL || 'http://localhost:5001'  // Budget service for payments
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
        }
        // PROJECT SERVICE ROUTES
        else if (path.startsWith('/projects')) {
            targetUrl = SERVICES.PROJECT;
        } else if (path.startsWith('/daily-logs')) {
            // RBAC: ADMIN and WORKER can manage daily logs
            if (req.method !== 'GET' && req.user && !['ADMIN', 'WORKER'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Access Denied: Only Admin/Worker can manage daily logs' });
            }
            targetUrl = SERVICES.PROJECT;
        } else if (path.startsWith('/progress-history')) {
            targetUrl = SERVICES.PROJECT;
        } else if (path.startsWith('/update-progress')) {
            // RBAC: Only ADMIN and WORKER can update progress
            if (req.user && !['ADMIN', 'WORKER'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Access Denied: Insufficient permissions' });
            }
            targetUrl = SERVICES.PROJECT;
        }
        // MATERIAL SERVICE ROUTES
        else if (path.startsWith('/materials')) {
            // RBAC for Materials
            if (path.includes('/restock') && req.method === 'POST') {
                // Only ADMIN and STAFF_LOGISTIC can restock
                if (req.user && !['ADMIN', 'STAFF_LOGISTIC'].includes(req.user.role)) {
                    return res.status(403).json({ success: false, message: 'Access Denied: Only Admin/Staff Logistic can restock' });
                }
            } else if (path.includes('/usage') && req.method === 'POST') {
                // ADMIN and STAFF_LOGISTIC can record usage
                if (req.user && !['ADMIN', 'STAFF_LOGISTIC', 'WORKER'].includes(req.user.role)) {
                    return res.status(403).json({ success: false, message: 'Access Denied: Insufficient permissions' });
                }
            }
            targetUrl = SERVICES.MATERIAL;
        } else if (path.startsWith('/purchase-orders')) {
            // RBAC: Only ADMIN and STAFF_LOGISTIC can manage POs
            if (req.method !== 'GET' && req.user && !['ADMIN', 'STAFF_LOGISTIC'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Access Denied: Only Admin/Staff Logistic can manage purchase orders' });
            }
            targetUrl = SERVICES.MATERIAL;
        }
        // VENDOR SERVICE ROUTES
        else if (path.startsWith('/vendors')) {
            // RBAC: 
            // - VENDOR can POST/PUT to /vendors/:id/materials (their own materials)
            // - ADMIN and STAFF_LOGISTIC can do everything
            // - Everyone can GET
            if (req.method !== 'GET') {
                const isVendorMaterialRoute = path.match(/\/vendors\/\d+\/materials/);
                const allowedRoles = ['ADMIN', 'STAFF_LOGISTIC'];

                // Allow VENDOR to manage their own materials
                if (isVendorMaterialRoute) {
                    allowedRoles.push('VENDOR');
                }

                if (req.user && !allowedRoles.includes(req.user.role)) {
                    return res.status(403).json({ success: false, message: 'Access Denied: Insufficient permissions' });
                }
            }
            targetUrl = SERVICES.VENDOR;
        } else if (path.startsWith('/vendor-materials')) {
            // VENDOR can update their materials, others can view
            targetUrl = SERVICES.VENDOR;
        }
        // BUDGET/PAYMENT SERVICE ROUTES
        else if (path.startsWith('/payment-terms')) {
            // Special check for payment confirmation: /payment-terms/:id/pay
            if (path.match(/\/payment-terms\/\d+\/pay/)) {
                if (req.user && !['ADMIN', 'MANAGER'].includes(req.user.role)) {
                    return res.status(403).json({ success: false, message: 'Access Denied: Only ADMIN or MANAGER can confirm payments' });
                }
            }

            // RBAC: VENDOR cannot view/manage payment terms
            if (req.user && req.user.role === 'VENDOR') {
                return res.status(403).json({ success: false, message: 'Access Denied: Vendors cannot access payment terms' });
            }
            targetUrl = SERVICES.PAYMENT;
        } else if (path.startsWith('/budget')) {
            // RBAC: VENDOR cannot view budget
            if (req.user && req.user.role === 'VENDOR') {
                return res.status(403).json({ success: false, message: 'Access Denied: Vendors cannot access budget information' });
            }
            targetUrl = SERVICES.PAYMENT;
        } else if (path.startsWith('/payments')) {
            // RBAC: VENDOR cannot view payments
            if (req.user && req.user.role === 'VENDOR') {
                return res.status(403).json({ success: false, message: 'Access Denied: Vendors cannot access payments' });
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
