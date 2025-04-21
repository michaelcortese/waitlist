require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// Helper function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Calculate wait time based on queue
const calculateWaitTime = async (restaurantId) => {
  try {
    // Get the number of parties waiting ahead and their sizes
    const result = await pool.query(
      `SELECT COUNT(*) as party_count, 
              COALESCE(SUM(party_size), 0) as total_people
       FROM waitlist_entries 
       WHERE restaurant_id = $1 
       AND status = 'waiting'`,
      [restaurantId]
    );

    const { party_count, total_people } = result.rows[0];
    
    // Base wait time: 30 minutes per party + 5 minutes per person
    const waitTime = (party_count * 30) + (total_people * 5);
    
    console.log('⏱️ Calculated wait time:', {
      restaurant_id: restaurantId,
      party_count,
      total_people,
      wait_time: waitTime,
      calculation: `${party_count} parties × 30min + ${total_people} people × 5min`
    });

    return waitTime;
  } catch (err) {
    console.error('Error calculating wait time:', err);
    return 30; // Default wait time if calculation fails
  }
};

// Routes

// Register new user
app.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (id, email, password, role) VALUES (uuid_generate_v4(), $1, $2, $3) RETURNING id',
      [email, hashedPassword, role]
    );
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      'SELECT id, password, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error during login' });
  }
});

// Get restaurant details
app.get('/restaurant/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching restaurant:', id);
    
    // Get restaurant details
    const restaurantResult = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [id]
    );

    if (restaurantResult.rows.length === 0) {
      console.log('❌ Restaurant not found');
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Calculate current wait time
    const current_wait_time = await calculateWaitTime(id);

    // Update restaurant's wait time in the database
    await pool.query(
      'UPDATE restaurants SET current_wait_time = $1 WHERE id = $2',
      [current_wait_time, id]
    );

    // Return restaurant details with updated wait time
    const restaurant = {
      ...restaurantResult.rows[0],
      current_wait_time
    };

    console.log('✅ Restaurant found:', restaurant);
    res.json(restaurant);
  } catch (err) {
    console.error('❌ Error fetching restaurant:', err);
    res.status(500).json({ error: 'Error fetching restaurant details' });
  }
});

// Create new restaurant
app.post('/restaurant', authenticateToken, async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const result = await pool.query(
      'INSERT INTO restaurants (id, name, address, phone, current_wait_time) VALUES (uuid_generate_v4(), $1, $2, $3, 0) RETURNING id',
      [name, address, phone]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating restaurant:', err);
    res.status(500).json({ error: 'Error creating restaurant' });
  }
});

// Update wait time
app.post('/restaurant/:id/update_wait_time', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { wait_time } = req.body;
    await pool.query(
      'UPDATE restaurants SET current_wait_time = $1 WHERE id = $2',
      [wait_time, id]
    );
    res.json({ message: 'Wait time updated successfully' });
  } catch (err) {
    console.error('Error updating wait time:', err);
    res.status(500).json({ error: 'Error updating wait time' });
  }
});

// Add to waitlist
app.post('/restaurant/:id/waitlist', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, party_size, phone_number, notes, consent_given } = req.body;
    
    console.log('📝 Adding to waitlist:', {
      restaurant_id: id,
      customer_name,
      party_size,
      phone_number,
      notes,
      consent_given
    });

    // Validate required fields
    if (!customer_name || !party_size || !phone_number) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          customer_name: !customer_name ? 'Customer name is required' : null,
          party_size: !party_size ? 'Party size is required' : null,
          phone_number: !phone_number ? 'Phone number is required' : null
        }
      });
    }

    // Validate consent
    if (!consent_given) {
      return res.status(400).json({ 
        error: 'Consent is required to join the waitlist'
      });
    }

    const result = await pool.query(
      `INSERT INTO waitlist_entries 
       (id, restaurant_id, customer_name, party_size, phone_number, notes, status, consent_given) 
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'waiting', $6) 
       RETURNING id`,
      [id, customer_name, party_size, phone_number, notes, consent_given]
    );

    console.log('✅ Added to waitlist:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error adding to waitlist:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    res.status(500).json({ 
      error: 'Error adding to waitlist',
      details: err.message
    });
  }
});

// Get waitlist
app.get('/restaurant/:id/waitlist', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM waitlist_entries WHERE restaurant_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching waitlist:', err);
    res.status(500).json({ error: 'Error fetching waitlist' });
  }
});

// Update waitlist status
app.post('/waitlist/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query(
      'UPDATE waitlist_entries SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Error updating status' });
  }
});

// Remove from waitlist
app.delete('/waitlist/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM waitlist_entries WHERE id = $1', [id]);
    res.json({ message: 'Entry removed successfully' });
  } catch (err) {
    console.error('Error removing entry:', err);
    res.status(500).json({ error: 'Error removing entry' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log('📝 API endpoints available:');
  console.log('   - GET  /restaurant/{id} - Get restaurant details');
  console.log('   - POST /restaurant - Create a new restaurant');
  console.log('   - POST /restaurant/{id}/update_wait_time - Update wait time');
  console.log('   - POST /restaurant/{id}/waitlist - Add to waitlist');
  console.log('   - GET  /restaurant/{id}/waitlist - Get waitlist');
  console.log('   - POST /waitlist/{id}/status - Update waitlist status');
  console.log('   - DELETE /waitlist/{id} - Remove from waitlist');
  console.log('   - POST /register - Register a new user');
  console.log('   - POST /login - Login and get JWT token');
}); 