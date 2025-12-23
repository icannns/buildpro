const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;
const BUDGET_SERVICE_URL = process.env.BUDGET_SERVICE_URL || 'http://budget-service:5001';

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
        const {
            name, progress, status, location, contractor, budget, start_date, end_date,
            project_type, project_manager, current_phase, planned_progress
        } = req.body;

        // Auto-calculate planned_progress if not provided
        let calculatedPlannedProgress = planned_progress || 0;
        if (!planned_progress && start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            const today = new Date();
            const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
            const daysPassed = (today - startDate) / (1000 * 60 * 60 * 24);
            calculatedPlannedProgress = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
        }

        const [result] = await db.execute(`
      INSERT INTO projects (
        name, progress, status, location, contractor, budget, start_date, end_date,
        project_type, project_manager, current_phase, planned_progress
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            name,
            progress || 0,
            status || 'Active',
            location,
            contractor,
            budget,
            start_date,
            end_date,
            project_type || 'Konstruksi Baru',
            project_manager,
            current_phase || 'Perencanaan',
            calculatedPlannedProgress
        ]);

        // AUTOMATICALLY CREATE PAYMENT TERMS
        const projectId = result.insertId;
        const projectBudget = parseFloat(budget);

        // Default Terms: DP (20%), Termin 1 (30%), Termin 2 (40%), Retensi (10%)
        const terms = [
            { name: 'Down Payment (DP)', pct: 20, trigger: 0, due: 'NOW' },
            { name: 'Termin 1 (Pondasi)', pct: 30, trigger: 25, due: 'LATER' },
            { name: 'Termin 2 (Struktur)', pct: 40, trigger: 75, due: 'LATER' },
            { name: 'Retensi (Serah Terima)', pct: 10, trigger: 100, due: 'LATER' }
        ];

        for (const term of terms) {
            const amount = (projectBudget * term.pct) / 100;
            let status = 'PENDING';
            let dueDate = new Date(); // Default NOW

            if (term.due === 'LATER') {
                // Estimate due date (just for placeholder, e.g., +1 month per term step)
                dueDate.setMonth(dueDate.getMonth() + (term.trigger / 25));
            }

            await db.execute(`
                INSERT INTO payment_terms (project_id, termin_name, amount, status, due_date, milestone_percentage)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [projectId, term.name, amount, status, dueDate, term.trigger]);
        }

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

// PUT /projects/:id - Update project
app.put('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, location, contractor, budget, start_date, end_date,
            project_type, project_manager, current_phase, planned_progress
        } = req.body;

        // Check if project exists
        const [existing] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Update project
        await db.execute(`
            UPDATE projects 
            SET name = ?, location = ?, contractor = ?, budget = ?, start_date = ?, end_date = ?,
                project_type = ?,
                project_manager = ?,
                current_phase = ?,
                planned_progress = ?
            WHERE id = ?
        `, [
            name, location, contractor, budget, start_date, end_date,
            project_type || 'Konstruksi Baru',
            project_manager,
            current_phase || 'Perencanaan',
            planned_progress || 0,
            id
        ]);

        // Get updated project
        const [updated] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating project',
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

        // Auto-update current_phase based on progress
        let currentPhase = 'Perencanaan';
        if (progress > 0 && progress <= 20) currentPhase = 'Fondasi';
        else if (progress > 20 && progress <= 60) currentPhase = 'Struktur';
        else if (progress > 60 && progress < 100) currentPhase = 'Finishing';
        else if (progress >= 100) currentPhase = 'Selesai';

        // Update project progress and phase
        const [updateResult] = await db.execute(
            'UPDATE projects SET progress = ?, current_phase = ? WHERE id = ?',
            [progress, currentPhase, project_id]
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

        // Update progress history for S-Curve
        const today = new Date().toISOString().split('T')[0];
        await db.execute(`
            INSERT INTO progress_history (project_id, record_date, actual_progress, notes)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE actual_progress = ?, notes = ?
        `, [project_id, today, progress, 'Manual progress update', progress, 'Manual progress update']);

        // EAI: Trigger Budget Service to process milestone
        try {
            const budgetResponse = await axios.post(
                `${BUDGET_SERVICE_URL}/payments/process-milestone`,
                { project_id, progress }
            );
            console.log(`✅ [EAI] Milestone processed: ${budgetResponse.data.triggered_count} payment(s) triggered`);
        } catch (error) {
            console.error('⚠️ [EAI] Failed to process milestone:', error.message);
            // Don't block progress update if Budget Service fails
        }

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

// =====================================================
// DAILY LOGS ENDPOINTS
// =====================================================

// GET /daily-logs/:project_id - Get all daily logs for a project
app.get('/daily-logs/:project_id', async (req, res) => {
    try {
        const { project_id } = req.params;

        const [rows] = await db.execute(`
            SELECT * FROM daily_logs 
            WHERE project_id = ? 
            ORDER BY log_date DESC
        `, [project_id]);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching daily logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily logs',
            error: error.message
        });
    }
});

