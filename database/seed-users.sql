-- BuildPro Default Users
-- Generated with bcrypt hash

INSERT INTO users (email, password_hash, name, role) VALUES
    ('admin@buildpro.com', '$2b$10$d1tyAfF86/BzPZWlkzP.XO9vG6p5gsaoOziZYGUhmhgG3RHVSQcg.', 'Admin User', 'ADMIN'),
    ('pm@buildpro.com', '$2b$10$T.LEzhtQ0lGsvDJv6q.vW.dacD5UkzE9zxclY7mcbGhzhzo/3gBDG', 'Project Manager', 'PROJECT_MANAGER'),
    ('vendor@buildpro.com', '$2b$10$qOPZwJRWa3ar5rwMiPuU4ulGypPoNrwsz/FpJ0INxc6gZoGlf6FGK', 'Vendor User', 'VENDOR'),
    ('viewer@buildpro.com', '$2b$10$DNSSoKHxULGoG3paFalWKuXvlMm63wV22vyDSgpuSxPx5Au4jS8dC', 'Viewer User', 'VIEWER')

ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    name = VALUES(name),
    role = VALUES(role);

-- Display created users
-- SELECT id, email, name, role, created_at FROM users;