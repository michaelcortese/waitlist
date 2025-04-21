// src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/waitlist',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('🔴 Database connection error:', err.message);
  } else {
    console.log('🟢 Database connected successfully');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}; 