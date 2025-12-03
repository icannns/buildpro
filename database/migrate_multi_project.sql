-- Migration Script: Add Multi-Project Support with Deadlines
-- This script updates the existing database to support multiple projects

-- Step 1: Rename 'deadline' column to 'end_date' for consistency
ALTER TABLE projects 
CHANGE COLUMN deadline end_date DATE;

-- Step 2: Clear existing project data for clean seeding
DELETE FROM daily_logs;
DELETE FROM payment_terms;
DELETE FROM progress_history;
DELETE FROM projects;

-- Step 3: Insert 2 distinct projects
INSERT INTO projects (id, name, progress, status, location, contractor, budget, start_date, end_date, created_at) 
VALUES 
    (1, 'Pembangunan Villa Bali', 66.00, 'Active', 'Ubud, Bali', 'CV Bangunan Bali Indah', 1500000000, '2025-06-01', '2025-12-02', NOW()),
    (2, 'Renovasi Rumah Budi', 25.00, 'Active', 'Jakarta Selatan', 'PT Renovasi Sejahtera', 500000000, '2025-09-01', '2025-10-20', NOW());

-- Step 4: Add sample daily logs for both projects
INSERT INTO daily_logs (project_id, log_date, description, progress_added, worker_name, notes)
VALUES
    -- Project 1: Villa Bali
    (1, '2025-11-25', 'Pemasangan keramik ruang tamu', 3.00, 'Agus Wirawan', 'Selesai 80% area'),
    (1, '2025-11-26', 'Pekerjaan plafon kamar utama', 2.50, 'Made Suryadi', 'Berjalan lancar'),
    (1, '2025-11-27', 'Pengecatan dinding eksterior', 2.00, 'Wayan Surya', 'Butuh cat tambahan'),
    
    -- Project 2: Rumah Budi
    (2, '2025-10-10', 'Pembongkaran dinding lama', 5.00, 'Andi Kurniawan', 'Selesai tepat waktu'),
    (2, '2025-10-12', 'Pemasangan rangka atap baru', 4.00, 'Budi Santoso', 'Material tiba tepat waktu'),
    (2, '2025-10-15', 'Pemasangan genteng', 3.00, 'Andi Kurniawan', 'Cuaca mendukung');

-- Step 5: Add sample payment terms for both projects
INSERT INTO payment_terms (project_id, termin_name, milestone_percentage, amount, status, due_date)
VALUES
    -- Project 1: Villa Bali  (Budget 1.5M)
    (1, 'Termin 1 - Fondasi & Struktur', 25.00, 375000000, 'Paid', '2025-07-01'),
    (1, 'Termin 2 - Dinding & Atap', 50.00, 375000000, 'Paid', '2025-09-01'),
    (1, 'Termin 3 - Finishing Interior', 75.00, 375000000, 'Pending', '2025-11-01'),
    (1, 'Termin 4 - Final & Serah Terima', 100.00, 375000000, 'Unpaid', '2025-12-15'),
    
    -- Project 2: Rumah Budi (Budget 500jt)
    (2, 'Termin 1 - Pembongkaran', 20.00, 100000000, 'Paid', '2025-09-10'),
    (2, 'Termin 2 - Struktur Atap', 50.00, 150000000, 'Pending', '2025-10-05'),
    (2, 'Termin 3 - Finishing', 100.00, 250000000, 'Unpaid', '2025-10-25');

-- Step 6: Add sample progress history for S-Curve
INSERT INTO progress_history (project_id, record_date, planned_progress, actual_progress)
VALUES
    -- Project 1: Villa Bali
    (1, '2025-06-30', 10.00, 12.00),
    (1, '2025-07-31', 25.00, 28.00),
    (1, '2025-08-31', 40.00, 42.00),
    (1, '2025-09-30', 55.00, 56.00),
    (1, '2025-10-31', 70.00, 64.00),
    (1, '2025-11-30', 85.00, 66.00),
    
    -- Project 2: Rumah Budi
    (2, '2025-09-15', 15.00, 18.00),
    (2, '2025-09-30', 30.00, 25.00),
    (2, '2025-10-15', 60.00, 25.00);

-- Verification: Show all projects
SELECT id, name, progress, budget, start_date, end_date, status FROM projects;
