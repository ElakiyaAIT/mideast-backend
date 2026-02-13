# RBAC Quick Start - Role ID Only Implementation

## ⚡ Quick Setup

```bash
# 1. Seed roles
npm run seed:roles

# 2. Seed admin user
npm run seed:admin-user

# 3. Start application
npm run start:dev
```

## 🎯 Core Concept

**Use ONLY `roleId` everywhere. No role names, no role strings, no role enums in application code.**

## 📋 Common Tasks

### 1. Protect a Route (Admin Only)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleCacheService } from '@/modules/role';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private roleCacheService: RoleCacheService) {}

  @Roles(this.roleCacheService.adminRoleId)
  @Get('dashboard')
  getDashboard() {
    return { message: 'Admin Dashboard' };
  }
}
```

### 2. Protect a Route (Admin OR Seller)

```typescript
@Roles(
  this.roleCacheService.adminRoleId,
  this.roleCacheService.sellerRoleId
)
@Post('products')
createProduct() {
  return { message: 'Product created' };
}
```

### 3. Check Role in Service

```typescript
import { Injectable } from '@nestjs/common';
import { RoleCacheService } from '@/modules/role';

@Injectable()
export class ProductService {
  constructor(private roleCacheService: RoleCacheService) {}

  async deleteProduct(userId: string, productId: string) {
    const user = await this.userService.findOne(userId);

    // Only admin can delete
    if (!this.roleCacheService.isAdmin(user.roleId.toString())) {
      throw new ForbiddenException('Only admins can delete products');
    }

    // Delete product...
  }
}
```

### 4. Create User with Role

```typescript
import { Injectable } from '@nestjs/common';
import { RoleCacheService } from '@/modules/role';

@Injectable()
export class UserCreationService {
  constructor(
    private userService: UserService,
    private roleCacheService: RoleCacheService,
  ) {}

  async createBuyer(data: CreateUserDto) {
    return this.userService.create({
      ...data,
      roleId: this.roleCacheService.buyerRoleId,
    });
  }

  async createSeller(data: CreateUserDto) {
    return this.userService.create({
      ...data,
      roleId: this.roleCacheService.sellerRoleId,
    });
  }
}
```

### 5. Conditional Logic Based on Role

```typescript
async getOrders(userId: string) {
  const user = await this.userService.findOne(userId);
  const roleId = user.roleId.toString();

  if (this.roleCacheService.isAdmin(roleId)) {
    return this.orderModel.find().exec(); // All orders
  }

  if (this.roleCacheService.isSeller(roleId)) {
    return this.orderModel.find({ sellerId: userId }).exec();
  }

  if (this.roleCacheService.isBuyer(roleId)) {
    return this.orderModel.find({ buyerId: userId }).exec();
  }

  throw new ForbiddenException('Invalid role');
}
```

## 🔑 RoleCacheService Methods

```typescript
// Get roleIds
roleCacheService.adminRoleId: string
roleCacheService.sellerRoleId: string
roleCacheService.buyerRoleId: string

// Check roles
roleCacheService.isAdmin(roleId: string): boolean
roleCacheService.isSeller(roleId: string): boolean
roleCacheService.isBuyer(roleId: string): boolean
```

## 📊 API Response Format

All responses use `roleId`:

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

## 🔐 JWT Token Structure

```json
{
  "sub": "65a1234567890abcdef12345",
  "email": "user@example.com",
  "roleId": "65a1234567890abcdef12346"
}
```

## ⚠️ Important Rules

### ✅ DO

- Use `roleId` everywhere
- Inject `RoleCacheService` in constructors
- Use helper methods: `isAdmin()`, `isSeller()`, `isBuyer()`

### ❌ DON'T

- Use role names like 'Admin', 'Seller', 'Buyer' in code
- Use role enums outside seeders
- Hardcode role strings
- Compare role names

## 🐛 Troubleshooting

### "Role not found" error

```bash
npm run seed:roles
```

### RoleCache not initialized

Ensure `RoleModule` is imported in `AppModule`:

```typescript
@Module({
  imports: [
    RoleModule, // ← Must be imported
    UserModule,
    AuthModule,
    // ...
  ],
})
export class AppModule {}
```

### Cannot access roleId

Ensure JWT payload includes `roleId`:

```typescript
// auth.service.ts
const payload: JwtPayload = {
  sub: userId,
  email,
  roleId: userRoleId, // ← Must include
};
```

## 📚 Full Documentation

See [RBAC_ROLE_ID_ONLY.md](./RBAC_ROLE_ID_ONLY.md) for comprehensive guide.

## 🚀 Test Your Setup

```bash
# 1. Login as admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mideastequip.com","password":"Admin@123"}'

# 2. Access admin route (should succeed)
curl -X GET http://localhost:3000/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Quick Ref Card v2.0** | [Full Docs](./RBAC_ROLE_ID_ONLY.md)
