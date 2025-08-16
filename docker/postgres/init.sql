-- PostgreSQL initialization script for DateKeeper development
-- This script runs when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone TO 'UTC';

-- Create additional databases for testing
CREATE DATABASE datekeeper_test OWNER datekeeper;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE datekeeper_dev TO datekeeper;
GRANT ALL PRIVILEGES ON DATABASE datekeeper_test TO datekeeper;

-- Log setup completion
\echo 'DateKeeper PostgreSQL database initialized successfully!'
