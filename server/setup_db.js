const pool = require('./db');
const bcrypt = require('bcrypt');

async function setupDatabase() {
    console.log('🔧 BuildPro Database Setup & Seeding Tool\n');
    console.log('=========================================\n');

    let connection;
    try {
        connection = await pool.getConnection();

        // ========================================
        // STEP 1: DROP TABLES (Clean Slate)
        // ========================================
        console.log('🗑️  Step 1: Dropping existing tables...');

        // Disable foreign key checks temporarily
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Drop in reverse order of dependencies
        await connection.query('DROP TABLE IF EXISTS daily_logs');
        await connection.query('DROP TABLE IF EXISTS finance');
        await connection.query('DROP TABLE IF EXISTS payment_terms');
        await connection.query('DROP TABLE IF EXISTS material_usage');
        await connection.query('DROP TABLE IF EXISTS purchase_orders');
        await connection.query('DROP TABLE IF EXISTS vendor_materials');
        await connection.query('DROP TABLE IF EXISTS vendors');
        await connection.query('DROP TABLE IF EXISTS progress_history');
        await connection.query('DROP TABLE IF EXISTS event_queue');
        await connection.query('DROP TABLE IF EXISTS materials');
        await connection.query('DROP TABLE IF EXISTS projects');
        await connection.query('DROP TABLE IF EXISTS user_sessions');
        await connection.query('DROP TABLE IF EXISTS users');

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('   ✅ All old tables dropped successfully\n');

        // ========================================
        // STEP 2: CREATE TABLES
        // ========================================
        console.log('📋 Step 2: Creating new tables...\n');

        // 2.1 Create users table
        console.log('   Creating users table...');
        await connection.query(`
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'WORKER' COMMENT 'ADMIN, WORKER, VENDOR, STAFF_LOGISTIC',
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_role (role),
                INDEX idx_email (email)
            )
        `);

        // 2.2 Create projects table
        console.log('   Creating projects table...');
        await connection.query(`
            CREATE TABLE projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                budget DECIMAL(15,2) DEFAULT 0,
                start_date DATE,
                end_date DATE,
                progress DECIMAL(5,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2.3 Create materials table
        console.log('   Creating materials table...');
        await connection.query(`
            CREATE TABLE materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                stock INT DEFAULT 0,
                unit VARCHAR(50),
                price DECIMAL(15,2) DEFAULT 0,
                category VARCHAR(100) DEFAULT 'General',
                status VARCHAR(50) DEFAULT 'In Stock',
                min_stock INT DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2.4 Create daily_logs table
        console.log('   Creating daily_logs table...');
        await connection.query(`
            CREATE TABLE daily_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                date DATE NOT NULL,
                description TEXT NOT NULL,
                worker_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Completed',
                progress_added DECIMAL(5,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                INDEX idx_project_date (project_id, date)
            )
        `);

        // 2.5 Create finance/payment_terms table
        console.log('   Creating finance (payment_terms) table...');
        await connection.query(`
            CREATE TABLE finance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                termin_name VARCHAR(255) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'Unpaid' COMMENT 'Unpaid, Pending, Paid',
                date DATE,
                due_date DATE,
                paid_date DATE,
                milestone_percentage DECIMAL(5,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                INDEX idx_project (project_id),
                INDEX idx_status (status)
            )
        `);

        // 2.6 Create additional supporting tables
        console.log('   Creating vendors table...');
        await connection.query(`
            CREATE TABLE vendors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255),
                phone VARCHAR(50),
                email VARCHAR(255),
                address TEXT,
                rating DECIMAL(3,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('   Creating vendor_materials table...');
        await connection.query(`
            CREATE TABLE vendor_materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vendor_id INT NOT NULL,
                material_name VARCHAR(255) NOT NULL,
                price DECIMAL(15,2) NOT NULL,
                unit VARCHAR(50),
                stock_available INT DEFAULT 0,
                min_order_quantity INT DEFAULT 1,
                delivery_time_days INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
            )
        `);

        console.log('   Creating purchase_orders table...');
        await connection.query(`
            CREATE TABLE purchase_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                material_id INT NOT NULL,
                vendor_id INT,
                quantity INT NOT NULL,
                agreed_price DECIMAL(15,2) NOT NULL,
                total_price DECIMAL(15,2),
                status VARCHAR(50) DEFAULT 'Pending',
                order_date DATE NOT NULL,
                expected_delivery DATE,
                actual_delivery DATE,
                notes TEXT,
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
            )
        `);

        console.log('   Creating progress_history table...');
        await connection.query(`
            CREATE TABLE progress_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                record_date DATE NOT NULL,
                planned_progress DECIMAL(5,2) DEFAULT 0,
                actual_progress DECIMAL(5,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_project_date (project_id, record_date)
            )
        `);

        console.log('   Creating event_queue table...');
        await connection.query(`
            CREATE TABLE event_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                payload TEXT,
                status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL
            )
        `);

        console.log('   ✅ All tables created successfully\n');

        // ========================================
        // STEP 3: SEED DATA
        // ========================================
        console.log('🌱 Step 3: Seeding initial data...\n');

        // 3.1 Insert Users (with hashed password: 123456)
        console.log('   Inserting users...');
        const hashedPassword = await bcrypt.hash('123456', 10);

        await connection.query(`
            INSERT INTO users (name, email, password_hash, role) VALUES
            ('Admin Utama', 'admin@buildpro.com', ?, 'ADMIN'),
            ('Budi Tukang', 'worker@buildpro.com', ?, 'WORKER'),
            ('Siti Logistik', 'logistic@buildpro.com', ?, 'STAFF_LOGISTIC'),
            ('Vendor Toko Bangunan', 'vendor@buildpro.com', ?, 'VENDOR')
        `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

        console.log('   ✅ 4 users created (password: 123456)');

        // 3.2 Insert Projects
        console.log('   Inserting projects...');
        await connection.query(`
            INSERT INTO projects (name, location, budget, start_date, end_date, progress, status) VALUES
            ('Pembangunan Villa Bali', 'Ubud, Bali', 1500000000, '2025-01-01', '2025-12-31', 0, 'In Progress'),
            ('Renovasi Rumah Budi', 'Jakarta Selatan', 500000000, '2025-02-01', '2025-10-31', 0, 'Active')
        `);

        console.log('   ✅ 2 projects created');

        // 3.3 Insert Materials
        console.log('   Inserting materials...');
        await connection.query(`
            INSERT INTO materials (name, stock, unit, price, category, status) VALUES
            ('Semen Portland', 100, 'sak', 85000, 'Material Dasar', 'In Stock'),
            ('Pasir Beton', 50, 'm3', 300000, 'Material Dasar', 'In Stock'),
            ('Besi Beton 10mm', 200, 'batang', 65000, 'Material Struktur', 'In Stock'),
            ('Batu Bata Merah', 5000, 'pcs', 900, 'Material Dinding', 'In Stock')
        `);

        console.log('   ✅ 4 materials created');

        // 3.4 Insert Payment Terms (Finance) for each project
        console.log('   Inserting payment terms (finance)...');
        await connection.query(`
            INSERT INTO finance (project_id, termin_name, amount, status, date, milestone_percentage) VALUES
            (1, 'Down Payment (DP)', 300000000, 'Paid', '2025-01-01', 20),
            (1, 'Termin 1 - Pondasi Selesai', 450000000, 'Unpaid', '2025-04-01', 50),
            (1, 'Termin 2 - Struktur Atap', 600000000, 'Unpaid', '2025-08-01', 80),
            (1, 'Retensi - Serah Terima', 150000000, 'Unpaid', '2025-12-31', 100),
            (2, 'Down Payment (DP)', 100000000, 'Paid', '2025-02-01', 20),
            (2, 'Termin 1 - Pembongkaran', 150000000, 'Unpaid', '2025-05-01', 50),
            (2, 'Termin 2 - Finishing', 200000000, 'Unpaid', '2025-09-01', 80),
            (2, 'Pelunasan', 50000000, 'Unpaid', '2025-10-31', 100)
        `);

        console.log('   ✅ Payment terms created for all projects');

        // 3.5 Insert Vendors
        console.log('   Inserting vendors...');
        await connection.query(`
            INSERT INTO vendors (name, contact_person, email, phone, status) VALUES
            ('Toko Bangunan Maju', 'Pak Eko', 'vendor@buildpro.com', '08123456789', 'Active'),
            ('PT Material Prima', 'Bu Siti', 'siti@materialprima.com', '08234567890', 'Active')
        `);

        console.log('   ✅ 2 vendors created');

        // 3.6 Insert Vendor Materials
        console.log('   Inserting vendor materials...');
        await connection.query(`
            INSERT INTO vendor_materials (vendor_id, material_name, price, unit, stock_available, delivery_time_days) VALUES
            (1, 'Semen Portland', 82000, 'sak', 1000, 1),
            (1, 'Pasir Beton', 290000, 'm3', 500, 2),
            (1, 'Batu Bata Merah', 850, 'pcs', 10000, 1),
            (2, 'Besi Beton 10mm', 63000, 'batang', 2000, 3),
            (2, 'Semen Portland', 84000, 'sak', 800, 2)
        `);

        console.log('   ✅ Vendor materials catalog created');

        // 3.7 Insert initial progress history
        console.log('   Inserting initial progress history...');
        await connection.query(`
            INSERT INTO progress_history (project_id, record_date, actual_progress, notes) VALUES
            (1, '2025-01-01', 0, 'Project kickoff'),
            (2, '2025-02-01', 0, 'Project start')
        `);

        console.log('   ✅ Progress history initialized\n');

        // ========================================
        // STEP 4: DISPLAY SUMMARY
        // ========================================
        console.log('=========================================');
        console.log('✅ DATABASE SETUP COMPLETED SUCCESSFULLY!');
        console.log('=========================================\n');

        // Display created users
        const [users] = await connection.query('SELECT id, name, email, role FROM users ORDER BY id');
        console.log('👥 Created Users:');
        console.table(users);

        // Display created projects
        const [projects] = await connection.query('SELECT id, name, location, budget, start_date, end_date FROM projects ORDER BY id');
        console.log('\n🏗️  Created Projects:');
        console.table(projects);

        // Display created materials
        const [materials] = await connection.query('SELECT id, name, stock, unit, price, category FROM materials ORDER BY id');
        console.log('\n📦 Created Materials:');
        console.table(materials);

        console.log('\n=========================================');
        console.log('🔑 DEFAULT LOGIN CREDENTIALS:');
        console.log('=========================================');
        console.log('All passwords: 123456\n');
        console.log('Admin:     admin@buildpro.com');
        console.log('Worker:    worker@buildpro.com');
        console.log('Logistic:  logistic@buildpro.com');
        console.log('Vendor:    vendor@buildpro.com');
        console.log('=========================================\n');

        console.log('🚀 You can now start the application!');
        console.log('   Run: npm start\n');

    } catch (error) {
        console.error('\n❌ ERROR during database setup:', error.message);
        console.error('\nFull error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
    }
}

// Run the setup
setupDatabase()
    .then(() => {
        console.log('✅ Setup script finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Setup script failed:', error);
        process.exit(1);
    });