// GET /daily-logs/detail/:id - Get single daily log
app.get('/daily-logs/detail/:id', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM daily_logs WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Daily log not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching daily log:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily log',
            error: error.message
        });
    }
});

// POST /daily-logs - Create new daily log
app.post('/daily-logs', async (req, res) => {
    try {
        console.log('[DEBUG] POST /daily-logs received:', req.body);
        const { project_id, log_date, description, progress_added, worker_name, notes } = req.body;

        // Validate required fields
        if (!project_id || !log_date || !description) {
            return res.status(400).json({
                success: false,
                message: 'project_id, log_date, and description are required'
            });
        }

        // Verify project exists
        const [projectRows] = await db.execute('SELECT * FROM projects WHERE id = ?', [project_id]);
        if (projectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Insert daily log
        const [result] = await db.execute(`
            INSERT INTO daily_logs (project_id, log_date, description, progress_added, worker_name, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [project_id, log_date, description, progress_added || 0, worker_name, notes]);

        // Calculate new total progress by summing all progress_added
        const [progressSum] = await db.execute(`
            SELECT COALESCE(SUM(progress_added), 0) as total_progress 
            FROM daily_logs 
            WHERE project_id = ?
        `, [project_id]);

        const newProgress = Math.min(progressSum[0].total_progress, 100); // Cap at 100%

        // Update project progress
        await db.execute('UPDATE projects SET progress = ? WHERE id = ?', [newProgress, project_id]);

        // Update progress history
        await db.execute(`
            INSERT INTO progress_history (project_id, record_date, actual_progress, notes)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE actual_progress = ?, notes = ?
        `, [project_id, log_date, newProgress, description, newProgress, description]);

        // Trigger event for milestone check
        const eventPayload = JSON.stringify({
            project_id: project_id,
            progress: newProgress,
            timestamp: new Date().toISOString()
        });

        await db.execute(
            'INSERT INTO event_queue (event_type, payload, status) VALUES (?, ?, ?)',
            ['PROGRESS_UPDATE', eventPayload, 'PENDING']
        );

        // EAI: Trigger Budget Service to process milestone
        try {
            const budgetResponse = await axios.post(
                `${BUDGET_SERVICE_URL}/payments/process-milestone`,
                { project_id, progress: newProgress }
            );
            console.log(`✅ [EAI] Milestone processed: ${budgetResponse.data.triggered_count} payment(s) triggered`);
        } catch (error) {
            console.error('⚠️ [EAI] Failed to process milestone:', error.message);
        }

        // Get created log
        const [createdLog] = await db.execute('SELECT * FROM daily_logs WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Daily log created successfully',
            data: createdLog[0],
            new_project_progress: newProgress
        });

    } catch (error) {
        console.error('Error creating daily log:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating daily log',
            error: error.message
        });
    }
});

// PUT /daily-logs/:id - Update daily log
app.put('/daily-logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { log_date, description, progress_added, worker_name, notes } = req.body;

        // Check if log exists
        const [existing] = await db.execute('SELECT * FROM daily_logs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Daily log not found'
            });
        }

        const project_id = existing[0].project_id;

        // Update daily log
        await db.execute(`
            UPDATE daily_logs 
            SET log_date = ?, description = ?, progress_added = ?, worker_name = ?, notes = ?
            WHERE id = ?
        `, [
            log_date || existing[0].log_date,
            description || existing[0].description,
            progress_added !== undefined ? progress_added : existing[0].progress_added,
            worker_name || existing[0].worker_name,
            notes !== undefined ? notes : existing[0].notes,
            id
        ]);

        // Recalculate project progress
        const [progressSum] = await db.execute(`
            SELECT COALESCE(SUM(progress_added), 0) as total_progress 
            FROM daily_logs 
            WHERE project_id = ?
        `, [project_id]);

        const newProgress = Math.min(progressSum[0].total_progress, 100);
        await db.execute('UPDATE projects SET progress = ? WHERE id = ?', [newProgress, project_id]);

        // Get updated log
        const [updatedLog] = await db.execute('SELECT * FROM daily_logs WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Daily log updated successfully',
            data: updatedLog[0],
            new_project_progress: newProgress
        });

    } catch (error) {
        console.error('Error updating daily log:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating daily log',
            error: error.message
        });
    }
});

// DELETE /daily-logs/:id - Delete daily log
app.delete('/daily-logs/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get log info before deleting
        const [existing] = await db.execute('SELECT * FROM daily_logs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Daily log not found'
            });
        }

        const project_id = existing[0].project_id;

        // Delete log
        await db.execute('DELETE FROM daily_logs WHERE id = ?', [id]);

        // Recalculate project progress
        const [progressSum] = await db.execute(`
            SELECT COALESCE(SUM(progress_added), 0) as total_progress 
            FROM daily_logs 
            WHERE project_id = ?
        `, [project_id]);

        const newProgress = Math.min(progressSum[0].total_progress, 100);
        await db.execute('UPDATE projects SET progress = ? WHERE id = ?', [newProgress, project_id]);

        res.json({
            success: true,
            message: 'Daily log deleted successfully',
            new_project_progress: newProgress
        });

    } catch (error) {
        console.error('Error deleting daily log:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting daily log',
            error: error.message
        });
    }
});

// =====================================================
// PROGRESS HISTORY / S-CURVE ENDPOINTS
// =====================================================

// GET /progress-history/:project_id - Get progress history for S-Curve
app.get('/progress-history/:project_id', async (req, res) => {
    try {
        const { project_id } = req.params;

        const [rows] = await db.execute(`
            SELECT 
                record_date,
                planned_progress,
                actual_progress,
                notes
            FROM progress_history
            WHERE project_id = ?
            ORDER BY record_date ASC
        `, [project_id]);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching progress history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching progress history',
            error: error.message
        });
    }
});

// POST /progress-history - Add/Update progress history entry
app.post('/progress-history', async (req, res) => {
    try {
        const { project_id, record_date, planned_progress, actual_progress, notes } = req.body;

        if (!project_id || !record_date) {
            return res.status(400).json({
                success: false,
                message: 'project_id and record_date are required'
            });
        }

        await db.execute(`
            INSERT INTO progress_history (project_id, record_date, planned_progress, actual_progress, notes)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                planned_progress = ?,
                actual_progress = ?,
                notes = ?
        `, [
            project_id,
            record_date,
            planned_progress || 0,
            actual_progress || 0,
            notes,
            planned_progress || 0,
            actual_progress || 0,
            notes
        ]);

        const [result] = await db.execute(`
            SELECT * FROM progress_history 
            WHERE project_id = ? AND record_date = ?
        `, [project_id, record_date]);

        res.status(201).json({
            success: true,
            message: 'Progress history updated successfully',
            data: result[0]
        });

    } catch (error) {
        console.error('Error updating progress history:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating progress history',
            error: error.message
        });
    }
});

// =====================================================
// BUDGET SUMMARY ENDPOINT
// =====================================================

// GET /projects/:id/budget-summary - Get budget summary for a project
app.get('/projects/:id/budget-summary', async (req, res) => {
    try {
        const { id } = req.params;

        // Get project budget
        const [projectRows] = await db.execute('SELECT budget FROM projects WHERE id = ?', [id]);
        if (projectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const totalBudget = parseFloat(projectRows[0].budget || 0);

        // Get paid amount from payment_terms
        const [paymentRows] = await db.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paid_amount,
                COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_amount
            FROM payment_terms
            WHERE project_id = ?
        `, [id]);

        const paidAmount = parseFloat(paymentRows[0].paid_amount || 0);
        const pendingAmount = parseFloat(paymentRows[0].pending_amount || 0);
        const remainingBudget = totalBudget - paidAmount;

        res.json({
            success: true,
            data: {
                total_budget: totalBudget,
                used_budget: paidAmount,
                pending_budget: pendingAmount,
                remaining_budget: remainingBudget,
                percentage_used: totalBudget > 0 ? Math.round((paidAmount / totalBudget) * 100) : 0
            }
        });

    } catch (error) {
        console.error('Error fetching budget summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching budget summary',
            error: error.message
        });
    }
});

