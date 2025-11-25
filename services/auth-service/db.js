const mysql = require('mysql2');

// Create connection pool for MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'buildpro_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Get promise-based connection
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error connecting to MySQL database:', err.message);
        return;
    }
    console.log('✅ Auth Service connected to MySQL database: buildpro_db');
    connection.release();
});

module.exports = promisePool;
