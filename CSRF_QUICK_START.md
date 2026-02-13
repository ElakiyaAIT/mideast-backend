# CSRF Protection - Quick Start Guide

## 🚀 30-Second Setup

### 1. Set Environment Variable

```bash
# Generate secure secret (32+ characters)
openssl rand -base64 48

# Add to .env
CSRF_SECRET=<generated-secret>
```

### 2. Update Configuration

```yaml
# config/production.yaml
security:
  csrf:
    enabled: true
```

### 3. Frontend Integration

```typescript
// Get token on app init
const { token } = await fetch('/api/v1/csrf/token', {
  credentials: 'include',
}).then((r) => r.json());

// Store in memory
window.__CSRF_TOKEN__ = token;

// Include in requests
fetch('/api/v1/users', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': window.__CSRF_TOKEN__,
  },
  body: JSON.stringify(data),
});
```

---

## 📋 Common Patterns

### Axios Configuration

```typescript
import axios from 'axios';

// Get CSRF token
const { token } = await axios
  .get('/api/v1/csrf/token', {
    withCredentials: true,
  })
  .then((res) => res.data);

// Configure defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-CSRF-Token'] = token;

// Use normally
await axios.post('/api/v1/users', data);
```

### React Hook

```typescript
function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/csrf/token', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setToken(data.token));
  }, []);

  return token;
}

// Usage
const csrfToken = useCsrfToken();
```

### Backend Exemption

```typescript
import { CsrfExempt } from '@/common/security/csrf';

@Controller('webhooks')
export class WebhookController {
  @Post('stripe')
  @CsrfExempt() // Skip CSRF for webhooks
  handleWebhook() {}
}
```

---

## ⚠️ Important Notes

### ✅ DO:

- Include `credentials: 'include'` in all fetch requests
- Store token in memory (not localStorage)
- Refresh token on 403 errors
- Use `@CsrfExempt()` for webhooks and initial login

### ❌ DON'T:

- Store token in localStorage (XSS risk)
- Forget to send credentials with requests
- Exempt routes unnecessarily
- Use secrets shorter than 32 characters

---

## 🐛 Troubleshooting

### 403 Forbidden Error

```typescript
// Check: Token included?
headers: {
  'X-CSRF-Token': token // ✅
}

// Check: Credentials sent?
fetch(url, {
  credentials: 'include' // ✅
})

// Check: Token expired?
if (response.status === 403) {
  await refreshCsrfToken();
}
```

### Cookies Not Set

```typescript
// Backend CORS
app.enableCors({
  origin: 'https://yourdomain.com',
  credentials: true, // ✅ REQUIRED
});

// Frontend
fetch('/api/v1/csrf/token', {
  credentials: 'include', // ✅ REQUIRED
});
```

---

## 🔒 Security Checklist

- [ ] CSRF_SECRET set (32+ chars)
- [ ] Different secrets per environment
- [ ] HTTPS in production
- [ ] CORS credentials enabled
- [ ] Frontend sends credentials
- [ ] Token in X-CSRF-Token header
- [ ] Webhooks use @CsrfExempt()

---

## 📚 Full Documentation

See [CSRF_PROTECTION.md](./CSRF_PROTECTION.md) for complete documentation.

---

## 🆘 Quick Fixes

### Generate Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Test with cURL

```bash
# Get token
curl -c cookies.txt http://localhost:3000/api/v1/csrf/token

# Use token
curl -b cookies.txt \
  -H "X-CSRF-Token: <token>" \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' \
  http://localhost:3000/api/v1/endpoint
```

### Check Logs

```bash
# Look for CSRF-related logs
npm run start:dev | grep -i csrf
```
