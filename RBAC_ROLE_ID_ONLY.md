# RBAC Implementation - Role ID Only

## Overview

This RBAC system uses **roleId exclusively** throughout the application. Role names, role strings, and role enums are **strictly forbidden** in application logic, guards, middleware, and APIs. Role names are only permitted in seeders for initial data creation.

## Core Principles

### ✅ What You MUST Use

- **roleId** (MongoDB ObjectId) in all database operations
- **roleId** in JWT tokens
- **roleId** in API requests/responses
- **roleId** in guards and middleware
- **roleId** in business logic

### ❌ What You MUST NOT Use

- Role names (Admin, Seller, Buyer) in application code
- Role enums (except in seeders)
- Hardcoded role strings
- Role name comparisons in guards or services

## Architecture

```
┌─────────────────────────────────────────┐
│         Application Startup             │
├─────────────────────────────────────────┤
│  1. RoleCacheService loads roleIds      │
│  2. Caches: adminRoleId, sellerRoleId   │
│     buyerRoleId from database           │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Controllers/Services/Guards         │
├─────────────────────────────────────────┤
│  Use ONLY roleIds from RoleCacheService │
│  @Roles(roleCacheService.adminRoleId)   │
│                                          │
│  Guards check: user.roleId === roleId   │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Database Operations             │
├─────────────────────────────────────────┤
│  User.roleId references Role._id        │
│  All queries use roleId (ObjectId)      │
└─────────────────────────────────────────┘
```

## Setup

### 1. Seed Roles (One Time)

```bash
# Seed all roles
npm run seed:roles

# Create admin user
npm run seed:admin-user
```

### 2. Application Startup

The `RoleCacheService` automatically caches roleIds when the application starts:

```typescript
// Happens automatically at startup
Admin Role ID: 65a1234567890abcdef12345
Seller Role ID: 65a1234567890abcdef12346
Buyer Role ID: 65a1234567890abcdef12347
```

## Usage Examples

### Example 1: Protecting Routes with Role Guard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleCacheService } from '@/modules/role';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private roleCacheService: RoleCacheService) {}

  // Only Admin can access
  @Roles(this.roleCacheService.adminRoleId)
  @Get('dashboard')
  getDashboard() {
    return { message: 'Admin Dashboard' };
  }

  // Admin and Seller can access
  @Roles(this.roleCacheService.adminRoleId, this.roleCacheService.sellerRoleId)
  @Post('products')
  createProduct() {
    return { message: 'Product created' };
  }
}
```

### Example 2: Checking Roles in Services

```typescript
import { Injectable } from '@nestjs/common';
import { RoleCacheService } from '@/modules/role';

@Injectable()
export class ProductService {
  constructor(private roleCacheService: RoleCacheService) {}

  async createProduct(userId: string, productData: any) {
    const user = await this.userService.findOne(userId);

    // Check if user is Admin or Seller
    if (
      !this.roleCacheService.isAdmin(user.roleId.toString()) &&
      !this.roleCacheService.isSeller(user.roleId.toString())
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Create product...
  }
}
```

### Example 3: Creating Users with Roles

```typescript
import { Injectable } from '@nestjs/common';
import { UserService } from '@/modules/user/user.service';
import { RoleCacheService } from '@/modules/role';

@Injectable()
export class RegistrationService {
  constructor(
    private userService: UserService,
    private roleCacheService: RoleCacheService,
  ) {}

  async registerBuyer(registerDto: RegisterDto) {
    // Use roleId directly
    return this.userService.create({
      ...registerDto,
      roleId: this.roleCacheService.buyerRoleId,
    });
  }

  async registerSeller(registerDto: RegisterDto) {
    return this.userService.create({
      ...registerDto,
      roleId: this.roleCacheService.sellerRoleId,
    });
  }
}
```

### Example 4: Conditional Logic Based on Role

```typescript
@Injectable()
export class OrderService {
  constructor(private roleCacheService: RoleCacheService) {}

