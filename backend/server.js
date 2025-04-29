require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
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

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Join a restaurant room to receive updates for that restaurant
  socket.on('join-restaurant', (restaurantId) => {
    socket.join(`restaurant-${restaurantId}`);
    console.log(`👥 Client ${socket.id} joined restaurant-${restaurantId}`);
  });
  
  // Leave a restaurant room
  socket.on('leave-restaurant', (restaurantId) => {
    socket.leave(`restaurant-${restaurantId}`);
    console.log(`👋 Client ${socket.id} left restaurant-${restaurantId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Helper function to emit waitlist updates to all clients in a restaurant room
const emitWaitlistUpdate = async (restaurantId) => {
  try {
    const waitlistResult = await pool.query(
      'SELECT * FROM waitlist_entries WHERE restaurant_id = $1 ORDER BY created_at ASC',
      [restaurantId]
    );
    io.to(`restaurant-${restaurantId}`).emit('waitlist-update', waitlistResult.rows);
    console.log(`📢 Emitted waitlist update to restaurant-${restaurantId}`);
  } catch (err) {
    console.error('Error emitting waitlist update:', err);
  }
};

// Helper function to emit restaurant details update
const emitRestaurantUpdate = (restaurantId, restaurantData) => {
  io.to(`restaurant-${restaurantId}`).emit('restaurant-update', restaurantData);
  console.log(`📢 Emitted restaurant update to restaurant-${restaurantId}`);
};

// Logging utility
const logWaitlistEvent = async (restaurantId, action, entry) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    restaurant_id: restaurantId,
    action: action.toUpperCase(),
    party_size: entry.party_size,
    name: entry.name,
    phone: entry.phone,
    estimated_wait_time: entry.estimated_wait_time
  };

  const logLine = JSON.stringify(logEntry);
  const logFile = path.join(logsDir, `waitlist-${new Date().toISOString().split('T')[0]}.log`);
  
  await fs.promises.appendFile(logFile, logLine + '\n');
  console.log('📝 Logged waitlist event:', logLine);
  return logEntry;
};

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
    const waitTime = Math.max(0, (party_count * 30) + (total_people * 5));
    
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
    return 0; // Default to 0 if calculation fails
  }
};

// Calculate individual wait time for a party
function calculateIndividualWaitTime(position, partySize) {
  // Base wait time: 30 minutes per party ahead + 5 minutes per person in this party
  return Math.max(0, ((position - 1) * 30) + (partySize * 5));
}

// Helper function to recalculate wait times for all entries
async function recalculateWaitTimes(restaurantId) {
  try {
    // Get all waiting entries ordered by creation time
    const entriesResult = await pool.query(
      `SELECT id, party_size, created_at 
       FROM waitlist_entries 
       WHERE restaurant_id = $1 
       AND status = 'waiting'
       ORDER BY created_at ASC`,
      [restaurantId]
    );
    
    // Update each entry with its new position and wait time
    for (let i = 0; i < entriesResult.rows.length; i++) {
      const position = i + 1;
      const waitTime = calculateIndividualWaitTime(position, entriesResult.rows[i].party_size);
      
      await pool.query(
        `UPDATE waitlist_entries 
         SET estimated_wait_time = $1 
         WHERE id = $2`,
        [waitTime, entriesResult.rows[i].id]
      );
    }
    
    // Update the restaurant's current wait time
    const newWaitTime = await calculateWaitTime(restaurantId);
    await pool.query(
      'UPDATE restaurants SET current_wait_time = $1 WHERE id = $2',
      [newWaitTime, restaurantId]
    );
    
    return entriesResult.rows.length;
  } catch (err) {
    console.error('Error recalculating wait times:', err);
    throw err;
  }
}

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
app.post('/waitlist', async (req, res) => {
  const { restaurant_id, party_size, name, phone } = req.body;
  
  try {
    // Start a transaction
    await pool.query('BEGIN');
    
    // Get the position of the party in the queue
    const positionResult = await pool.query(
      `SELECT COUNT(*) as position
       FROM waitlist_entries 
       WHERE restaurant_id = $1 
       AND status = 'waiting'`,
      [restaurant_id]
    );
    
    const position = parseInt(positionResult.rows[0].position) + 1;
    const estimatedWaitTime = calculateIndividualWaitTime(position, party_size);
    
    // Add the entry with individual wait time
    const result = await pool.query(
      `INSERT INTO waitlist_entries 
       (id, restaurant_id, customer_name, phone_number, party_size, status, estimated_wait_time) 
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'waiting', $5) 
       RETURNING *`,
      [restaurant_id, name, phone, party_size, estimatedWaitTime]
    );
    
    const entry = result.rows[0];
    
    // Log the event
    await logWaitlistEvent(restaurant_id, 'join', entry);
    
    // Commit the transaction
    await pool.query('COMMIT');
    
    // Emit update to all clients
    await emitWaitlistUpdate(restaurant_id);
    
    res.json(entry);
  } catch (err) {
    // Rollback the transaction on error
    await pool.query('ROLLBACK');
    console.error('Error adding to waitlist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get waitlist
app.get('/restaurant/:id/waitlist', async (req, res) => {
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

// Update wait time by 5 minutes
app.post('/restaurant/:id/adjust_wait_time', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { adjustment } = req.body;

    // Get current restaurant details
    const restaurantResult = await client.query(
      'SELECT current_wait_time FROM restaurants WHERE id = $1',
      [id]
    );

    if (restaurantResult.rows.length === 0) {
      throw new Error('Restaurant not found');
    }

    // Calculate new base wait time
    const currentWaitTime = restaurantResult.rows[0].current_wait_time;
    const newBaseWaitTime = Math.max(0, currentWaitTime + adjustment);

    // Update restaurant's base wait time
    await client.query(
      'UPDATE restaurants SET current_wait_time = $1 WHERE id = $2',
      [newBaseWaitTime, id]
    );

    // Get all waiting entries in order
    const entriesResult = await client.query(
      `SELECT id, party_size, created_at 
       FROM waitlist_entries 
       WHERE restaurant_id = $1 
       AND status = 'waiting'
       ORDER BY created_at ASC`,
      [id]
    );

    // Update each entry's wait time
    for (const [index, entry] of entriesResult.rows.entries()) {
      const position = index + 1;
      const waitTime = calculateIndividualWaitTime(position, entry.party_size);
      
      await client.query(
        `UPDATE waitlist_entries 
         SET estimated_wait_time = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [Math.max(0, waitTime + adjustment), entry.id]
      );
    }

    // Get final updated data
    const [updatedRestaurant, updatedWaitlist] = await Promise.all([
      client.query('SELECT * FROM restaurants WHERE id = $1', [id]),
      client.query(
        `SELECT * FROM waitlist_entries 
         WHERE restaurant_id = $1 
         ORDER BY created_at ASC`,
        [id]
      )
    ]);

    await client.query('COMMIT');

    // Emit updates within the transaction
    await Promise.all([
      emitRestaurantUpdate(id, updatedRestaurant.rows[0]),
      emitWaitlistUpdate(id, updatedWaitlist.rows)
    ]);

    res.json({ 
      message: 'Wait times adjusted successfully',
      restaurant: updatedRestaurant.rows[0],
      waitlist: updatedWaitlist.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adjusting wait time:', err);
    res.status(500).json({ error: 'Error adjusting wait time' });
  } finally {
    client.release();
  }
});

