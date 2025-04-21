require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createAdminUser() {
  try {
    const email = 'admin@example.com';
    const password = 'admin123';
    const role = 'admin';
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the admin user
    const result = await pool.query(
      'INSERT INTO users (id, email, password, role) VALUES (uuid_generate_v4(), $1, $2, $3) RETURNING id, email, role',
      [email, hashedPassword, role]
    );
    
    console.log('✅ Admin user created successfully:', result.rows[0]);
    console.log('📝 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
  } finally {
    pool.end();
  }
}

createAdminUser(); 