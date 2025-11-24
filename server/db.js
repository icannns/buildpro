const mysql = require('mysql2');

// Create connection pool for efficient database connections
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'buildpro_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Get promise-based connection
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL database: buildpro_db');
    connection.release();
});

module.exports = promisePool;
