# Security Features

This document provides an overview of the security features implemented in this NestJS application.

## Table of Contents

- [CSRF Protection](#csrf-protection)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Rate Limiting](#rate-limiting)
- [XSS Protection](#xss-protection)
- [Security Headers](#security-headers)
- [Best Practices](#best-practices)

---

## CSRF Protection

### Overview

The application implements **Double Submit Cookie CSRF Protection** following OWASP best practices.

### Features

- ✅ Cryptographically secure token generation (256-bit)
- ✅ HttpOnly, Secure, SameSite cookies
- ✅ Constant-time token comparison
- ✅ Automatic protection for POST, PUT, PATCH, DELETE
- ✅ Centralized guard implementation
- ✅ Token rotation and expiration

### Quick Start

```bash
# 1. Set environment variable
CSRF_SECRET=$(openssl rand -base64 48)

# 2. Frontend integration
const { token } = await fetch('/api/v1/csrf/token', {
  credentials: 'include'
}).then(r => r.json());

# 3. Include in requests
fetch('/api/v1/users', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': token
  },
  body: JSON.stringify(data)
});
```

### Documentation

- **Complete Guide**: [CSRF_PROTECTION.md](./CSRF_PROTECTION.md)
- **Quick Reference**: [CSRF_QUICK_START.md](./CSRF_QUICK_START.md)
- **Implementation Details**: [CSRF_IMPLEMENTATION_SUMMARY.md](./CSRF_IMPLEMENTATION_SUMMARY.md)
- **Frontend Examples**: [examples/frontend-csrf-integration.ts](./examples/frontend-csrf-integration.ts)

---

## Authentication

### JWT-Based Authentication

The application uses JSON Web Tokens (JWT) for authentication:

- **Access Tokens**: Short-lived tokens for API access (15 minutes)
- **Refresh Tokens**: Long-lived tokens for obtaining new access tokens (7 days)

### Token Storage

- Access tokens: HttpOnly cookies
- Refresh tokens: HttpOnly cookies
- All cookies use Secure flag in production
- SameSite=Strict for CSRF protection

### Configuration

```yaml
# config/production.yaml
jwt:
  accessTokenSecret: ${JWT_ACCESS_SECRET}
  refreshTokenSecret: ${JWT_REFRESH_SECRET}
  accessTokenExpiration: 15m
  refreshTokenExpiration: 7d

security:
  cookies:
    accessToken:
      httpOnly: true
      secure: true
      sameSite: 'strict'
    refreshToken:
      httpOnly: true
      secure: true
      sameSite: 'strict'
```

---

## Authorization

### Role-Based Access Control (RBAC)

The application implements RBAC for fine-grained access control:

- Roles define user permissions
- Guards enforce role requirements
- Decorators simplify authorization checks

### Usage

```typescript
@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles('admin', 'super-admin')
  getDashboard() {
    // Only accessible by admin and super-admin roles
  }
}
```

### Documentation

- **RBAC Guide**: [RBAC_QUICK_START.md](./RBAC_QUICK_START.md)

---

## Rate Limiting

### Throttling

The application uses NestJS Throttler to prevent abuse:

```yaml
# config/production.yaml
security:
  rateLimit:
    windowMs: 900000 # 15 minutes
    max: 100 # 100 requests per window
```

### Configuration

Rate limiting is applied globally via `ThrottlerGuard`:

```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Custom Limits

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  login() {
    // ...
  }
}
```

---

## XSS Protection

### Input Sanitization

The application sanitizes user input to prevent XSS attacks:

```typescript
// XssMiddleware applied globally
export class XssMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (req.body) {
      req.body = this.sanitize(req.body);
    }
    if (req.query) {
      req.query = this.sanitize(req.query);
    }
    next();
  }

  private sanitize(obj: any): any {
    if (typeof obj === 'string') {
      return xss(obj);
    }
    // ... recursively sanitize objects
  }
}
```

### Output Encoding

- HTML entities are encoded in responses
- Content-Type headers are set correctly
- CSP headers prevent inline scripts

---

## Security Headers

### Helmet

The application uses Helmet to set security headers:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
```

### Headers Set

- `Content-Security-Policy`: Prevents XSS
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-Frame-Options`: Prevents clickjacking
- `Strict-Transport-Security`: Enforces HTTPS
- `X-XSS-Protection`: Browser XSS protection

---

## CORS Configuration

### Cross-Origin Resource Sharing

```typescript
app.enableCors({
  origin: ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
});
```

### Configuration

```yaml
# config/production.yaml
security:
  cors:
    origin:
      - 'https://yourdomain.com'
      - 'https://www.yourdomain.com'
    credentials: true
```

---

## Best Practices

### Environment Variables

✅ **Store secrets in environment variables**

```bash
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CSRF_SECRET=...
DATABASE_URI=...
```

✅ **Use different secrets per environment**

- Development: Short, memorable secrets
- Staging: Production-like secrets
- Production: Long, random secrets (32+ characters)

✅ **Never commit secrets to version control**

- Add `.env` to `.gitignore`
- Use `.env.example` as template
- Document required variables

### Secret Generation

```bash
# Generate secure secrets
openssl rand -base64 48

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### HTTPS

✅ **Always use HTTPS in production**

- Secure flag on cookies requires HTTPS
- Prevents man-in-the-middle attacks
- Protects tokens in transit

### Input Validation

✅ **Validate all user input**

```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
```

✅ **Use class-validator decorators**

- Type validation
- Length validation
- Format validation
- Custom validation

### Logging

✅ **Log security events**

- Failed login attempts
- CSRF validation failures
- Rate limit violations
- Unauthorized access attempts

✅ **Do NOT log sensitive data**

- Passwords
- Tokens
- Personal information
- Credit card numbers

### Error Messages

✅ **Use generic error messages**

- Don't reveal system details
- Don't leak database structure
- Don't expose file paths

❌ **Bad:**

```typescript
throw new Error('User with email user@example.com not found in users table');
```

✅ **Good:**

```typescript
throw new UnauthorizedException('Invalid credentials');
```

### Database Security

✅ **Use parameterized queries**

- Mongoose handles this automatically
- Never concatenate user input into queries

✅ **Implement access controls**

- Use database user accounts with minimal permissions
- Don't use root/admin accounts in application

✅ **Encrypt sensitive data**

- Hash passwords (bcrypt, argon2)
- Encrypt personal information
- Use secure storage for files

---

## Security Checklist

### Development

- [ ] All secrets in environment variables
- [ ] Input validation on all endpoints
- [ ] XSS protection enabled
- [ ] CSRF protection configured
- [ ] Authentication implemented
- [ ] Authorization guards in place
- [ ] Error messages are generic
- [ ] Logging configured (no sensitive data)

### Pre-Production

- [ ] HTTPS enabled
- [ ] Secure cookies enabled
- [ ] Rate limiting configured
- [ ] Security headers set (Helmet)
- [ ] CORS configured properly
- [ ] Secrets are production-grade (32+ chars)
- [ ] Different secrets per environment
- [ ] Database access controls configured

### Production

- [ ] All security features enabled
- [ ] Monitoring and alerting configured
- [ ] Security logs reviewed regularly
- [ ] Dependency vulnerabilities scanned
- [ ] Penetration testing completed
- [ ] Security incident response plan
- [ ] Backup and recovery tested
- [ ] Documentation up to date

---

## Security Vulnerabilities

### Reporting

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the security team privately
3. Provide detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response

- We will acknowledge receipt within 24 hours
- We will investigate and provide updates
- We will fix critical vulnerabilities immediately
- We will credit reporters (if desired)

---

## Additional Resources

### OWASP

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### NestJS

- [Security Best Practices](https://docs.nestjs.com/security/overview)
- [Authentication](https://docs.nestjs.com/security/authentication)
- [Authorization](https://docs.nestjs.com/security/authorization)

### Tools

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Scan dependencies
- [Snyk](https://snyk.io/) - Vulnerability scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing

---

## Maintenance

### Regular Tasks

- **Weekly**: Review security logs
- **Monthly**: Update dependencies (`npm audit`)
- **Quarterly**: Security audit
- **Annually**: Penetration testing

### Dependency Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

---

## Contact

For security-related questions or concerns, contact:

- Security Team: security@example.com
- Emergency: +1-XXX-XXX-XXXX (24/7)

---

**Remember: Security is an ongoing process, not a one-time task. Stay vigilant!**
