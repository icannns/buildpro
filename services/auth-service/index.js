const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { JWT_SECRET, JWT_EXPIRES_IN, verifyToken } = require('./middleware/auth');
const { registerSchema, loginSchema } = require('./validators/authValidator');
const { ROLES } = require('./config/roles');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[Auth Service] ${req.method} ${req.url}`);
    next();
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Authentication Service',
        status: 'Active',
        version: '1.0.0',
        endpoints: {
            register: 'POST /register',
            login: 'POST /login',
            verify: 'GET /verify',
            me: 'GET /me',
            hashPassword: 'POST /hash-password'
        }
    });
});

// POST /register - Register new user
app.post('/register', async (req, res) => {
    try {
        // Validate input
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const { email, password, name, role } = value;

        // Check if user already exists
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
            [email, passwordHash, name, role || 'VIEWER']
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: result.insertId,
                email,
                name,
                role: role || 'VIEWER'
            }
        });

    } catch (error) {
        console.error('Error in /register:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// POST /login - User login
app.post('/login', async (req, res) => {
    try {
        // Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const { email, password } = value;

        // Find user
        const [users] = await db.execute(
            'SELECT id, email, password_hash, name, role FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Store session (optional, for token revocation)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await db.execute(
            'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, token, expiresAt]
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Error in /login:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// GET /verify - Verify JWT token
app.get('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: req.user
    });
});

// GET /me - Get current user info
app.get('/me', verifyToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Error in /me:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user info',
            error: error.message
        });
    }
});

// POST /logout - Logout (invalidate token)
app.post('/logout', verifyToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // Delete session
        await db.execute('DELETE FROM user_sessions WHERE token = ?', [token]);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Error in /logout:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
});

// POST /hash-password - Utility endpoint to generate bcrypt hash
app.post('/hash-password', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        const hash = await bcrypt.hash(password, 10);

        res.json({
            success: true,
            password,
            hash
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to hash password',
            error: error.message
        });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('==========================================');
    console.log(`🔐 Auth Service running on port ${PORT}`);
    console.log('Endpoints:');
    console.log('   POST /register - Register new user');
    console.log('   POST /login - User login');
    console.log('   GET /verify - Verify token');
    console.log('   GET /me - Get user info');
    console.log('   POST /logout - Logout');
    console.log('   POST /hash-password - Generate bcrypt hash');
    console.log('==========================================');
});
