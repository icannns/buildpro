const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'BuildPro API Server',
        version: '1.0.0',
        endpoints: {
            projects: '/api/projects',
            materials: '/api/materials',
            payments: '/api/payments'
        }
    });
});

// ============================================
// API ENDPOINTS
// ============================================

// GET /api/projects - Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM projects');
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: error.message
        });
    }
});

// GET /api/projects/:id - Get single project
app.get('/api/projects/:id', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching project',
            error: error.message
        });
    }
});

// GET /api/materials - Get all materials
app.get('/api/materials', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM materials ORDER BY name');

        // Calculate statistics
        const totalSKU = rows.length;
        const totalAssets = rows.reduce((sum, item) => sum + (item.stock * item.price), 0);
        const lowStockCount = rows.filter(item => item.status === 'Low Stock' || item.stock < 10).length;

        res.json({
            success: true,
            count: rows.length,
            statistics: {
                totalSKU,
                totalAssets,
                lowStockCount
            },
            data: rows
        });
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching materials',
            error: error.message
        });
    }
});

// GET /api/materials/:id - Get single material
app.get('/api/materials/:id', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM materials WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching material:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching material',
            error: error.message
        });
    }
});

// GET /api/payments - Get all payments
app.get('/api/payments', async (req, res) => {
    try {
        const { project_id } = req.query;

        let query = `
      SELECT p.*, pr.name as project_name 
      FROM payments p
      LEFT JOIN projects pr ON p.project_id = pr.id
    `;
        let params = [];

        if (project_id) {
            query += ' WHERE p.project_id = ?';
            params.push(project_id);
        }

        query += ' ORDER BY p.termin_number';

        const [rows] = await db.execute(query, params);

        // Calculate payment summary
        const totalContract = rows.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const paidAmount = rows
            .filter(item => item.status === 'Paid')
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const pendingAmount = rows
            .filter(item => item.status === 'Pending')
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const unpaidAmount = rows
            .filter(item => item.status === 'Unpaid')
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);

        res.json({
            success: true,
            count: rows.length,
            summary: {
                totalContract,
                paidAmount,
                pendingAmount,
                unpaidAmount,
                remainingBudget: totalContract - paidAmount,
                percentageUsed: totalContract > 0 ? ((paidAmount / totalContract) * 100).toFixed(2) : 0
            },
            data: rows
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
});

// GET /api/payments/:id - Get single payment
app.get('/api/payments/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(`
      SELECT p.*, pr.name as project_name 
      FROM payments p
      LEFT JOIN projects pr ON p.project_id = pr.id
      WHERE p.id = ?
    `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment',
            error: error.message
        });
    }
});

// POST /api/projects - Create new project (bonus endpoint)
app.post('/api/projects', async (req, res) => {
    try {
        const { name, progress, status, location, contractor, budget, start_date, deadline } = req.body;

        const [result] = await db.execute(`
      INSERT INTO projects (name, progress, status, location, contractor, budget, start_date, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, progress || 0, status || 'Active', location, contractor, budget, start_date, deadline]);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                id: result.insertId,
                name,
                progress,
                status
            }
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating project',
            error: error.message
        });
    }
});

// POST /api/update-progress - Update project progress
app.post('/api/update-progress', async (req, res) => {
    try {
        const { project_id, progress } = req.body;

        // Validate input
        if (!project_id || progress === undefined) {
            return res.status(400).json({
                success: false,
                message: 'project_id and progress are required'
            });
        }

        if (progress < 0 || progress > 100) {
            return res.status(400).json({
                success: false,
                message: 'Progress must be between 0 and 100'
            });
        }

        // Update project progress
        const [updateResult] = await db.execute(
            'UPDATE projects SET progress = ? WHERE id = ?',
            [progress, project_id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Create event in queue for worker to process
        const eventPayload = JSON.stringify({
            project_id: project_id,
            progress: progress,
            termin_number: 7,
            amount: 50000000,
            timestamp: new Date().toISOString()
        });

        await db.execute(
            'INSERT INTO event_queue (event_type, payload, status) VALUES (?, ?, ?)',
            ['PROGRESS_UPDATE', eventPayload, 'PENDING']
        );

        // Get updated project
        const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [project_id]);

        res.json({
            success: true,
            message: 'Progress updated successfully',
            data: rows[0]
        });

    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating progress',
            error: error.message
        });
    }
});


// POST /api/materials/restock - Restock material
app.post('/api/materials/restock', async (req, res) => {
    try {
        const { id, qty } = req.body;

        // Validate input
        if (!id || qty === undefined) {
            return res.status(400).json({
                success: false,
                message: 'id and qty are required'
            });
        }

        if (qty < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be positive'
            });
        }

        // Get current stock
        const [current] = await db.execute('SELECT stock, name FROM materials WHERE id = ?', [id]);

        if (current.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        const newStock = current[0].stock + parseInt(qty);

        // Update stock and status
        const newStatus = newStock >= 10 ? 'In Stock' : 'Low Stock';

        await db.execute(
            'UPDATE materials SET stock = ?, status = ? WHERE id = ?',
            [newStock, newStatus, id]
        );

        // Get updated material
        const [updated] = await db.execute('SELECT * FROM materials WHERE id = ?', [id]);

        res.json({
            success: true,
            message: `${qty} ${current[0].name} successfully restocked`,
            data: updated[0]
        });

    } catch (error) {
        console.error('Error restocking material:', error);
        res.status(500).json({
            success: false,
            message: 'Error restocking material',
            error: error.message
        });
    }
});

// POST /api/materials/update-price - Update material price (Vendor simulation)
app.post('/api/materials/update-price', async (req, res) => {
    try {
        const { id, new_price } = req.body;

        // Validate input
        if (!id || new_price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'id and new_price are required'
            });
        }

        if (new_price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be positive'
            });
        }

        // Get material info
        const [current] = await db.execute('SELECT name FROM materials WHERE id = ?', [id]);

        if (current.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Update price
        await db.execute(
            'UPDATE materials SET price = ? WHERE id = ?',
            [new_price, id]
        );

        // Get updated material
        const [updated] = await db.execute('SELECT * FROM materials WHERE id = ?', [id]);

        res.json({
            success: true,
            message: `Price for ${current[0].name} updated by vendor`,
            data: updated[0]
        });

    } catch (error) {
        console.error('Error updating price:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating price',
            error: error.message
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🚀 BuildPro API Server is running!');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log('==========================================');
    console.log('Available endpoints:');
    console.log(`  GET  http://localhost:${PORT}/api/projects`);
    console.log(`  GET  http://localhost:${PORT}/api/materials`);
    console.log(`  GET  http://localhost:${PORT}/api/payments`);
    console.log('==========================================\n');
});
