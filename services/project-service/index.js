const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Project Service',
        status: 'Active',
        version: '1.0.0'
    });
});

// GET /projects - Get all projects
app.get('/projects', async (req, res) => {
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

// GET /projects/:id - Get single project
app.get('/projects/:id', async (req, res) => {
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

// POST /projects - Create new project
app.post('/projects', async (req, res) => {
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

// POST /update-progress - Update project progress
app.post('/update-progress', async (req, res) => {
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

        // Create event in queue for worker (Budget Service) to process
        const eventPayload = JSON.stringify({
            project_id: project_id,
            progress: progress,
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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Project Service (Node.js) running on port ${PORT}`);
});
