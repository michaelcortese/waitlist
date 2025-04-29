require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  try {
    console.log('🔄 Starting migration...');
    
    // Create UUID extension if it doesn't exist
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
    console.log('✅ UUID extension verified');
    
    // Create restaurants table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        current_wait_time INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Restaurants table verified');
    
    // Create waitlist_entries table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS waitlist_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id),
        customer_name VARCHAR(255) NOT NULL,
        party_size INTEGER NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'waiting',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        estimated_wait_time INTEGER
      )
    `);
    console.log('✅ Waitlist entries table verified');
    
    // Check if we need to rename any columns
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'waitlist_entries'
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    // Rename name to customer_name if needed
    if (existingColumns.includes('name') && !existingColumns.includes('customer_name')) {
      console.log('📝 Renaming name column to customer_name...');
      await pool.query(`
        ALTER TABLE waitlist_entries 
        RENAME COLUMN name TO customer_name
      `);
      console.log('✅ Column renamed successfully');
    }
    
    // Rename phone to phone_number if needed
    if (existingColumns.includes('phone') && !existingColumns.includes('phone_number')) {
      console.log('📝 Renaming phone column to phone_number...');
      await pool.query(`
        ALTER TABLE waitlist_entries 
        RENAME COLUMN phone TO phone_number
      `);
      console.log('✅ Column renamed successfully');
    }
    
    // Update existing entries with calculated wait times if needed
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'waitlist_entries' 
      AND column_name = 'estimated_wait_time'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      console.log('📝 Adding estimated_wait_time column...');
      await pool.query(`
        ALTER TABLE waitlist_entries 
        ADD COLUMN estimated_wait_time INTEGER
      `);
      console.log('✅ Column added successfully');
      
      // Update existing entries
      console.log('🔄 Updating existing entries with calculated wait times...');
      const entriesResult = await pool.query(`
        SELECT id, restaurant_id, party_size, created_at 
        FROM waitlist_entries 
        WHERE status = 'waiting'
      `);
      
      let updatedCount = 0;
      for (const entry of entriesResult.rows) {
        const positionResult = await pool.query(
          `SELECT COUNT(*) as position
           FROM waitlist_entries 
           WHERE restaurant_id = $1 
           AND status = 'waiting'
           AND created_at <= $2`,
          [entry.restaurant_id, entry.created_at]
        );
        
        const position = parseInt(positionResult.rows[0].position);
        const individualWaitTime = ((position - 1) * 30) + (entry.party_size * 5);
        
        await pool.query(
          `UPDATE waitlist_entries 
           SET estimated_wait_time = $1 
           WHERE id = $2`,
          [individualWaitTime, entry.id]
        );
        
        updatedCount++;
      }
      
      console.log(`✅ Updated ${updatedCount} entries with individual wait times`);
    }
    
    // Create test restaurant if it doesn't exist
    const testRestaurantId = '123e4567-e89b-12d3-a456-426614174000';
    const restaurantResult = await pool.query(
      'SELECT id FROM restaurants WHERE id = $1',
      [testRestaurantId]
    );
    
    if (restaurantResult.rows.length === 0) {
      console.log('📝 Creating test restaurant...');
      await pool.query(
        `INSERT INTO restaurants (id, name, address, phone, current_wait_time)
         VALUES ($1, $2, $3, $4, $5)`,
        [testRestaurantId, 'Test Restaurant', '123 Test St', '555-0123', 0]
      );
      console.log('✅ Test restaurant created');
    }
    
    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate(); 