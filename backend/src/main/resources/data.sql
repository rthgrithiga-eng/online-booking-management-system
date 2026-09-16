-- ==========================================================
-- Online Booking Management System - Initial Seed Data
-- ==========================================================

-- Seed Users
INSERT INTO users (id, full_name, email, password, phone, role, created_at)
VALUES 
    (1, 'Alex Morgan', 'alex.morgan@example.com', '$2a$10$7vj2H9O5Q0c9e6g7a8b9cO', '+1-555-0192', 'CUSTOMER', NOW()),
    (2, 'Sarah Connor', 'sarah.connor@example.com', '$2a$10$8wk3I0P6R1d0f7h8b9c0dP', '+1-555-0144', 'CUSTOMER', NOW()),
    (3, 'Admin User', 'admin@onlinebooking.com', '$2a$10$9xl4J1Q7S2e1g8i9c0d1eQ', '+1-555-0100', 'ADMIN', NOW())
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Seed Service Items
INSERT INTO service_items (id, title, description, duration_minutes, price, is_active, created_at)
VALUES 
    (1, 'General Health Checkup', 'Comprehensive wellness examination and doctor consultation', 45, 75.00, TRUE, NOW()),
    (2, 'Dental Cleaning & Exam', 'Ultrasonic plaque removal and professional dental assessment', 60, 120.00, TRUE, NOW()),
    (3, 'Eye Examination & Vision Test', 'Refraction testing, retinal imaging and optical consultation', 30, 60.00, TRUE, NOW()),
    (4, 'Physical Therapy Session', 'Targeted rehabilitation and therapeutic musculoskeletal exercise', 60, 95.00, TRUE, NOW()),
    (5, 'Nutrition & Diet Consultation', 'Personalized dietary planning and metabolic health assessment', 45, 80.00, TRUE, NOW())
ON DUPLICATE KEY UPDATE title = VALUES(title);
