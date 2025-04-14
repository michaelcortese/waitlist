-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    current_wait_time INTEGER DEFAULT 0,
    refund_window_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create waitlist_entries table
CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id),
    customer_name VARCHAR NOT NULL,
    party_size INTEGER NOT NULL,
    phone_number VARCHAR NOT NULL,
    notes TEXT,
    status VARCHAR NOT NULL,
    position INTEGER DEFAULT 0,
    payment_status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 