# Email Module - Quick Start Guide

## 🚀 Setup (5 Minutes)

### 1. Install Redis

```bash
# Windows (using Chocolatey)
choco install redis-64

# macOS
brew install redis

# Linux
sudo apt-get install redis-server

# Start Redis
redis-server
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=      # Optional, leave empty for local
```

### 3. Verify Installation

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Install dependencies (already done)
npm install
```

### 4. Start Application

```bash
# Development mode (API + Worker in same process)
npm run start:dev

# Production mode (separate processes)
# Terminal 1 - API Server
npm run start:prod

# Terminal 2 - Email Worker (scalable)
npm run start:worker --instances=3
```

---

## 📧 Usage Examples

### Example 1: Send Password Reset Email

```typescript
import { EmailService } from './modules/email/email.service';

@Injectable()
export class AuthService {
  constructor(private emailService: EmailService) {}

  async forgotPassword(email: string) {
    // Enqueue email job (returns immediately, non-blocking)
    const jobId = await this.emailService.sendTemplatedEmail({
      to: email,
      subject: 'Password Reset Request',
      templateName: 'forgot-password',
      templateVariables: {
        userName: 'John',
        resetUrl: 'https://example.com/reset?token=abc123',
        expiryTime: '1 hour',
      },
      language: 'en', // Optional, defaults to 'en'
    });

    console.log(`Email job enqueued: ${jobId}`);
    // API returns immediately, worker processes in background
  }
}
```

### Example 2: Send Bulk Emails

```typescript
async sendBulkNotifications(users: User[]) {
  const emails = users.map(user => ({
    to: user.email,
    subject: 'New Feature Announcement',
    templateName: 'newsletter',
    templateVariables: {
      firstName: user.firstName,
      feature: 'Real-time bidding',
    },
    language: user.language || 'en',
  }));

  const jobIds = await this.emailService.sendBulkTemplatedEmails(emails);
  console.log(`${jobIds.length} email jobs enqueued`);
}
```

---

## 🎨 Create Email Templates

### Template Location

```
src/modules/email/templates/
├── forgot-password.hbs        # Default (English)
├── forgot-password_es.hbs     # Spanish version
├── newsletter.hbs             # Custom template
└── plain.hbs                  # Fallback template
```

### Template Example

**File**: `welcome.hbs`

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .button {
        background: #007bff;
        color: white;
        padding: 12px 24px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome, {{userName}}!</h1>
      <p>Thank you for joining {{appName}}.</p>
      <a href="{{verificationUrl}}" class="button">Verify Email</a>
      <p>This link expires in {{expiryTime}}.</p>
    </div>
  </body>
</html>
```

### Use Custom Template

```typescript
await this.emailService.sendTemplatedEmail({
  to: 'user@example.com',
  subject: 'Welcome to Our Platform',
  templateName: 'welcome', // Loads welcome.hbs
  templateVariables: {
    userName: 'John Doe',
    appName: 'MidEast Equipment',
    verificationUrl: 'https://example.com/verify?token=xyz',
    expiryTime: '24 hours',
  },
});
```

---

## 🔍 Monitor Queue

### Option 1: Redis CLI

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Check queue length
LLEN bull:email-queue:wait

# View job details
HGETALL bull:email-queue:1
```

### Option 2: Bull Board (Recommended)

Install Bull Board for visual queue monitoring:

```bash
npm install @bull-board/api @bull-board/nestjs
```

Add to your app:

```typescript
// app.module.ts
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

BullBoardModule.forRoot({
  route: '/queues',
  adapter: BullMQAdapter,
}),
```

Access dashboard: `http://localhost:4000/queues`

---

## 🛠️ Troubleshooting

### Issue: Jobs Not Processing

**Symptom**: Emails enqueued but not sent

**Solution**:

```bash
# 1. Check Redis is running
redis-cli ping

# 2. Check worker is running
ps aux | grep node

# 3. Check logs
# Look for: "Email job enqueued" → "Processing email job" → "Email sent successfully"

# 4. Restart worker
npm run start:dev
```

### Issue: Redis Connection Failed

**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**:

```bash
# Start Redis server
redis-server

# Or check if different port
redis-cli -p 6380 ping
```

### Issue: SMTP Error

**Symptom**: `Email job failed: SMTP connection failed`

**Solution**:

1. Check SMTP credentials in `config/local.yaml`
2. For Gmail: Enable "Less secure app access" or use App Password
3. Check firewall allows port 465/587

---

## 📊 Performance Tips

### 1. Scale Workers Independently

```bash
# Run multiple worker instances
pm2 start dist/main.js --name worker-1 --instances 3
```

### 2. Adjust Retry Configuration

Edit `src/modules/email/constants/email.constants.ts`:

```typescript
export const EMAIL_QUEUE_OPTIONS = {
  attempts: 5, // Increase retries
  backoff: {
    type: 'exponential',
    delay: 1000, // Faster initial retry
  },
};
```

### 3. Optimize Bulk Sending

```typescript
// Instead of loop
for (const user of users) {
  await emailService.sendTemplatedEmail({ ... });  // ❌ Slow
}

// Use bulk method
await emailService.sendBulkTemplatedEmails(users.map(...));  // ✅ Fast
```

---

## 🧪 Testing

### Test Queue Locally

```typescript
// test/email.e2e-spec.ts
describe('Email Queue', () => {
  it('should enqueue email job', async () => {
    const jobId = await emailService.sendTemplatedEmail({
      to: 'test@example.com',
      subject: 'Test',
      templateName: 'plain',
      templateVariables: { message: 'Hello' },
    });

    expect(jobId).toBeDefined();
    // Job is enqueued, worker will process it
  });
});
```

### Mock Email in Tests

```typescript
const mockEmailService = {
  sendTemplatedEmail: jest.fn().mockResolvedValue('job-123'),
};
```

---

## 📈 Production Checklist

- [ ] Redis configured with persistence
- [ ] Redis password set (production)
- [ ] Worker process separated from API
- [ ] Multiple worker instances running
- [ ] Bull Board dashboard configured
- [ ] Email templates tested
- [ ] SMTP credentials secured (environment variables)
- [ ] Monitoring/alerting setup
- [ ] Failed job notifications configured

---

## 🔗 Related Files

- **Configuration**: `src/modules/email/constants/email.constants.ts`
- **Producer**: `src/modules/email/email.service.ts`
- **Consumer**: `src/modules/email/email.processor.ts`
- **Module**: `src/modules/email/email.module.ts`
- **Templates**: `src/modules/email/templates/*.hbs`

---

## 📚 Learn More

- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS Queues](https://docs.nestjs.com/techniques/queues)
- [Handlebars Templates](https://handlebarsjs.com/)
- [Nodemailer](https://nodemailer.com/)

---

**Need Help?** Check `EMAIL_REFACTORING_SUMMARY.md` for architecture details.