// =====================================================
// TIMELINE NOTES ENDPOINTS
// =====================================================

// GET /timeline-notes/:project_id - Get all timeline notes for a project
app.get('/timeline-notes/:project_id', async (req, res) => {
    try {
        const { project_id } = req.params;

        const [rows] = await db.execute(`
            SELECT * FROM timeline_notes
            WHERE project_id = ?
            ORDER BY note_date DESC
        `, [project_id]);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching timeline notes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching timeline notes',
            error: error.message
        });
    }
});

// POST /timeline-notes - Add new timeline note
app.post('/timeline-notes', async (req, res) => {
    try {
        const { project_id, note_date, phase, milestone, note, note_type } = req.body;

        if (!project_id || !note_date) {
            return res.status(400).json({
                success: false,
                message: 'project_id and note_date are required'
            });
        }

        // Verify project exists
        const [projectRows] = await db.execute('SELECT * FROM projects WHERE id = ?', [project_id]);
        if (projectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const [result] = await db.execute(`
            INSERT INTO timeline_notes (project_id, note_date, phase, milestone, note, note_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [project_id, note_date, phase, milestone, note, note_type || 'info']);

        const [createdNote] = await db.execute('SELECT * FROM timeline_notes WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Timeline note created successfully',
            data: createdNote[0]
        });

    } catch (error) {
        console.error('Error creating timeline note:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating timeline note',
            error: error.message
        });
    }
});

// PUT /timeline-notes/:id - Update timeline note
app.put('/timeline-notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { note_date, phase, milestone, note, note_type } = req.body;

        const [existing] = await db.execute('SELECT * FROM timeline_notes WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Timeline note not found'
            });
        }

        await db.execute(`
            UPDATE timeline_notes
            SET note_date = ?, phase = ?, milestone = ?, note = ?, note_type = ?
            WHERE id = ?
        `, [
            note_date || existing[0].note_date,
            phase || existing[0].phase,
            milestone || existing[0].milestone,
            note || existing[0].note,
            note_type || existing[0].note_type,
            id
        ]);

        const [updated] = await db.execute('SELECT * FROM timeline_notes WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Timeline note updated successfully',
            data: updated[0]
        });

    } catch (error) {
        console.error('Error updating timeline note:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating timeline note',
            error: error.message
        });
    }
});

// DELETE /timeline-notes/:id - Delete timeline note
app.delete('/timeline-notes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT * FROM timeline_notes WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Timeline note not found'
            });
        }

        await db.execute('DELETE FROM timeline_notes WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Timeline note deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting timeline note:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting timeline note',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Project Service (Node.js) running on port ${PORT}`);
});
