// Script to generate bcrypt hashed passwords and update seed-users.sql
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const users = [
    { email: 'admin@buildpro.com', password: 'admin123', name: 'Admin User', role: 'ADMIN' },
    { email: 'pm@buildpro.com', password: 'pm123', name: 'Project Manager', role: 'PROJECT_MANAGER' },
    { email: 'vendor@buildpro.com', password: 'vendor123', name: 'Vendor User', role: 'VENDOR' },
    { email: 'viewer@buildpro.com', password: 'viewer123', name: 'Viewer User', role: 'VIEWER' }
];

async function generateSQL() {
    console.log('Generating password hashes...\n');

    const sqlLines = [];
    sqlLines.push('-- BuildPro Default Users');
    sqlLines.push('-- Generated with bcrypt hash\n');
    sqlLines.push('INSERT INTO users (email, password_hash, name, role) VALUES');

    const values = [];
    for (const user of users) {
        const hash = await bcrypt.hash(user.password, 10);
        console.log(`${user.email}:`);
        console.log(`  Password: ${user.password}`);
        console.log(`  Hash: ${hash}\n`);

        values.push(`    ('${user.email}', '${hash}', '${user.name}', '${user.role}')`);
    }

    sqlLines.push(values.join(',\n'));
    sqlLines.push('\nON DUPLICATE KEY UPDATE');
    sqlLines.push('    password_hash = VALUES(password_hash),');
    sqlLines.push('    name = VALUES(name),');
    sqlLines.push('    role = VALUES(role);');
    sqlLines.push('\n-- Display created users');
    sqlLines.push('-- SELECT id, email, name, role, created_at FROM users;');

    const sqlContent = sqlLines.join('\n');

    // Write to seed-users.sql
    const sqlPath = path.join(__dirname, '..', '..', 'database', 'seed-users.sql');
    fs.writeFileSync(sqlPath, sqlContent, 'utf8');

    console.log(`✅ SQL file generated: ${sqlPath}`);
    console.log('\nNext steps:');
    console.log('1. Run: mysql -u root buildpro_db < database/users-schema.sql');
    console.log('2. Run: mysql -u root buildpro_db < database/seed-users.sql');
}

generateSQL().catch(console.error);
