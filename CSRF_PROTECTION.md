# CSRF Protection Implementation Guide

## Overview

This application implements **Double Submit Cookie CSRF Protection**, following OWASP best practices. The implementation provides production-ready security against Cross-Site Request Forgery attacks.

## Table of Contents

- [Architecture](#architecture)
- [Security Features](#security-features)
- [Setup Instructions](#setup-instructions)
- [Frontend Integration](#frontend-integration)
- [Backend Usage](#backend-usage)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Architecture

### Double Submit Cookie Pattern

The implementation uses the **Double Submit Cookie** pattern:

1. **Token Generation**: Server generates a cryptographically secure random token
2. **Cookie Storage**: Token is stored in an HttpOnly, Secure cookie (`__Host-csrf-token`)
3. **Header Transmission**: Client must send the same token in the `X-CSRF-Token` header
4. **Token Validation**: Server validates that cookie token matches header token
5. **Constant-Time Comparison**: Prevents timing attacks during validation

### Components

```
src/common/security/csrf/
├── csrf.service.ts          # Token generation and validation logic
├── csrf.guard.ts            # Centralized protection guard
├── csrf.controller.ts       # Token endpoint for frontend
├── csrf.module.ts           # Module configuration
├── decorators/
│   └── csrf-exempt.decorator.ts  # Opt-out decorator
└── index.ts                 # Public API exports
```

---

## Security Features

### ✅ OWASP Compliant

- **Double Submit Cookie Pattern**: Industry-standard CSRF protection
- **Secure Token Generation**: 256-bit cryptographically secure random tokens
- **Constant-Time Comparison**: Prevents timing-based attacks
- **Automatic Protection**: Applied globally to all state-changing requests

### ✅ Cookie Security

```typescript
{
  httpOnly: true,        // Prevents XSS attacks
  secure: true,          // HTTPS only in production
  sameSite: 'strict',    // Additional CSRF protection
  path: '/',
  maxAge: 3600000,       // 1 hour
}
```

### ✅ Protected HTTP Methods

- ✅ **POST** - Creating resources
- ✅ **PUT** - Replacing resources
- ✅ **PATCH** - Updating resources
- ✅ **DELETE** - Removing resources

### ✅ Excluded HTTP Methods

- ⚪ **GET** - Safe/idempotent operations
- ⚪ **HEAD** - Metadata retrieval
- ⚪ **OPTIONS** - CORS preflight

---

## Setup Instructions

### 1. Environment Configuration

Create or update your `.env` file:

```bash
# CSRF Protection
CSRF_SECRET=your-very-long-and-secure-random-string-min-32-characters

# Production Example (generate using: openssl rand -base64 48)
CSRF_SECRET=8jK9mL2nO5pQ7rS1tU3vW6xY0zA4bC8dE1fG3hI5jK7lM9nO2pQ5rS8tU1vW4xY7zA0
```

**⚠️ Security Requirements:**

- Minimum 32 characters
- Use cryptographically secure random generation
- Different for each environment (dev, staging, prod)
- Store securely (never commit to version control)

**Generate Secure Secret:**

```bash
# Linux/Mac
openssl rand -base64 48

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 2. Configuration File

Update your YAML configuration file (e.g., `config/production.yaml`):

```yaml
security:
  csrf:
    enabled: true
    secret: ${CSRF_SECRET} # Will be overridden by env var
  cors:
    origin:
      - https://yourdomain.com
      - https://app.yourdomain.com
    credentials: true
```

### 3. Verify Installation

The CSRF module is already integrated in `app.module.ts`:

```typescript
import { CsrfModule } from './common/security/csrf/csrf.module';
import { CsrfGuard } from './common/security/csrf/csrf.guard';

@Module({
  imports: [
    CsrfModule,
    // ... other modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CsrfGuard, // Global CSRF protection
    },
  ],
})
export class AppModule {}
```

---

## Frontend Integration

### Step 1: Obtain CSRF Token

Call the token endpoint when your application initializes:

```typescript
// On application startup or user login
const response = await fetch('https://api.example.com/api/v1/csrf/token', {
  method: 'GET',
  credentials: 'include', // REQUIRED: Send/receive cookies
});

const { token, headerName } = await response.json();

// Store token in memory (NOT localStorage for security)
window.__CSRF_TOKEN__ = token;
window.__CSRF_HEADER__ = headerName; // 'x-csrf-token'
```

**Expected Response:**

```json
{
  "token": "3Hf9kL2mN5pQ8rS1tU4vW7xY0zA3bC6dE9fG2hI5jK8lM1nO4pQ7rS0tU3vW6xY9zA2",
  "headerName": "x-csrf-token",
  "cookieName": "__Host-csrf-token",
  "message": "CSRF token generated successfully",
  "instructions": {
    "cookie": "The token has been set as an HttpOnly cookie automatically",
    "header": "Include the token in the 'x-csrf-token' header for all POST, PUT, PATCH, DELETE requests",
    "example": {
      "headerName": "x-csrf-token",
      "headerValue": "3Hf9kL2mN5pQ8rS1tU4vW7xY0zA3bC6dE9fG2hI5jK8lM1nO4pQ7rS0tU3vW6xY9zA2"
    }
  }
}
```

### Step 2: Include Token in Requests

#### Using Fetch API

```typescript
async function createUser(userData: any) {
  const response = await fetch('https://api.example.com/api/v1/users', {
    method: 'POST',
    credentials: 'include', // REQUIRED: Send cookies
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': window.__CSRF_TOKEN__, // Include token
    },
    body: JSON.stringify(userData),
  });

  return response.json();
}
```

#### Using Axios

```typescript
import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = true; // Send cookies with requests

// Set CSRF token on axios instance
const api = axios.create({
  baseURL: 'https://api.example.com/api/v1',
  withCredentials: true,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const csrfToken = window.__CSRF_TOKEN__;
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Handle 403 CSRF errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.message === 'CSRF token validation failed'
    ) {
      // Refresh CSRF token
      const { token } = await refreshCsrfToken();
      window.__CSRF_TOKEN__ = token;

      // Retry original request
      error.config.headers['X-CSRF-Token'] = token;
      return api.request(error.config);
    }
    return Promise.reject(error);
  },
);

// Use the configured client
await api.post('/users', userData);
```

#### Using React Query

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';

// Fetch CSRF token on mount
function useCsrfToken() {
  return useQuery({
    queryKey: ['csrf-token'],
    queryFn: async () => {
      const response = await fetch('/api/v1/csrf/token', {
        credentials: 'include',
      });
      const data = await response.json();
      return data.token;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: true,
  });
}

// Use token in mutations
function useCreateUser() {
  const { data: csrfToken } = useCsrfToken();

  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
  });
}
```

### Step 3: Handle Token Expiration

```typescript
async function refreshCsrfToken() {
  const response = await fetch('/api/v1/csrf/token', {
    credentials: 'include',
  });
  const { token } = await response.json();
  window.__CSRF_TOKEN__ = token;
  return { token };
}

// Refresh token periodically (e.g., every 30 minutes)
setInterval(refreshCsrfToken, 30 * 60 * 1000);
```

---

## Backend Usage

### Protected Routes (Default)

All POST, PUT, PATCH, DELETE routes are automatically protected:

```typescript
@Controller('users')
export class UserController {
  // ✅ Automatically protected by CSRF
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // ✅ Automatically protected
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  // ✅ Automatically protected
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // ⚪ Not protected (GET is idempotent)
  @Get()
  async findAll() {
    return this.userService.findAll();
  }
}
```

### Exempt Specific Routes

Use `@CsrfExempt()` decorator for special cases:

```typescript
import { CsrfExempt } from '@/common/security/csrf';

@Controller('webhooks')
export class WebhookController {
  // Webhook from third-party service
  @Post('stripe')
  @CsrfExempt() // ⚠️ Exempt from CSRF (has signature verification instead)
  async handleStripeWebhook(@Body() payload: any) {
    // Verify webhook signature
    return this.webhookService.handleStripe(payload);
  }
}

@Controller('auth')
export class AuthController {
  // Initial login endpoint (before CSRF token is established)
  @Post('login')
  @CsrfExempt() // ⚠️ Exempt (CSRF token will be issued after login)
  async login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  // All other auth endpoints remain protected
  @Post('logout')
  // ✅ Protected by CSRF
  async logout() {
    return this.authService.logout();
  }
}
```

### Manual Token Operations

```typescript
import { CsrfService } from '@/common/security/csrf';

@Controller('session')
export class SessionController {
  constructor(private readonly csrfService: CsrfService) {}

  @Post('start')
  startSession(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Generate new CSRF token
    const token = this.csrfService.generateToken(req, res);

    return { message: 'Session started', token };
  }

  @Post('end')
  endSession(@Res({ passthrough: true }) res: Response) {
    // Invalidate CSRF token
    this.csrfService.invalidateToken(res);

    return { message: 'Session ended' };
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { Test } from '@nestjs/testing';
import { CsrfService } from './csrf.service';
import { ConfigService } from '@/common/config/config.service';
import { LoggerService } from '@/common/logger/logger.service';

describe('CsrfService', () => {
  let service: CsrfService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CsrfService,
        {
          provide: ConfigService,
          useValue: {
            getEnv: () => 'test',
            getCsrfSecret: () => 'test-secret-minimum-32-chars-long',
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CsrfService>(CsrfService);
  });

  it('should generate valid CSRF token', () => {
    const req = {} as any;
    const res = {
      cookie: jest.fn(),
    } as any;

    const token = service.generateToken(req, res);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});
```

### E2E Tests

```typescript
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('CSRF Protection (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Initialize app
  });

  it('should allow GET requests without CSRF token', () => {
    return request(app.getHttpServer()).get('/api/v1/users').expect(200);
  });

  it('should reject POST requests without CSRF token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/users')
      .send({ name: 'Test User' })
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe('CSRF token validation failed');
      });
  });

  it('should allow POST requests with valid CSRF token', async () => {
    // Get CSRF token
    const tokenResponse = await request(app.getHttpServer()).get('/api/v1/csrf/token').expect(200);

    const { token } = tokenResponse.body;
    const cookies = tokenResponse.headers['set-cookie'];

    // Make request with token
    return request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', token)
      .send({ name: 'Test User' })
      .expect(201);
  });
});
```

### Manual Testing with cURL

```bash
# 1. Get CSRF token
curl -v -X GET http://localhost:3000/api/v1/csrf/token \
  -c cookies.txt

# Extract token from response
TOKEN="<token-from-response>"

# 2. Make protected request
curl -v -X POST http://localhost:3000/api/v1/users \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"name":"Test User"}'
```

---

## Troubleshooting

### Common Issues

#### 1. **403 Forbidden - CSRF token validation failed**

**Causes:**

- Token not included in request header
- Cookie not sent with request (missing `credentials: 'include'`)
- Token expired or invalid
- Cookie blocked by browser (third-party cookie restrictions)

**Solutions:**

```typescript
// Ensure credentials are included
fetch('/api/v1/users', {
  credentials: 'include', // ✅ REQUIRED
  headers: {
    'X-CSRF-Token': token, // ✅ Include token
  },
});

// Refresh token if expired
if (error.response?.status === 403) {
  await refreshCsrfToken();
  // Retry request
}
```

#### 2. **CSRF secret not configured**

**Error:** `CSRF secret is not configured. Set CSRF_SECRET in environment variables`

**Solution:**

```bash
# Add to .env
CSRF_SECRET=your-secure-random-string-min-32-characters
```

#### 3. **Cookies not being set**

**Causes:**

- CORS not configured with `credentials: true`
- Cookie domain mismatch
- HTTPS required but using HTTP in production

**Solutions:**

```typescript
// Backend: Enable credentials in CORS
app.enableCors({
  origin: 'https://yourdomain.com',
  credentials: true, // ✅ REQUIRED
});

// Frontend: Send credentials
fetch('/api/v1/csrf/token', {
  credentials: 'include', // ✅ REQUIRED
});
```

#### 4. **Token works in development but fails in production**

**Causes:**

- Secure flag requires HTTPS
- SameSite=Strict blocks cross-origin requests
- Cookie prefix `__Host-` requires no domain

**Solutions:**

- Ensure production uses HTTPS
- Verify frontend and backend are on same domain or use SameSite=None with Secure
- Check browser console for cookie warnings

### Debug Mode

Enable debug logging:

```typescript
// In csrf.service.ts, the logger already logs at debug level
// Enable debug logs in your logger configuration
{
  logLevel: 'debug', // Enable in development
}
```

### Security Audit Checklist

- [ ] CSRF_SECRET is at least 32 characters
- [ ] CSRF_SECRET is different per environment
- [ ] Cookies have `httpOnly: true`
- [ ] Cookies have `secure: true` in production
- [ ] CORS credentials enabled
- [ ] Frontend sends `credentials: 'include'`
- [ ] Token included in `X-CSRF-Token` header
- [ ] Token refreshed on 403 errors
- [ ] Webhooks properly use `@CsrfExempt()`
- [ ] Login endpoints properly use `@CsrfExempt()`

---

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [csrf-csrf NPM Package](https://www.npmjs.com/package/csrf-csrf)
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)

---

## Support

For questions or issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review server logs for CSRF-related warnings
3. Verify environment configuration
4. Test with cURL to isolate frontend issues

**Security Concerns:**
If you discover a security vulnerability, please report it privately to the security team.
