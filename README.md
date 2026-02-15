# Enterprise API Security System

Production-ready API security system built with NestJS, featuring authentication, RBAC, rate limiting, API keys, brute force protection, IP blacklisting, and comprehensive audit logging.

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Primary database
- **JWT** - Access & refresh tokens
- **Passport.js** - Authentication strategies
- **bcrypt** - Password hashing
- **ThrottlerModule** - Rate limiting
- **class-validator** - DTO validation

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL (Docker)
docker-compose up -d

# Run migrations (synchronize in dev)
npm run start:dev
```

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | Login (5 req/min) |
| POST | `/auth/refresh` | Refresh tokens |

### Protected (JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/logout` | Logout (blacklist token) |
| GET | `/users/me` | Current user profile |
| GET | `/users` | List users (Admin+) |
| POST | `/api-keys` | Generate API key |
| GET | `/api-keys` | List API keys |
| DELETE | `/api-keys/:id` | Revoke API key |
| POST | `/ip-blacklist` | Block IP (Admin+) |
| DELETE | `/ip-blacklist/:ip` | Unblock IP (Admin+) |

## Environment Variables

See [.env.example](.env.example) for full structure. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `DB_*` | PostgreSQL connection | - |
| `JWT_ACCESS_SECRET` | Access token secret (min 32 chars) | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_ACCESS_EXPIRATION` | Access token TTL | 15m |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | 7d |
| `RATE_LIMIT_MAX` | Global requests per minute | 10 |
| `BRUTE_FORCE_MAX_ATTEMPTS` | Failed logins before lock | 5 |
| `BRUTE_FORCE_LOCKOUT_DURATION` | Lockout seconds | 900 |

## Production Deployment

### Pre-deployment Checklist

1. **Secrets**: Use strong, unique JWT secrets (32+ chars)
2. **Database**: Enable SSL for PostgreSQL in production
3. **Synchronize**: Set `synchronize: false`, use migrations
5. **CORS**: Configure allowed origins
6. **Logging**: Route logs to centralized system

### Docker Compose (Development)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: api_security_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Build & Run

```bash
npm run build
NODE_ENV=production node dist/main.js
```

## Security Best Practices

1. **Never commit** `.env` or secrets
2. **Rotate** JWT secrets periodically
3. **Use HTTPS** in production
4. **Set `trust proxy`** when behind load balancer
5. **Audit** `audit_logs` table regularly
6. **Clean** expired refresh tokens and login attempts
7. **Monitor** brute force blocks and failed logins

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Folder structure, module design
- [Database Schema](docs/DATABASE.md) - Entity relationships, indexes

## License

MIT
