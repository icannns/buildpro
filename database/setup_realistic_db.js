const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'buildpro_db',
    multipleStatements: true
};

const sqlCommands = `
    -- 1. RESET & FIX USERS
    -- Pastikan semua user penting ada dengan password '123456'
    INSERT INTO users (email, password_hash, name, role) VALUES 
    ('admin@buildpro.com', '$2b$10$g1yDx.SIu87yegl16ad47.sCbp/sgontr3pfcVN1MZlz8jrfKwLVS', 'Admin Utama', 'ADMIN'),
    ('worker1@buildpro.com', '$2b$10$g1yDx.SIu87yegl16ad47.sCbp/sgontr3pfcVN1MZlz8jrfKwLVS', 'Budi Tukang', 'WORKER'),
    ('logistic1@buildpro.com', '$2b$10$g1yDx.SIu87yegl16ad47.sCbp/sgontr3pfcVN1MZlz8jrfKwLVS', 'Siti Logistik', 'STAFF_LOGISTIC'),
    ('vendor1@buildpro.com', '$2b$10$g1yDx.SIu87yegl16ad47.sCbp/sgontr3pfcVN1MZlz8jrfKwLVS', 'Toko Bangunan Maju', 'VENDOR')
    ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role);

    -- 2. SETUP VENDOR (Connect to User vendor1)
    -- Update Vendor ID 1 supaya emailnya match dengan user login
    INSERT INTO vendors (id, name, contact_person, email, phone, status) VALUES
    (1, 'Toko Bangunan Maju', 'Pak Eko', 'vendor1@buildpro.com', '08123456789', 'Active')
    ON DUPLICATE KEY UPDATE email = 'vendor1@buildpro.com', name = 'Toko Bangunan Maju';

    -- 3. SETUP VENDOR MATERIALS (Katalog Vendor)
    -- Vendor 1 jual Semen & Pasir
    DELETE FROM vendor_materials WHERE vendor_id = 1;
    INSERT INTO vendor_materials (vendor_id, material_name, price, unit, stock_available, min_order_quantity, delivery_time_days) VALUES
    (1, 'Semen Portland', 85000, 'sak', 1000, 10, 1),
    (1, 'Pasir Beton', 300000, 'm3', 500, 5, 2);

    -- 4. SETUP INTERNAL INVENTORY (Gudang Proyek)
    -- Stok Semen TIPIS (cuma 5), biar Staff Logistik harus beli
    DELETE FROM materials;
    INSERT INTO materials (id, name, unit, current_stock, min_stock_level, price_per_unit) VALUES
    (1, 'Semen Portland', 'sak', 5, 50, 85000),
    (2, 'Pasir Beton', 'm3', 10, 20, 300000),
    (3, 'Besi Beton 10mm', 'batang', 100, 50, 65000);

    -- 5. SETUP PROJECT
    DELETE FROM projects;
    INSERT INTO projects (id, name, description, start_date, end_date, status, progress, budget) VALUES
    (1, 'Pembangunan Villa Bali', 'Proyek pembangunan villa 2 lantai di Canggu', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'In Progress', 0, 1500000000);

    -- 6. SETUP BUDGET & PAYMENT TERMS (Termin)
    -- Termin otomatis cair kalau progress sampai target
    DELETE FROM payment_terms WHERE project_id = 1;
    INSERT INTO payment_terms (project_id, term_name, percentage, amount, status, due_date, milestone_trigger_percentage) VALUES
    (1, 'Down Payment (DP)', 20.00, 300000000, 'PAID', CURDATE(), 0),
    (1, 'Termin 1 (Pondasi Selesai)', 30.00, 450000000, 'PENDING', DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 25),
    (1, 'Termin 2 (Struktur Atap)', 40.00, 600000000, 'PENDING', DATE_ADD(CURDATE(), INTERVAL 3 MONTH), 75),
    (1, 'Retensi (Serah Terima)', 10.00, 150000000, 'PENDING', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 100);

    -- 7. CLEANUP LOGS
    DELETE FROM daily_logs;
    DELETE FROM purchase_orders;
    DELETE FROM progress_history;
    
    -- Initial S-Curve Point
    INSERT INTO progress_history (project_id, record_date, actual_progress, notes) VALUES (1, CURDATE(), 0, 'Project Start');
`;

async function setupDatabase() {
    console.log('🚀 Starting Realistic Database Setup...');
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.');

        // Split commands by semicolon to run them individually (safer) or use multipleStatements
        // Since we enabled multipleStatements, we can run blocks.

        await connection.query(sqlCommands);
        console.log('✅ Database setup completed successfully!');
        console.log('---------------------------------------------------');
        console.log('🎉 SKENARIO SIAP DIMAINKAN:');
        console.log('1. Login VENDOR (vendor1@buildpro.com) -> Cek harga Semen.');
        console.log('2. Login LOGISTIC (logistic1@buildpro.com) -> Stok Semen tinggal 5! Buat PO ke Vendor 1.');
        console.log('3. Login WORKER (worker1@buildpro.com) -> Input Progress 25% (Pondasi).');
        console.log('4. Login ADMIN -> Cek Keuangan, Termin 1 otomatis "Ready" karena progress 25%.');
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ Error setting up database:', error);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