// Update waitlist status
app.put('/waitlist/:id/status', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Get the entry first to check its current status
    const entryResult = await client.query(
      'SELECT * FROM waitlist_entries WHERE id = $1',
      [id]
    );
    
    if (entryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }
    
    const entry = entryResult.rows[0];
    
    // Only allow status changes for waiting entries
    if (entry.status !== 'waiting') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Can only update status of waiting entries' });
    }
    
    // Update the entry status
    await client.query(
      'UPDATE waitlist_entries SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    
    // Recalculate wait times for remaining entries
    await recalculateWaitTimes(entry.restaurant_id);
    
    // Get updated restaurant and waitlist
    const [restaurantResult, waitlistResult] = await Promise.all([
      client.query('SELECT * FROM restaurants WHERE id = $1', [entry.restaurant_id]),
      client.query(
        `SELECT * FROM waitlist_entries 
         WHERE restaurant_id = $1 
         ORDER BY created_at ASC`,
        [entry.restaurant_id]
      )
    ]);
    
    await client.query('COMMIT');
    
    // Emit updates
    await Promise.all([
      emitRestaurantUpdate(entry.restaurant_id, restaurantResult.rows[0]),
      emitWaitlistUpdate(entry.restaurant_id, waitlistResult.rows)
    ]);
    
    // Log the event
    await logWaitlistEvent(entry.restaurant_id, `status_updated_to_${status}`, entry);
    
    res.json({
      message: 'Waitlist status updated successfully',
      restaurant: restaurantResult.rows[0],
      waitlist: waitlistResult.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating waitlist status:', err);
    res.status(500).json({ error: 'Failed to update waitlist status' });
  } finally {
    client.release();
  }
});

