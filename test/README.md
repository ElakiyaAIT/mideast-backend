# Test Directory Structure

This directory contains all tests for the NestJS backend application.

## Directory Structure

```
test/
├── unit/                   # Unit tests
│   ├── modules/           # Module-specific unit tests
│   │   ├── auth/          # Auth module tests
│   │   ├── user/          # User module tests
│   │   └── ...            # Other module tests
│   └── *.spec.ts          # Root-level unit tests
├── e2e/                   # End-to-end tests
│   └── *.e2e-spec.ts      # E2E test files
├── utils/                 # Test utilities and helpers
│   ├── test-helpers.ts    # Common test helper functions
│   └── mock-factories.ts  # Mock object factories
├── jest-unit.json         # Jest config for unit tests
├── jest-e2e.json          # Jest config for e2e tests
└── README.md              # This file
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### E2E Tests Only

```bash
npm run test:e2e
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:cov
```

### Debug Mode

```bash
npm run test:debug
```

## Writing Tests

### Unit Tests

Unit tests should be placed in `test/unit/` following the same directory structure as the source code.

**Example:** For `src/modules/auth/auth.service.ts`, create `test/unit/modules/auth/auth.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/modules/auth/auth.service';
import { MockUserFactory } from '@test/utils/mock-factories';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // ... mock providers
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E Tests

E2E tests should be placed in `test/e2e/` and use the `.e2e-spec.ts` suffix.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);
  });
});
```

## Test Utilities

### Mock Factories

Use the mock factories in `test/utils/mock-factories.ts` to create consistent test data:

```typescript
import { MockUserFactory, MockRoleFactory } from '@test/utils/mock-factories';

const mockUser = MockUserFactory.create({ email: 'custom@example.com' });
const mockRole = MockRoleFactory.create({ name: 'admin' });
```

### Test Helpers

Use helper functions from `test/utils/test-helpers.ts`:

```typescript
import { createTestingModule, flushPromises } from '@test/utils/test-helpers';

// Create a testing module
const module = await createTestingModule({
  providers: [MyService],
});

// Wait for async operations
await flushPromises();
```

## Best Practices

1. **One test file per source file**: Each service, controller, or component should have its own test file
2. **Use descriptive test names**: Test names should clearly describe what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: Always mock services, databases, and external APIs
5. **Test edge cases**: Don't just test the happy path
6. **Keep tests isolated**: Each test should be independent and not rely on others
7. **Use factories for test data**: Use mock factories for consistent test data
8. **Clean up after tests**: Use `afterEach` or `afterAll` to clean up resources

## Path Aliases

The following path aliases are available in tests:

- `@/` - Maps to `src/`
- `@common/` - Maps to `src/common/`
- `@modules/` - Maps to `src/modules/`
- `@database/` - Maps to `src/database/`
- `@test/` - Maps to `test/`

Example:

```typescript
import { AuthService } from '@/modules/auth/auth.service';
import { MockUserFactory } from '@test/utils/mock-factories';
```

## TypeScript Configuration

Tests use `tsconfig.test.json` which extends the main `tsconfig.json` with additional test-specific settings.

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- `coverage/unit/` - Unit test coverage
- `coverage/` - Combined coverage

Open `coverage/lcov-report/index.html` in a browser to view detailed coverage reports.

## Continuous Integration

Tests are automatically run in CI/CD pipelines. Ensure all tests pass before merging pull requests.

## Troubleshooting

### Import Errors

If you encounter import errors, ensure:

1. Path aliases are correctly configured in `tsconfig.json` and Jest config
2. The imported file exists
3. You're using the correct path alias

### Timeout Errors

For tests that take longer than 5 seconds, increase the timeout:

```typescript
it('should handle long operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Mock Issues

If mocks aren't working as expected:

1. Check that you're using `jest.fn()` correctly
2. Clear mocks between tests with `jest.clearAllMocks()`
3. Use `mockResolvedValue` for async functions
4. Use `mockReturnValue` for sync functions
