-- Database initialization script for NonProfit Connect
-- This script will be automatically executed when the PostgreSQL container starts

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE nonprofit_connect'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nonprofit_connect');

-- Connect to the database
\c nonprofit_connect;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual schema will be created by Drizzle when the application starts
-- This file ensures the database exists and is properly configured