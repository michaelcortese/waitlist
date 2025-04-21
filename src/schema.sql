-- src/schema.sql

-- Drop tables if they exist
DROP TABLE IF EXISTS waitlist_entries;
DROP TABLE IF EXISTS restaurants;

-- Create restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  current_wait_time INTEGER DEFAULT 0,
  refund_window_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create waitlist entries table
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  party_size INTEGER NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  estimated_wait_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_waitlist_restaurant ON waitlist_entries(restaurant_id);

-- Insert sample restaurant
INSERT INTO restaurants (id, name, address, phone, current_wait_time, refund_window_minutes)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Sample Restaurant',
  '123 Main St, Anytown, USA',
  '555-0123',
  30,
  15
); 