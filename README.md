# Sonic Panel Backend - Fastify TypeScript

A high-performance REST API backend built with Fastify and TypeScript for the Sonic Panel admin dashboard.

## Features

- **Fastify**: Fast and low overhead web framework
- **TypeScript**: Type-safe development
- **MongoDB**: Document database with Mongoose ODM
- **JWT Authentication**: Secure token-based authentication
- **CORS & Helmet**: Security middleware
- **Zod Validation**: Runtime schema validation
- **Bcrypt**: Password hashing

## Prerequisites

- Node.js 18+
- MongoDB 4.0+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sonic-panel
JWT_SECRET=your-secret-key-change-this-in-production
CORS_ORIGIN=http://localhost:3000
```

## Development

Run the development server with hot reload:
```bash
npm run dev
```

The server will start at `http://localhost:3001`

## Build

Build TypeScript to JavaScript:
```bash
npm run build
```

## Production

Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Users
- `GET /api/users` - List all users (requires auth)
- `GET /api/users/:id` - Get user by ID (requires auth)
- `PUT /api/users/:id` - Update user (requires auth)
- `DELETE /api/users/:id` - Delete user (requires auth)

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (requires auth)
- `PUT /api/products/:id` - Update product (requires auth)
- `DELETE /api/products/:id` - Delete product (requires auth)

### Health
- `GET /health` - Health check endpoint

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── config/
│   └── database.ts       # MongoDB connection
├── models/
│   ├── User.ts           # User schema and model
│   └── Product.ts        # Product schema and model
└── routes/
    ├── auth.ts           # Authentication routes
    ├── users.ts          # User management routes
    └── products.ts       # Product management routes
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

## License

MIT
