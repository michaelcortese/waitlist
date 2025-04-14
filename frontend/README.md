# Waitlist Frontend

A React-based frontend for the restaurant waitlist application.

## Features

- Join a restaurant waitlist
- View estimated wait times
- Receive confirmation when added to the waitlist
- Mobile-friendly design

## Backend Integration

This frontend is integrated with a Rust-based backend API. The integration includes:

- Authentication services (login, register, logout)
- Restaurant services (create, update wait time)
- Waitlist services (add, get, update status, remove)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Backend Connection

The frontend is configured to connect to the backend at `http://localhost:8080`. If your backend is running on a different port or host, update the `baseURL` in `src/services/api.js`.

## Project Structure

- `src/components/` - React components
- `src/services/` - API service modules
- `src/context/` - React context providers
- `src/assets/` - Static assets

## Development

To start the development server:

```
npm run dev
```

To build for production:

```
npm run build
```

## License

MIT
