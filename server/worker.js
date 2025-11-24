const db = require('./db');

console.log('==========================================');
console.log('🔄 BuildPro Event Queue Worker Started');
console.log('==========================================');
console.log('⏰ Processing events every 5 seconds...\n');

// Process event queue
async function processEventQueue() {
    try {
        // Get pending events from queue
        const [pendingEvents] = await db.execute(
            'SELECT * FROM event_queue WHERE status = ? ORDER BY created_at ASC',
            ['PENDING']
        );

        if (pendingEvents.length === 0) {
            console.log(`[${new Date().toLocaleTimeString()}] No pending events`);
            return;
        }

        console.log(`[${new Date().toLocaleTimeString()}] Found ${pendingEvents.length} pending event(s)`);

        // Process each event
        for (const event of pendingEvents) {
            try {
                console.log(`  Processing event #${event.id} - Type: ${event.event_type}`);

                // Parse payload
                const payload = typeof event.payload === 'string'
                    ? JSON.parse(event.payload)
                    : event.payload;

                // Handle different event types
                if (event.event_type === 'PROGRESS_UPDATE') {
                    // Insert new payment termin based on progress update
                    const [result] = await db.execute(`
            INSERT INTO payments (project_id, termin_number, termin_name, amount, status, date)
            VALUES (?, ?, ?, ?, ?, NOW())
          `, [
                        payload.project_id || 1,
                        payload.termin_number || 7,
                        'Termin Progress Update',
                        payload.amount || 50000000,
                        'Pending',
                    ]);

                    console.log(`    ✅ Created payment record #${result.insertId}`);
                }

                // Update event status to PROCESSED
                await db.execute(
                    'UPDATE event_queue SET status = ?, processed_at = NOW() WHERE id = ?',
                    ['PROCESSED', event.id]
                );

                console.log(`    ✅ Event #${event.id} marked as PROCESSED`);

            } catch (err) {
                console.error(`    ❌ Error processing event #${event.id}:`, err.message);

                // Mark as FAILED
                await db.execute(
                    'UPDATE event_queue SET status = ? WHERE id = ?',
                    ['FAILED', event.id]
                );
            }
        }

    } catch (error) {
        console.error('❌ Error in processEventQueue:', error.message);
    }
}

// Run worker every 5 seconds
setInterval(processEventQueue, 5000);

// Run once immediately on startup
processEventQueue();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n==========================================');
    console.log('🛑 Worker shutting down...');
    console.log('==========================================');
    process.exit(0);
});