// Remove from waitlist
app.delete('/waitlist/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Get the entry with a FOR UPDATE lock to prevent concurrent modifications
    const entryResult = await client.query(
      'SELECT * FROM waitlist_entries WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (entryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = entryResult.rows[0];
    
    // Check if entry can be removed
    if (entry.status !== 'waiting') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Can only remove waiting entries' });
    }

    // Log the removal before deleting
    await logWaitlistEvent(entry.restaurant_id, 'removed', entry);

    // Remove the entry
    await client.query('DELETE FROM waitlist_entries WHERE id = $1', [id]);

    // Get remaining entries for recalculation
    const remainingEntries = await client.query(
      `SELECT id, party_size, created_at 
       FROM waitlist_entries 
       WHERE restaurant_id = $1 
       AND status = 'waiting'
       ORDER BY created_at ASC`,
      [entry.restaurant_id]
    );
    
    // Update wait times for remaining entries
    for (const [index, remainingEntry] of remainingEntries.rows.entries()) {
      const position = index + 1;
      const waitTime = calculateIndividualWaitTime(position, remainingEntry.party_size);
      
      await client.query(
        `UPDATE waitlist_entries 
         SET estimated_wait_time = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [waitTime, remainingEntry.id]
      );
    }

    // Update restaurant's wait time
    const newWaitTime = remainingEntries.rows.length > 0 
      ? calculateIndividualWaitTime(1, remainingEntries.rows[0].party_size)
      : 0;
    
    await client.query(
      'UPDATE restaurants SET current_wait_time = $1 WHERE id = $2',
      [newWaitTime, entry.restaurant_id]
    );

    // Get final updated data
    const [updatedRestaurant, updatedWaitlist] = await Promise.all([
      client.query('SELECT * FROM restaurants WHERE id = $1', [entry.restaurant_id]),
      client.query(
        `SELECT * FROM waitlist_entries 
         WHERE restaurant_id = $1 
         ORDER BY created_at ASC`,
        [entry.restaurant_id]
      )
    ]);

    await client.query('COMMIT');

    // Emit updates after successful commit
    await Promise.all([
      emitRestaurantUpdate(entry.restaurant_id, updatedRestaurant.rows[0]),
      emitWaitlistUpdate(entry.restaurant_id, updatedWaitlist.rows)
    ]);

    res.json({ 
      success: true,
      message: 'Entry removed successfully',
      restaurant: updatedRestaurant.rows[0],
      waitlist: updatedWaitlist.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error removing entry:', err);
    res.status(500).json({ error: 'Error removing entry' });
  } finally {
    client.release();
  }
});

// Cancel waitlist entry by phone number
app.post('/restaurant/:id/waitlist/cancel', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { phoneNumber } = req.body;
    
    console.log('❌ Canceling waitlist entry:', {
      restaurant_id: id,
      phone_number: phoneNumber
    });

    // Find the entry by phone number with FOR UPDATE lock
    const entryResult = await client.query(
      `SELECT * FROM waitlist_entries 
       WHERE restaurant_id = $1 
       AND phone_number = $2 
       AND status = $3 
       FOR UPDATE`,
      [id, phoneNumber, 'waiting']
    );

    if (entryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      console.log('❌ Waitlist entry not found');
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    const entry = entryResult.rows[0];

    // Log the cancellation before deleting
    await logWaitlistEvent(id, 'cancelled', entry);

    // Remove the entry
    await client.query('DELETE FROM waitlist_entries WHERE id = $1', [entry.id]);

    // Get remaining entries for recalculation
    const remainingEntries = await client.query(
      `SELECT id, party_size, created_at 
       FROM waitlist_entries 
       WHERE restaurant_id = $1 
       AND status = 'waiting'
       ORDER BY created_at ASC`,
      [id]
    );
    
    // Update wait times for remaining entries
    for (const [index, remainingEntry] of remainingEntries.rows.entries()) {
      const position = index + 1;
      const waitTime = calculateIndividualWaitTime(position, remainingEntry.party_size);
      
      await client.query(
        `UPDATE waitlist_entries 
         SET estimated_wait_time = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [waitTime, remainingEntry.id]
      );
    }

    // Update restaurant's wait time
    const newWaitTime = remainingEntries.rows.length > 0 
      ? calculateIndividualWaitTime(1, remainingEntries.rows[0].party_size)
      : 0;
    
    await client.query(
      'UPDATE restaurants SET current_wait_time = $1 WHERE id = $2',
      [newWaitTime, id]
    );

    // Get final updated data
    const [updatedRestaurant, updatedWaitlist] = await Promise.all([
      client.query('SELECT * FROM restaurants WHERE id = $1', [id]),
      client.query(
        `SELECT * FROM waitlist_entries 
         WHERE restaurant_id = $1 
         ORDER BY created_at ASC`,
        [id]
      )
    ]);

    await client.query('COMMIT');

    // Emit updates after successful commit
    await Promise.all([
      emitRestaurantUpdate(id, updatedRestaurant.rows[0]),
      emitWaitlistUpdate(id, updatedWaitlist.rows)
    ]);

    console.log('✅ Cancelled waitlist entry:', { 
      entry_id: entry.id, 
      new_wait_time: newWaitTime 
    });
    
    res.json({ 
      success: true,
      message: 'Waitlist entry cancelled successfully',
      restaurant: updatedRestaurant.rows[0],
      waitlist: updatedWaitlist.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error cancelling waitlist entry:', err);
    res.status(500).json({ error: 'Error cancelling waitlist entry' });
  } finally {
    client.release();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(port, () => {
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
  console.log('🔌 WebSocket server is ready for connections');
});