  async getOrders(userId: string) {
    const user = await this.userService.findOne(userId);
    const userRoleId = user.roleId.toString();

    // Admins see all orders
    if (this.roleCacheService.isAdmin(userRoleId)) {
      return this.orderModel.find().exec();
    }

    // Sellers see their own orders
    if (this.roleCacheService.isSeller(userRoleId)) {
      return this.orderModel.find({ sellerId: userId }).exec();
    }

    // Buyers see their own orders
    if (this.roleCacheService.isBuyer(userRoleId)) {
      return this.orderModel.find({ buyerId: userId }).exec();
    }

    throw new ForbiddenException('Invalid role');
  }
}
```

### Example 5: JWT Token Contains roleId

```typescript
// JWT Payload (automatically handled)
{
  sub: "65a1234567890abcdef12345",
  email: "user@example.com",
  roleId: "65a1234567890abcdef12346"  // ← Only roleId, no role name
}

// Access in request
@Get('profile')
getProfile(@Request() req) {
  const userRoleId = req.user.roleId;  // ObjectId

  if (this.roleCacheService.isAdmin(userRoleId.toString())) {
    // Admin-specific logic
  }
}
```

## API Responses

All API responses return `roleId`, not role names:

```json
{
  "user": {
    "id": "65a1234567890abcdef12345",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roleId": "65a1234567890abcdef12346"
  }
}
```

If the frontend needs the role name for display:

```typescript
// Option 1: Frontend maintains its own mapping
const roleNames = {
  '65a1234567890abcdef12345': 'Admin',
  '65a1234567890abcdef12346': 'Seller',
  '65a1234567890abcdef12347': 'Buyer',
};

// Option 2: Populate roleId in specific endpoints
const user = await this.userModel
  .findById(userId)
  .populate('roleId')
  .exec();

// Returns:
{
  roleId: {
    _id: "65a1234567890abcdef12346",
    name: "Seller",
    status: "active"
  }
}
```

## RoleCacheService API

### Methods

```typescript
// Get roleIds
roleCacheService.adminRoleId: string
roleCacheService.sellerRoleId: string
roleCacheService.buyerRoleId: string

// Check roles
roleCacheService.isAdmin(roleId: string): boolean
roleCacheService.isSeller(roleId: string): boolean
roleCacheService.isBuyer(roleId: string): boolean

// Reload cache (after seeding or role changes)
await roleCacheService.reload(): Promise<void>
```

### Global Availability

`RoleCacheService` is globally available (no need to import `RoleModule`):

```typescript
@Injectable()
export class AnyService {
  constructor(private roleCacheService: RoleCacheService) {}
  // Ready to use!
}
```

## Guards

### RolesGuard

The `RolesGuard` checks `user.roleId` against allowed roleIds:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoleIds = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoleIds || requiredRoleIds.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roleId) {
      return false;
    }

    // Check if user's roleId is in allowed roleIds
    return requiredRoleIds.includes(user.roleId.toString());
  }
}
```

### Usage

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private roleCacheService: RoleCacheService) {}

  @Roles(this.roleCacheService.adminRoleId, this.roleCacheService.sellerRoleId)
  @Post()
  create() {
    return { message: 'Product created' };
  }
}
```

## Database Schema

### User Schema

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Role',
    required: true,
  })
  roleId: Types.ObjectId; // ← Foreign key to Role

  // ... other fields
}
```

### Role Schema

```typescript
@Schema({ timestamps: true })
export class Role {
  _id: Types.ObjectId; // ← Primary key

  @Prop({ required: true, unique: true })
  name: string; // 'Admin', 'Seller', 'Buyer'

  @Prop({ required: true })
  description: string;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;
}
```

## Seeders (Only Place Where Role Names Are Used)

