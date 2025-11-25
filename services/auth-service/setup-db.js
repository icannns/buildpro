const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('🔧 Setting up BuildPro database...\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'buildpro_db',
        multipleStatements: true
    });

    try {
        // Read and execute users-schema.sql
        console.log('📝 Creating users and sessions tables...');
        const schemaSQL = fs.readFileSync(
            path.join(__dirname, '..', '..', 'database', 'users-schema.sql'),
            'utf8'
        );
        await connection.query(schemaSQL);
        console.log('✅ Tables created successfully\n');

        // Read and execute seed-users.sql
        console.log('👥 Inserting default users...');
        const seedSQL = fs.readFileSync(
            path.join(__dirname, '..', '..', 'database', 'seed-users.sql'),
            'utf8'
        );
        await connection.query(seedSQL);
        console.log('✅ Users inserted successfully\n');

        // Display users
        const [users] = await connection.query('SELECT id, email, name, role, created_at FROM users');
        console.log('📋 Created users:');
        console.table(users);

        console.log('\n✅ Database setup completed!\n');
        console.log('Default credentials:');
        console.log('  admin@buildpro.com / admin123 (ADMIN)');
        console.log('  pm@buildpro.com / pm123 (PROJECT_MANAGER)');
        console.log('  vendor@buildpro.com / vendor123 (VENDOR)');
        console.log('  viewer@buildpro.com / viewer123 (VIEWER)');

    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

setupDatabase().catch(console.error);
