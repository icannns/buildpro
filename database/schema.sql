

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    location VARCHAR(255),
    contractor VARCHAR(255),
    budget DECIMAL(15,2),
    start_date DATE,
    deadline DATE,
    project_type VARCHAR(100) DEFAULT 'Konstruksi Baru' COMMENT 'Jenis proyek: Konstruksi Baru, Renovasi, dll',
    project_manager VARCHAR(255) COMMENT 'Penanggung jawab proyek / Project Manager',
    current_phase VARCHAR(100) DEFAULT 'Perencanaan' COMMENT 'Tahap proyek: Perencanaan, Fondasi, Struktur, Finishing, Selesai',
    planned_progress DECIMAL(5,2) DEFAULT 0 COMMENT 'Progress yang direncanakan untuk periode ini',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Daily Logs table - for tracking daily progress by workers
CREATE TABLE IF NOT EXISTS daily_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    log_date DATE NOT NULL,
    description TEXT NOT NULL,
    progress_added DECIMAL(5,2) DEFAULT 0 COMMENT 'Progress percentage added this day',
    worker_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_date (project_id, log_date)
);

-- Progress History table - for S-Curve tracking
CREATE TABLE IF NOT EXISTS progress_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    record_date DATE NOT NULL,
    planned_progress DECIMAL(5,2) DEFAULT 0,
    actual_progress DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_date (project_id, record_date),
    INDEX idx_project_date (project_id, record_date)
);

-- Event Queue table (should already exist for EAI)
CREATE TABLE IF NOT EXISTS event_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    payload TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    INDEX idx_status (status)
);

-- =====================================================
-- MATERIAL/INVENTORY SERVICE TABLES
-- =====================================================

-- Materials table (should already exist)
CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock INT DEFAULT 0,
    unit VARCHAR(50),
    price DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'In Stock',
    min_stock INT DEFAULT 10 COMMENT 'Minimum stock threshold',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

-- Material Usage Log - track when materials are used
CREATE TABLE IF NOT EXISTS material_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    project_id INT,
    quantity INT NOT NULL,
    usage_date DATE NOT NULL,
    notes TEXT,
    recorded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX idx_material (material_id),
    INDEX idx_project (project_id)
);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    vendor_id INT,
    quantity INT NOT NULL,
    agreed_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * agreed_price) STORED,
    status VARCHAR(50) DEFAULT 'Pending' COMMENT 'Pending, Confirmed, Delivered, Cancelled',
    order_date DATE NOT NULL,
    expected_delivery DATE,
    actual_delivery DATE,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_vendor (vendor_id)
);

-- =====================================================
-- VENDOR SERVICE TABLES
-- =====================================================

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    rating DECIMAL(3,2) DEFAULT 0 COMMENT 'Rating 0-5.0',
    status VARCHAR(50) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

-- Vendor Materials - catalog of materials offered by vendors with prices
CREATE TABLE IF NOT EXISTS vendor_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    unit VARCHAR(50),
    stock_available INT DEFAULT 0,
    min_order_quantity INT DEFAULT 1,
    delivery_time_days INT DEFAULT 1 COMMENT 'Estimated delivery time in days',
    notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor (vendor_id),
    INDEX idx_material_name (material_name)
);

-- =====================================================
-- BUDGET SERVICE TABLES
-- =====================================================

-- Payment Terms table - scheduled payments based on milestones
CREATE TABLE IF NOT EXISTS payment_terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    termin_name VARCHAR(255) NOT NULL COMMENT 'e.g., Termin 1 - Fondasi',
    milestone_percentage DECIMAL(5,2) NOT NULL COMMENT 'Progress % required to trigger payment',
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Unpaid' COMMENT 'Unpaid, Pending, Paid',
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project (project_id),
    INDEX idx_status (status)
);

-- =====================================================
-- USER MANAGEMENT & RBAC
-- =====================================================

-- Update users table to include roles (if not already exists)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'WORKER' COMMENT 'ADMIN, WORKER, VENDOR, STAFF_LOGISTIC',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- User Sessions table (if not already exists)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token(255)),
    INDEX idx_user (user_id)
);

-- =====================================================
-- SEED INITIAL DATA
-- =====================================================

