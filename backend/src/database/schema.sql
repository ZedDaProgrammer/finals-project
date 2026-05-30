-- Database Initialization Schema for BlackByte Cybercafe Reservation System

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    credits NUMERIC(10, 2) DEFAULT 0.00,
    points INT DEFAULT 0,
    role VARCHAR(50) DEFAULT 'user'
);

-- 2. Computers (Workstations) Table
CREATE TABLE IF NOT EXISTS computers (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) DEFAULT 'standard', -- standard, vip
    availability VARCHAR(50) DEFAULT 'available', -- available, maintenance
    pc_rate NUMERIC(10, 2) DEFAULT 0.00,
    cpu VARCHAR(100),
    gpu VARCHAR(100),
    ram INT,
    monitor_hz VARCHAR(50)
);

-- 3. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    station_id INT REFERENCES computers(id) ON DELETE CASCADE,
    start TIMESTAMP NOT NULL,
    "end" TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' -- pending, active, completed, cancelled
);

-- 4. Support Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    station_id INT REFERENCES computers(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- open, resolved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
