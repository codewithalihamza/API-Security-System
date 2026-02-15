# Enterprise API Security System - Architecture

## Folder Structure

```
src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Root module
│
├── auth/                       # Authentication Module
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── logout.dto.ts
│   ├── entities/
│   │   ├── refresh-token.entity.ts
│   │   └── login-attempt.entity.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── services/
│       └── brute-force.service.ts
│
├── users/                     # Users Module
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── entities/
│       └── user.entity.ts
│
├── api-keys/                  # API Keys Module
│   ├── api-keys.module.ts
│   ├── api-keys.service.ts
│   ├── api-keys.controller.ts
│   ├── dto/
│   │   └── create-api-key.dto.ts
│   ├── entities/
│   │   └── api-key.entity.ts
│   └── guards/
│       └── api-key.guard.ts
│
├── ip-blacklist/              # IP Blacklist Module
│   ├── ip-blacklist.module.ts
│   ├── ip-blacklist.service.ts
│   ├── ip-blacklist.controller.ts
│   ├── dto/
│   │   └── block-ip.dto.ts
│   ├── entities/
│   │   └── blocked-ip.entity.ts
│   └── guards/
│       └── ip-blacklist.guard.ts
│
├── audit-log/                 # Audit Logging Module
│   ├── audit-log.module.ts
│   ├── audit-log.service.ts
│   └── entities/
│       └── audit-log.entity.ts
│
├── common/                    # Shared Utilities
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   ├── roles.decorator.ts
│   │   ├── api-key.decorator.ts
│   │   └── current-user.decorator.ts
│   └── interceptors/
│       └── logging.interceptor.ts
│
├── database/                  # Database Configuration
│   └── database.module.ts
│
└── health/                    # Health Check
    ├── health.module.ts
    └── health.controller.ts
```

## Module Architecture

### Request Flow

```
Request → ThrottlerGuard → IpBlacklistGuard → JwtAuthGuard → RolesGuard → Controller
                ↓                   ↓                ↓              ↓
         Rate Limit Check      Blocked IP?      @Public()?     @Roles()?
         (in-memory)          Reject if yes     Skip JWT       Check role
```

### Module Dependencies

```
AppModule
├── ConfigModule (global)
├── ThrottlerModule (in-memory)
├── DatabaseModule (PostgreSQL)
├── AuthModule
│   ├── UsersModule (forwardRef)
│   └── TypeORM entities
├── UsersModule
│   └── AuthModule (forwardRef)
├── ApiKeysModule
├── IpBlacklistModule
├── AuditLogModule
└── HealthModule
```

### Guard Execution Order

1. **ThrottlerGuard** - In-memory rate limiting (10 req/min global, 5 req/min login)
2. **IpBlacklistGuard** - Reject requests from blocked IPs
3. **JwtAuthGuard** - Validate JWT (skips for @Public() routes)
4. **RolesGuard** - Enforce role-based access (skips when no @Roles() specified)

### Decorator Usage

| Decorator | Purpose |
|-----------|---------|
| `@Public()` | Skip JWT authentication |
| `@Roles(Admin, SuperAdmin)` | Restrict to specific roles |
| `@CurrentUser()` | Inject authenticated user |
| `@ApiKeyRequired()` | Require API key (use with ApiKeyGuard) |
| `@Throttle({ short: { limit: 5, ttl: 60000 } })` | Override rate limit per route |
