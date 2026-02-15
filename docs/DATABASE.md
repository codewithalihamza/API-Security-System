# Database Schema Design

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   users     │       │  refresh_tokens   │       │  api_keys   │
├─────────────┤       ├──────────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)           │   ┌───│ id (PK)     │
│ email       │   └──▶│ userId (FK)       │   │   │ userId (FK) │──┐
│ password    │       │ token            │   │   │ name        │  │
│ firstName   │       │ expiresAt        │   │   │ keyHash     │  │
│ lastName    │       │ isRevoked        │   │   │ keyPrefix   │  │
│ role        │       │ ipAddress        │   │   │ isActive    │  │
│ isActive    │       │ userAgent        │   │   │ lastUsedAt  │  │
│ lockedUntil │       └──────────────────┘   │   └─────────────┘  │
│ createdAt   │                              │                    │
│ updatedAt   │                              └────────────────────┘
└─────────────┘

┌─────────────────┐       ┌─────────────────┐
│  login_attempts  │       │  blocked_ips     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)          │
│ identifier      │       │ ipAddress (UQ)   │
│ ipAddress       │       │ reason           │
│ success         │       │ isPermanent      │
│ createdAt       │       │ expiresAt        │
└─────────────────┘       │ createdAt        │
                          └─────────────────┘

┌─────────────────┐
│  audit_logs      │
├─────────────────┤
│ id (PK)         │
│ userId          │
│ ipAddress       │
│ method          │
│ route           │
│ userAgent       │
│ statusCode      │
│ responseTime    │
│ metadata (JSONB)│
│ createdAt       │
└─────────────────┘
```

## Tables

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| email | VARCHAR | UNIQUE, NOT NULL |
| password | VARCHAR | NOT NULL |
| firstName | VARCHAR | NULL |
| lastName | VARCHAR | NULL |
| role | ENUM | DEFAULT 'User' |
| isActive | BOOLEAN | DEFAULT true |
| lockedUntil | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

### refresh_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| token | VARCHAR | NOT NULL |
| userId | UUID | FK → users |
| expiresAt | TIMESTAMP | NOT NULL |
| isRevoked | BOOLEAN | DEFAULT false |
| ipAddress | VARCHAR | NULL |
| userAgent | VARCHAR | NULL |
| createdAt | TIMESTAMP | |

### api_keys
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| keyHash | VARCHAR | NOT NULL |
| keyPrefix | VARCHAR | NOT NULL (for lookup) |
| userId | UUID | FK → users |
| isActive | BOOLEAN | DEFAULT true |
| lastUsedAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | |

### blocked_ips
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| ipAddress | VARCHAR | UNIQUE |
| reason | VARCHAR | NULL |
| isPermanent | BOOLEAN | DEFAULT false |
| expiresAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | |

### login_attempts
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| identifier | VARCHAR | (email or IP) |
| ipAddress | VARCHAR | |
| success | BOOLEAN | DEFAULT false |
| createdAt | TIMESTAMP | |

### audit_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | NULL |
| ipAddress | VARCHAR | |
| method | VARCHAR | |
| route | VARCHAR | |
| userAgent | VARCHAR | NULL |
| statusCode | INT | |
| responseTime | INT | (ms) |
| metadata | JSONB | NULL |
| createdAt | TIMESTAMP | |

## Indexes (Recommended)

```sql
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(userId);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(keyPrefix);
CREATE INDEX idx_api_keys_user_id ON api_keys(userId);
CREATE INDEX idx_login_attempts_identifier ON login_attempts(identifier);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ipAddress);
CREATE INDEX idx_login_attempts_created ON login_attempts(createdAt);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(userId);
CREATE INDEX idx_audit_logs_created ON audit_logs(createdAt);
```
