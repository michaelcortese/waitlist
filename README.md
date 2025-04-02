# TableReady - Modern Waitlist Management System

TableReady is a cutting-edge waitlist management app that transforms how customers queue for restaurant tables. Built with Rust and PostgreSQL, it offers a robust, high-performance solution for both restaurants and customers.

## Features

### For Customers
- Join waitlists via QR code scanning or remote access
- Track position and estimated wait time in real-time
- Receive push notifications for status updates
- Multiple waitlist management
- Subscription-based access with unlimited remote entries
- Refund policy after 30-45 minutes

### For Restaurants
- Digital waitlist management
- Real-time wait time updates
- Customizable refund windows
- Maximum waitlist size control
- Staff dashboard for efficient management

## Technical Stack

### Backend
- Rust with Actix-web framework
- PostgreSQL database
- JWT authentication
- Stripe payment processing
- Push notification support

### Frontend (Coming Soon)
- React-based web application
- Progressive Web App (PWA) support
- Real-time updates via WebSocket
- QR code generation

## Getting Started

### Prerequisites
- Rust 1.70 or later
- PostgreSQL 14 or later
- Stripe account for payment processing
- Node.js 18+ (for frontend development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tableready.git
cd tableready
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
psql -U postgres -f backend/src/schema.sql
```

4. Build and run the backend:
```bash
cd backend
cargo build
cargo run
```

The server will start at `http://localhost:8080`

## API Documentation

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Authenticate user and get JWT token

### Waitlist Management
- `POST /restaurant` - Create a new restaurant
- `POST /restaurant/{id}/waitlist` - Add to waitlist
- `GET /restaurant/{id}/waitlist` - Get current waitlist
- `PUT /waitlist/{id}/position` - Update position
- `POST /waitlist/{id}/status` - Update status
- `DELETE /waitlist/{id}` - Remove from waitlist

### Subscription & Payments
- `POST /subscription` - Create subscription
- `POST /payment` - Process payment
- `GET /waitlist/{id}/refund-eligibility` - Check refund eligibility

### Notifications
- `POST /notification` - Send push notification

## Development

### Database Migrations
```bash
# Create a new migration
sqlx migrate add <migration_name>

# Run migrations
sqlx migrate run
```

### Testing
```bash
cargo test
```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- HTTPS required in production
- Rate limiting implemented
- Input validation and sanitization
- Secure payment processing via Stripe

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@tableready.com or join our Slack channel. 