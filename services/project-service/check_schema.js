const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'buildpro_db'
};

async function checkSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected.');

        const [rows] = await connection.query('DESCRIBE materials');
        console.log('--- MATERIALS TABLE ---');
        console.log(rows.map(r => r.Field).join(', '));

        const [rows2] = await connection.query('DESCRIBE users');
        console.log('--- USERS TABLE ---');
        console.log(rows2.map(r => r.Field).join(', '));

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();
