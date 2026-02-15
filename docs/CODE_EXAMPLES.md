# Code Examples

## 1. Authentication

### Register
```typescript
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```typescript
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

### Refresh Token
```typescript
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout (with token blacklist)
```typescript
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."  // optional
}
```

## 2. RBAC - Role-Based Access Control

### Using Roles Decorator
```typescript
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getDashboard() {
    return { message: 'Admin only' };
  }

  @Get('super')
  @Roles(UserRole.SUPER_ADMIN)
  getSuperAdmin() {
    return { message: 'SuperAdmin only' };
  }
}
```

### Public Route
```typescript
import { Public } from '../common/decorators/public.decorator';

@Get('public')
@Public()
getPublic() {
  return { message: 'No auth required' };
}
```

### Current User
```typescript
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Get('me')
getProfile(@CurrentUser() user: User) {
  return user;
}

@Get('my-id')
getMyId(@CurrentUser('id') userId: string) {
  return { userId };
}
```

## 3. Rate Limiting

### Global (10 req/min)
Applied automatically to all routes.

### Override for Login (5 req/min)
```typescript
@Post('login')
@Throttle({ short: { limit: 5, ttl: 60000 } })
async login(@Body() dto: LoginDto) {
  // ...
}
```

### Skip Rate Limiting
```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

## 4. API Keys

### Generate API Key
```typescript
POST /api-keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Production Service"
}

// Response - SAVE THE KEY, it won't be shown again
{
  "id": "uuid",
  "apiKey": "ask_abc123...",
  "name": "Production Service",
  "warning": "Store this key securely. It will not be shown again."
}
```

### Use API Key
```typescript
// Header
X-Api-Key: ask_abc123...

// Or Bearer
Authorization: Bearer ask_abc123...
```

### Protect Internal Route with API Key
```typescript
import { ApiKeyRequired } from '../common/decorators/api-key.decorator';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@Controller('internal')
export class InternalController {
  @Get('webhook')
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiKeyRequired()
  handleWebhook() {
    return { received: true };
  }
}
```

## 5. IP Blacklist

### Block IP (Admin)
```typescript
POST /ip-blacklist
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "ipAddress": "192.168.1.100",
  "reason": "Abusive behavior",
  "isPermanent": false,
  "expiresIn": 3600  // seconds
}
```

## 6. Validation (DTO)

```typescript
// register.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
}
```

ValidationPipe (global) strips unknown fields and transforms types.

## 7. Audit Logging

Automatic. Every request is logged with:
- userId (if authenticated)
- ipAddress
- method, route
- userAgent
- statusCode
- responseTime (ms)

Stored in `audit_logs` table.
