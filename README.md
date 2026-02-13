# Mid-East Backend

Enterprise-grade NestJS backend application following clean architecture principles, SOLID principles, and best practices.

## Features

- ✅ MongoDB with Mongoose (with indexing and validation)
- ✅ YAML-based configuration (local, dev, production)
- ✅ JWT Authentication (access + refresh tokens)
- ✅ Role-Based Access Control (RBAC)
- ✅ API Versioning
- ✅ Security Middlewares (CORS, CSRF, XSS, Helmet, Rate Limiting)
- ✅ Redis-backed Email Queue
- ✅ Centralized DTOs with Validation
- ✅ Production-grade Logging
- ✅ Strict TypeScript (no `any` types)
- ✅ ESLint + Prettier

## Architecture

The project follows clean architecture principles with clear separation of concerns:

```
src/
├── common/              # Shared utilities
│   ├── config/         # Configuration management
│   ├── dto/            # Shared DTOs
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/         # Authentication & authorization guards
│   ├── helpers/        # Utility functions
│   ├── interceptors/   # Request/response interceptors
│   ├── logger/         # Winston logger
│   ├── middlewares/    # Security middlewares
│   └── pipes/          # Validation pipes
└── modules/            # Feature modules
    ├── auth/           # Authentication module
    ├── user/           # User management
    ├── email/          # Email queue service
    ├── redis/          # Redis client
    └── database/       # Database configuration
```

## Installation

```bash
# Install dependencies
pnpm install
```

## Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update `.env` with your configuration values.

3. The application automatically loads YAML config files from `config/` directory based on `NODE_ENV`:
   - `local.yaml` - for local development
   - `dev.yaml` - for development environment
   - `production.yaml` - for production

## Running the Application

```bash
# Development
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

## API Endpoints

All endpoints are prefixed with the API version (e.g., `/v1`).

### Authentication

- `POST /v1/auth/register` - Register a new user
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout (requires authentication)

### Users

- `GET /v1/users` - List users (Admin/SuperAdmin only)
- `GET /v1/users/:id` - Get user by ID
- `POST /v1/users` - Create user (Admin/SuperAdmin only)
- `PATCH /v1/users/:id` - Update user
- `DELETE /v1/users/:id` - Delete user (SuperAdmin only)

## Security Features

- **JWT Authentication**: Access and refresh token pattern
- **RBAC**: Role-based access control with User, Admin, SuperAdmin roles
- **CORS**: Configurable CORS settings
- **CSRF Protection**: Cookie-based CSRF tokens
- **XSS Protection**: Input sanitization middleware
- **Helmet**: Security headers
- **Rate Limiting**: Centralized rate limiting
- **Input Validation**: Class-validator with DTOs
- **Password Security**: Node.js crypto (scrypt) hashing with strength validation

## Email Queue

Email sending is handled through a Redis-backed queue. Emails are queued and processed asynchronously.

## Code Quality

- **ESLint**: Strict rules, no `any` types allowed
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict mode enabled
- **Validation**: Class-validator for all inputs

## Environment Variables

Key environment variables (see `.env.example`):

- `NODE_ENV` - Environment (local, dev, production)
- `PORT` - Server port
- `DATABASE_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port

## License

UNLICENSED
