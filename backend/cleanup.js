require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  statement_timeout: 5000, // 5 second timeout
  query_timeout: 5000
});

async function cleanup() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verifying database connection...');
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Verify table access
    console.log('🔍 Verifying table access...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'waitlist_entries'
      );
    `);
    if (!tableCheck.rows[0].exists) {
      throw new Error('waitlist_entries table not found');
    }
    console.log('✅ Table access verified');
    
    console.log('🧹 Starting cleanup...');
    
    // Start transaction
    await client.query('BEGIN');
    console.log('📝 Transaction started');
    
    // Delete all waitlist entries
    console.log('🗑️ Deleting waitlist entries...');
    const deleteResult = await client.query('DELETE FROM waitlist_entries RETURNING id');
    console.log(`✅ Removed ${deleteResult.rowCount} waitlist entries`);
    
    // Reset all restaurant wait times to 0
    console.log('⏱️ Resetting restaurant wait times...');
    const resetResult = await client.query('UPDATE restaurants SET current_wait_time = 0 RETURNING id');
    console.log(`✅ Reset wait times for ${resetResult.rowCount} restaurants`);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✨ Cleanup completed successfully');
  } catch (err) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed with error:', err.message);
    console.error('Error details:', err);
  } finally {
    console.log('🔌 Closing database connection...');
    client.release();
    await pool.end();
    console.log('✅ Database connection closed');
  }
}

// Run cleanup and handle any uncaught errors
cleanup().catch(err => {
  console.error('❌ Uncaught error during cleanup:', err);
  process.exit(1);
}); 