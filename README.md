# Sonic Panel Backend - Express TypeScript

A high-performance REST API backend built with Express and TypeScript for the Sonic Panel admin dashboard.

## Features

- **Express**: Fast, unopinionated, minimalist web framework
- **TypeScript**: Type-safe development
- **MongoDB**: Document database with Mongoose ODM
- **JWT Authentication**: Secure token-based authentication
- **CORS & Helmet**: Security middleware
- **Zod Validation**: Runtime schema validation
- **Bcrypt**: Password hashing
- **Morgan**: HTTP request logger

## Prerequisites

- Node.js 18+
- MongoDB 4.0+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
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
# or
yarn dev
```

The server will start at `http://localhost:3001`

## Build

Build TypeScript to JavaScript:
```bash
npm run build
# or
yarn build
```

## Production

Start the production server:
```bash
npm start
# or
yarn start
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

### Access
- `GET /api/access` - Check access and balance

### API Keys
- `GET /api/api_key` - Get API key
- `POST /api/api_key` - Create/validate API key

### Tasks
- `POST /api/createTask` - Create a new task
- `GET /api/createTask/tasks` - List all tasks

### Initialization
- `GET /api/init/setup` - Initialize database with default settings

### Welcome
- `GET /api` - Welcome endpoint with client info

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── middleware/
│   └── auth.ts           # JWT authentication middleware
├── models/
│   ├── User.ts           # User schema and model
│   ├── ApiKey.ts         # API Key schema and model
│   ├── Device.ts         # Device schema and model
│   ├── Settings.ts       # Settings schema and model
│   └── Task.ts           # Task schema and model
└── routes/
    ├── auth.ts           # Authentication routes
    ├── users.ts          # User management routes
    ├── access.ts         # Access control routes
    ├── apiKey.ts         # API key management routes
    ├── createTask.ts     # Task creation routes
    ├── init.ts           # Initialization routes
    └── welcome.ts        # Welcome/info routes
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

## Migration from Fastify

This application has been converted from Fastify to Express.js. Key changes include:

- Replaced `@fastify/cors` with `cors`
- Replaced `@fastify/helmet` with `helmet`
- Replaced `@fastify/jwt` with `jsonwebtoken`
- Added `morgan` for request logging
- Converted all route handlers from Fastify plugins to Express routers
- Updated middleware to use Express request/response objects

## License

MIT
