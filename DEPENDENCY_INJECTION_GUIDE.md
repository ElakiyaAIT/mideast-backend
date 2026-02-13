# NestJS Dependency Injection - Quick Reference Guide

## The Interface + Token Pattern

### ✅ Correct Pattern (What We Use)

```typescript
// Step 1: Define the interface (compile-time contract)
export interface IStorageProvider {
  uploadFile(file: Express.Multer.File): Promise<UploadedFile>;
  deleteFile(fileUrl: string): Promise<void>;
}

// Step 2: Create injection token (runtime identifier)
export const STORAGE_PROVIDER_TOKEN = Symbol('STORAGE_PROVIDER');

// Step 3: Implement the interface
@Injectable()
export class DiskStorageProvider implements IStorageProvider {
  uploadFile(file: Express.Multer.File): Promise<UploadedFile> {
    // Implementation
  }
  
  deleteFile(fileUrl: string): Promise<void> {
    // Implementation
  }
}

// Step 4: Register in module
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER_TOKEN, // ✓ Use Symbol token
      useClass: DiskStorageProvider,
    },
  ],
})
export class UploadModule {}

// Step 5: Inject in service
@Injectable()
export class UploadService {
  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN) // ✓ Use @Inject with token
    private readonly storage: IStorageProvider // ✓ Type with interface
  ) {}
}
```

### ❌ Incorrect Pattern (What Causes Errors)

```typescript
// ❌ DON'T: Use interface as provider token
@Module({
  providers: [
    {
      provide: IStorageProvider, // ❌ ERROR: Interface used as value
      useClass: DiskStorageProvider,
    },
  ],
})
export class UploadModule {}

// ❌ DON'T: Inject without explicit token
@Injectable()
export class UploadService {
  constructor(
    private readonly storage: IStorageProvider // ❌ ERROR: Can't resolve
  ) {}
}
```

## When to Use Each Pattern

### Use Symbol Token (Recommended for Custom Providers)
```typescript
export const MY_PROVIDER_TOKEN = Symbol('MY_PROVIDER');

@Module({
  providers: [
    {
      provide: MY_PROVIDER_TOKEN,
      useClass: MyProviderImpl,
    },
  ],
})
```

**Best for:**
- Custom providers with interface contracts
- Pluggable architectures
- Provider swapping (testing/production)

### Use String Token (For Simple Cases)
```typescript
@Module({
  providers: [
    {
      provide: 'CONFIG_OPTIONS',
      useValue: { apiKey: '...' },
    },
  ],
})
```

**Best for:**
- Simple value providers
- Configuration objects
- One-off providers

### Use Class Token (For Class-Based DI)
```typescript
@Injectable()
export class DatabaseService {
  // Implementation
}

@Module({
  providers: [DatabaseService], // No explicit token needed
})
```

**Best for:**
- Concrete classes (not interfaces)
- No need for abstraction
- Simple class-to-class dependencies

## Common Patterns

### Pattern 1: Factory Provider with Token

```typescript
// Token
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

// Module
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: async (config: ConfigService) => {
        return await createConnection(config.getDatabaseConfig());
      },
      inject: [ConfigService],
    },
  ],
})
export class DatabaseModule {}

// Usage
@Injectable()
export class UserService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Connection
  ) {}
}
```

### Pattern 2: Multiple Implementations

```typescript
// Interface
export interface ILogger {
  log(message: string): void;
}

// Tokens
export const CONSOLE_LOGGER = Symbol('CONSOLE_LOGGER');
export const FILE_LOGGER = Symbol('FILE_LOGGER');

// Module
@Module({
  providers: [
    {
      provide: CONSOLE_LOGGER,
      useClass: ConsoleLogger,
    },
    {
      provide: FILE_LOGGER,
      useClass: FileLogger,
    },
  ],
})
export class LoggerModule {}

// Usage - Inject specific implementation
@Injectable()
export class AppService {
  constructor(
    @Inject(CONSOLE_LOGGER) private readonly consoleLogger: ILogger,
    @Inject(FILE_LOGGER) private readonly fileLogger: ILogger,
  ) {}
}
```

### Pattern 3: Testing with Tokens

```typescript
describe('UploadService', () => {
  let service: UploadService;
  let mockStorage: IStorageProvider;

  beforeEach(async () => {
    mockStorage = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: STORAGE_PROVIDER_TOKEN, // ✓ Use same token
          useValue: mockStorage, // ✓ Provide mock
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should upload file', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Error: "Cannot resolve dependency"
**Cause:** Token not registered in module
**Fix:** Add provider with token to module's `providers` array

### Error: "Type X only refers to a type"
**Cause:** Using interface/type as provider token
**Fix:** Create Symbol or string token, use with `@Inject()`

### Error: "Circular dependency"
**Cause:** Two services depend on each other
**Fix:** Use `forwardRef()` or refactor to remove circular dependency

## Best Practices

### ✅ DO
- Use Symbol tokens for custom providers
- Use `@Inject()` decorator explicitly
- Type parameters with interfaces
- Document tokens with JSDoc
- Export tokens from interface files

### ❌ DON'T
- Use interfaces as provider tokens
- Use implicit injection without tokens
- Use `any` type
- Create string tokens without constants
- Mix pattern styles in the same codebase

## Real-World Example: Storage Provider

Our storage provider implementation demonstrates the ideal pattern:

```typescript
// 1. Interface defines the contract
export interface IStorageProvider {
  uploadFile(file: Express.Multer.File, folder: string): Promise<UploadedFile>;
  deleteFile(fileUrl: string): Promise<void>;
  initialize(): Promise<void>;
  isAvailable(): boolean;
}

// 2. Token for DI
export const STORAGE_PROVIDER_TOKEN = Symbol('STORAGE_PROVIDER');

// 3. Multiple implementations
export class DiskStorageProvider implements IStorageProvider { /* ... */ }
export class S3StorageProvider implements IStorageProvider { /* ... */ }

// 4. Factory selects implementation
export class StorageProviderFactory {
  async createStorageProvider(): Promise<IStorageProvider> {
    switch (config.provider) {
      case 'disk': return new DiskStorageProvider(config.disk);
      case 's3': return new S3StorageProvider(config.s3);
    }
  }
}

// 5. Module registers with factory
@Module({
  providers: [
    StorageProviderFactory,
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: async (factory: StorageProviderFactory) => {
        return await factory.createStorageProvider();
      },
      inject: [StorageProviderFactory],
    },
  ],
})
export class UploadModule {}

// 6. Service injects via token
@Injectable()
export class UploadService {
  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storage: IStorageProvider
  ) {}
}
```

**Benefits:**
- ✅ Type-safe at compile time
- ✅ Flexible at runtime
- ✅ Easy to test
- ✅ Easy to extend
- ✅ Production-ready

## Summary

| Scenario | Token Type | Example |
|----------|-----------|---------|
| Custom provider with interface | Symbol | `Symbol('STORAGE_PROVIDER')` |
| Simple value/config | String | `'API_KEY'` or constant |
| Concrete class | Class | `DatabaseService` |
| Framework providers | Constant | `APP_GUARD`, `APP_FILTER` |

**Key Takeaway:** Interfaces are for compile-time type checking. Symbols/strings/classes are for runtime dependency injection. Use both together for type-safe, flexible DI.

---

*For more information, see: `TYPE_SAFETY_FIXES.md`*
