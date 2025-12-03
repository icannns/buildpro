const bcrypt = require('bcryptjs');
const fs = require('fs');

const password = '123456';

console.log('\nGenerating hash for password: 123456...\n');

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('✅ Hash generated!');
    console.log('Hash:', hash);

    // Save SQL to file
    const sql = `-- Update all user passwords to: 123456
-- Generated hash using bcryptjs (same as Auth Service)

UPDATE users SET password_hash = '${hash}';

SELECT 'All passwords updated to: 123456' as message;
`;

    fs.writeFileSync('../../database/set-password-123456.sql', sql);
    console.log('\n✅ SQL file created: database/set-password-123456.sql');
    console.log('\nRun this SQL in phpMyAdmin to set all passwords to 123456');
});