```typescript
// src/database/seeders/role.seeder.ts
import { RoleName } from '@/modules/role/enums/role-name.enum';

@Injectable()
export class RoleSeeder {
  async seed() {
    const roles = [
      { name: RoleName.ADMIN, description: '...' },
      { name: RoleName.SELLER, description: '...' },
      { name: RoleName.BUYER, description: '...' },
    ];

    for (const role of roles) {
      const exists = await this.roleService.findByName(role.name);
      if (!exists) {
        await this.roleService.create(role);
      }
    }
  }
}
```

**Note**: Role names (`RoleName` enum) should **ONLY** be imported in seeder files.

## Migration from Role Names to roleId

If you're migrating from a system that used role names:

```typescript
// migration.service.ts
async migrateToRoleId() {
  const users = await this.userModel.find().exec();

  for (const user of users) {
    // Get appropriate roleId based on old role name
    let roleId: string;

    if (user.role === 'admin') {
      roleId = this.roleCacheService.adminRoleId;
    } else if (user.role === 'seller') {
      roleId = this.roleCacheService.sellerRoleId;
    } else {
      roleId = this.roleCacheService.buyerRoleId;
    }

    // Update user
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { roleId } }
    );
  }
}
```

## Testing

### Unit Tests

```typescript
describe('RoleCacheService', () => {
  let service: RoleCacheService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RoleCacheService, RoleService],
    }).compile();

    service = module.get<RoleCacheService>(RoleCacheService);
    await service.onModuleInit();
  });

  it('should cache role IDs', () => {
    expect(service.adminRoleId).toBeDefined();
    expect(service.sellerRoleId).toBeDefined();
    expect(service.buyerRoleId).toBeDefined();
  });

  it('should identify admin role', () => {
    const isAdmin = service.isAdmin(service.adminRoleId);
    expect(isAdmin).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('RolesGuard', () => {
  it('should allow admin to access admin route', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should deny buyer from accessing admin route', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);
  });
});
```

## Performance Considerations

### Caching Benefits

- ✅ roleIds cached at startup (no repeated DB queries)
- ✅ O(1) role comparison in guards
- ✅ No string comparisons
- ✅ Direct ObjectId matching

### Best Practices

1. **Use RoleCacheService**: Always inject and use `RoleCacheService`
2. **Avoid repeated queries**: Don't query roles in loops
3. **Index roleId**: The User collection has an index on `roleId`
4. **Populate sparingly**: Only populate `roleId` when displaying role names

## Troubleshooting

### Error: "Role not found. Please run: npm run seed:roles"

**Solution**: Seed the roles first:

```bash
npm run seed:roles
```

### Error: "Cannot read roleId of undefined"

**Solution**: Ensure JWT strategy returns `roleId`:

```typescript
validate(payload: JwtPayload) {
  return {
    id: user.id,
    email: user.email,
    roleId: new Types.ObjectId(payload.roleId),
  };
}
```

### RoleCache not initialized

**Solution**: Ensure `RoleModule` is imported in `AppModule`:

```typescript
@Module({
  imports: [RoleModule, ...],
})
export class AppModule {}
```

## Summary

### ✅ DO

- Use `roleId` everywhere
- Inject `RoleCacheService`
- Check roles with `isAdmin()`, `isSeller()`, `isBuyer()`
- Use `roleId` in JWT tokens
- Store `roleId` in database

### ❌ DON'T

- Use role names in application code
- Hardcode role strings
- Use role enums outside seeders
- Compare role names in guards
- Store role names in JWT tokens

## File Locations

- **RoleCacheService**: `src/modules/role/role-cache.service.ts`
- **RolesGuard**: `src/common/guards/roles.guard.ts`
- **Roles Decorator**: `src/common/decorators/roles.decorator.ts`
- **JWT Strategy**: `src/modules/auth/strategies/jwt.strategy.ts`
- **User Schema**: `src/modules/user/schemas/user.schema.ts`
- **Role Schema**: `src/modules/role/schemas/role.schema.ts`

---

**Version**: 2.0.0 (Role ID Only)  
**Last Updated**: January 2026