-- Add default admin user if not exists
INSERT INTO users (username, password, full_name, email, role, status)
SELECT 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoJMeKrjHGjxDH00gHKhHPn4Y0mLJXXVXXXX', 'Administrator', 'admin@buildpro.com', 'ADMIN', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Add sample vendors
INSERT INTO vendors (name, contact_person, phone, email, address, rating, status)
VALUES 
    ('Toko Bangunan Jaya', 'Budi Santoso', '081234567890', 'budi@tokojaya.com', 'Jl. Raya No. 123, Jakarta', 4.5, 'Active'),
    ('PT Material Prima', 'Siti Nurhaliza', '082345678901', 'siti@materialprima.com', 'Jl. Industri No. 45, Jakarta', 4.8, 'Active'),
    ('CV Bangunan Sejahtera', 'Ahmad Dahlan', '083456789012', 'ahmad@sejahtera.com', 'Jl. Perdagangan No. 78, Jakarta', 4.2, 'Active')
ON DUPLICATE KEY UPDATE name=name;

-- Add sample vendor materials
INSERT INTO vendor_materials (vendor_id, material_name, price, unit, stock_available, delivery_time_days)
VALUES 
    (1, 'Semen', 65000, 'Sak', 1000, 1),
    (1, 'Pasir', 350000, 'M3', 500, 2),
    (1, 'Batu Bata', 900, 'Pcs', 5000, 1),
    (2, 'Semen', 62000, 'Sak', 2000, 1),
    (2, 'Pasir', 340000, 'M3', 800, 1),
    (2, 'Besi Beton', 12000, 'Kg', 3000, 3),
    (3, 'Semen', 64000, 'Sak', 500, 2),
    (3, 'Batu Bata', 850, 'Pcs', 10000, 2),
    (3, 'Cat', 85000, 'Liter', 200, 1)
ON DUPLICATE KEY UPDATE price=price;

-- =====================================================
-- VIEWS (OPTIONAL - for easier querying)
-- =====================================================

-- View for budget summary per project
CREATE OR REPLACE VIEW budget_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.budget AS total_budget,
    COALESCE(SUM(CASE WHEN pt.status = 'Paid' THEN pt.amount ELSE 0 END), 0) AS paid_amount,
    COALESCE(SUM(CASE WHEN pt.status = 'Pending' THEN pt.amount ELSE 0 END), 0) AS pending_amount,
    COALESCE(SUM(CASE WHEN pt.status = 'Unpaid' THEN pt.amount ELSE 0 END), 0) AS unpaid_amount,
    p.budget - COALESCE(SUM(CASE WHEN pt.status = 'Paid' THEN pt.amount ELSE 0 END), 0) AS remaining_budget,
    CASE 
        WHEN p.budget > 0 THEN (COALESCE(SUM(CASE WHEN pt.status = 'Paid' THEN pt.amount ELSE 0 END), 0) / p.budget * 100)
        ELSE 0 
    END AS percentage_used
FROM projects p
LEFT JOIN payment_terms pt ON p.id = pt.project_id
GROUP BY p.id, p.name, p.budget;

-- View for material stock status
CREATE OR REPLACE VIEW material_stock_status AS
SELECT 
    m.id,
    m.name,
    m.stock,
    m.min_stock,
    m.unit,
    m.price,
    CASE 
        WHEN m.stock = 0 THEN 'Out of Stock'
        WHEN m.stock < m.min_stock THEN 'Low Stock'
        ELSE 'In Stock'
    END AS stock_status,
    COALESCE(SUM(po.quantity), 0) AS pending_orders
FROM materials m
LEFT JOIN purchase_orders po ON m.id = po.material_id AND po.status IN ('Pending', 'Confirmed')
GROUP BY m.id, m.name, m.stock, m.min_stock, m.unit, m.price;

-- =====================================================
-- TRIGGERS (OPTIONAL - for automatic updates)
-- =====================================================

-- Trigger to update material stock status when stock changes
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_material_status_after_update
AFTER UPDATE ON materials
FOR EACH ROW
BEGIN
    IF NEW.stock = 0 THEN
        UPDATE materials SET status = 'Out of Stock' WHERE id = NEW.id;
    ELSEIF NEW.stock < NEW.min_stock THEN
        UPDATE materials SET status = 'Low Stock' WHERE id = NEW.id;
    ELSE
        UPDATE materials SET status = 'In Stock' WHERE id = NEW.id;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- TIMELINE NOTES TABLE
-- =====================================================

-- Timeline Notes - for tracking project timeline events and remarks
CREATE TABLE IF NOT EXISTS timeline_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    note_date DATE NOT NULL,
    phase VARCHAR(100) COMMENT 'Project phase: Fondasi, Struktur, Finishing, etc',
    milestone VARCHAR(255) COMMENT 'Milestone description',
    note TEXT COMMENT 'Remarks or delay reasons, e.g. "Material belum datang"',
    note_type VARCHAR(50) DEFAULT 'info' COMMENT 'Type: info, warning, delay, success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_date (project_id, note_date)
);

-- =====================================================
-- COMPLETE
-- =====================================================
