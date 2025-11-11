# Lab Environment Manager - Implementation Documentation

## 🎯 Overview

The **Lab Environment Manager** is a production-ready Docker-based container orchestration system that provides:
- On-demand deployment and destruction of vulnerable application containers
- User session isolation with resource management
- State persistence between sessions
- Automatic cleanup and expiration handling
- Real-time status updates via WebSocket

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Lab Environment Manager                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Controller  │→│   Service    │→│  Repository  │      │
│  │  (HTTP API)  │  │  (Business)  │  │  (Data)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                   │             │
│         │                  ↓                   ↓             │
│         │          ┌──────────────┐    ┌──────────────┐    │
│         │          │    Docker    │    │  PostgreSQL  │    │
│         │          │   Service    │    │   Database   │    │
│         │          └──────────────┘    └──────────────┘    │
│         │                  │                                │
│         ↓                  ↓                                │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  WebSocket   │  │    Redis     │                        │
│  │   Events     │  │    Cache     │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request** → Controller validates and authenticates
2. **Controller** → Service performs business logic checks
3. **Service** → Repository queries/updates database
4. **Service** → DockerService creates/manages containers
5. **Service** → Redis caches instance info
6. **Service** → WebSocket emits status updates
7. **Response** → User receives instance details

## 📦 Database Schema

### Labs Table
```sql
CREATE TABLE labs (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category lab_category NOT NULL,
  difficulty lab_difficulty NOT NULL,
  estimated_time INTEGER NOT NULL,
  points INTEGER DEFAULT 100,
  tags TEXT[],
  image_url VARCHAR,
  container_config JSONB NOT NULL,
  exercises JSONB DEFAULT '[]',
  prerequisites TEXT[],
  learning_objectives TEXT[],
  is_active BOOLEAN DEFAULT true,
  timeout_duration INTEGER DEFAULT 3600000,
  max_instances_per_user INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Lab Instances Table
```sql
CREATE TABLE lab_instances (
  id UUID PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES labs(id),
  user_id UUID NOT NULL REFERENCES users(id),
  container_id VARCHAR NOT NULL,
  container_name VARCHAR,
  status lab_instance_status DEFAULT 'starting',
  access_url VARCHAR,
  ports JSONB DEFAULT '[]',
  container_info JSONB,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  error_message TEXT,
  restart_count INTEGER DEFAULT 0,
  auto_cleanup BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_lab_instances_user_id (user_id),
  INDEX idx_lab_instances_lab_id (lab_id),
  INDEX idx_lab_instances_container_id (container_id),
  INDEX idx_lab_instances_expires_at (expires_at)
);
```

## 🔌 API Endpoints

### Get All Labs
```http
GET /api/labs
Query params:
  - category: web_security | network_security | cryptography | ...
  - difficulty: beginner | intermediate | advanced | expert
  - search: string

Response: {
  success: true,
  data: Lab[]
}
```

### Get Lab Details
```http
GET /api/labs/:id

Response: {
  success: true,
  data: Lab & {
    userInstances?: LabInstance[],
    isRunning?: boolean
  }
}
```

### Start Lab Instance
```http
POST /api/labs/:id/start
Headers: Authorization: Bearer <token>
Body: {
  timeoutOverride?: number  // milliseconds (optional)
}

Response: {
  success: true,
  data: LabInstance,
  message: "Lab instance started successfully"
}
```

### Stop Lab Instance
```http
POST /api/labs/instances/:instanceId/stop
Headers: Authorization: Bearer <token>

Response: {
  success: true,
  data: LabInstance,
  message: "Lab instance stopped successfully"
}
```

### Restart Lab Instance
```http
POST /api/labs/instances/:instanceId/restart
Headers: Authorization: Bearer <token>

Response: {
  success: true,
  data: LabInstance,
  message: "Lab instance restarted successfully"
}
```

### Reset Lab Instance
```http
POST /api/labs/instances/:instanceId/reset
Headers: Authorization: Bearer <token>

Response: {
  success: true,
  data: LabInstance,
  message: "Lab instance reset successfully"
}
```

### Get User's Instances
```http
GET /api/labs/instances/list
Headers: Authorization: Bearer <token>

Response: {
  success: true,
  data: LabInstance[]
}
```

### Get Instance Details
```http
GET /api/labs/instances/:instanceId
Headers: Authorization: Bearer <token>

Response: {
  success: true,
  data: LabInstance
}
```

## 🔧 Core Features

### 1. Container Lifecycle Management

**Dockerservice.ts** provides:

- **Container Creation**: Pulls images, creates containers with configs
- **Port Management**: Auto-assigns available ports (10000-60000)
- **Network Isolation**: All labs run in isolated bridge network
- **Resource Limits**: Memory and CPU constraints
- **Health Checks**: Monitors container status
- **Auto-cleanup**: Removes expired/orphaned containers

### 2. Resource Management

**Per-User Limits**:
```typescript
// Default: 5 active instances per user
MAX_CONTAINERS_PER_USER=5

// Per-lab limit (configurable per lab)
lab.maxInstancesPerUser = 5
```

**Global Limits**:
```typescript
MAX_GLOBAL_INSTANCES = 50  // System-wide concurrent containers
```

**Memory/CPU Limits**:
```typescript
containerConfig: {
  memoryLimit: "512m",  // 512 MB RAM
  cpuLimit: "0.5"       // 0.5 CPU cores
}
```

### 3. Session Persistence

**State Tracking**:
- Container ID and status stored in database
- Port mappings preserved
- Access URLs maintained
- Restart capability with state restoration

**Expiration Handling**:
```typescript
// Configurable timeout (default: 1 hour)
lab.timeoutDuration = 3600000  // milliseconds

// Auto-cleanup on expiration
instance.autoCleanup = true
```

### 4. Automatic Cleanup

**Scheduled Cleanup**:
```typescript
// Runs on instance expiration
scheduleAutoCleanup(instanceId, timeout)

// Manual cleanup job (run via cron)
await LabService.cleanupExpiredInstances()
```

**Cleanup Actions**:
- Stop running containers
- Remove containers if `autoCleanup=true`
- Update database status
- Clear Redis cache
- Remove orphaned Docker containers

### 5. Real-time Updates

**WebSocket Events**:
```typescript
// Lab status changes
socket.emit('lab:status', {
  instanceId: string,
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error',
  message?: string
})

// Lab notifications
socket.emit('lab:notification', {
  type: string,
  message: string,
  metadata?: object
})
```

**Subscription Model**:
```typescript
// Subscribe to lab updates
socket.emit('subscribe:lab', labId)

// Unsubscribe
socket.emit('unsubscribe:lab', labId)
```

## 🛠️ Configuration

### Environment Variables

```bash
# Docker Configuration
DOCKER_HOST=unix:///var/run/docker.sock
MAX_CONTAINERS_PER_USER=5

# Container Defaults
CONTAINER_TIMEOUT=3600000  # 1 hour
PUBLIC_HOST=localhost      # For access URLs

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auron_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Lab Configuration Example

```typescript
const labConfig: Partial<Lab> = {
  name: "DVWA - SQL Injection",
  description: "Practice SQL injection attacks on DVWA",
  category: LabCategory.WEB_SECURITY,
  difficulty: LabDifficulty.BEGINNER,
  estimatedTime: 60,  // minutes
  points: 100,
  tags: ["sql-injection", "owasp-top-10", "web"],
  containerConfig: {
    image: "vulnerables/web-dvwa:latest",
    ports: [
      { container: 80, host: undefined }  // Auto-assign
    ],
    environment: {
      MYSQL_HOST: "dvwa-db",
      MYSQL_DATABASE: "dvwa"
    },
    memoryLimit: "512m",
    cpuLimit: "0.5"
  },
  exercises: [
    {
      id: "ex-1",
      title: "Basic SQL Injection",
      description: "Bypass login using SQL injection",
      instructions: "...",
      hints: [
        { id: "hint-1", content: "Try ' OR '1'='1", cost: 10 }
      ],
      points: 50,
      order: 1
    }
  ],
  timeoutDuration: 3600000,  // 1 hour
  maxInstancesPerUser: 2
};
```

## 📊 Monitoring & Logs

### Container Stats

```typescript
const stats = await DockerService.getContainerStats(containerId);
// Returns CPU, memory, network I/O stats
```

### Container Logs

```typescript
const logs = await DockerService.getContainerLogs(containerId, 100);
// Get last 100 lines
```

### Database Queries

```typescript
// User instance statistics
const stats = await LabInstanceRepository.getUserStats(userId);
// Returns: { total, active, stopped, expired }

// All running instances
const instances = await LabInstanceRepository.findAll({
  status: LabInstanceStatus.RUNNING
});
```

## 🔒 Security Features

### 1. Authentication & Authorization
- JWT-based authentication required for all operations
- Users can only manage their own instances
- Role-based access (future: admin can manage all)

### 2. Resource Isolation
- Each container runs in isolated network
- Port mapping prevents conflicts
- Memory/CPU limits prevent resource exhaustion

### 3. Input Validation
- Joi schemas validate all requests
- UUID validation for IDs
- Timeout limits enforced

### 4. Docker Security
- Non-root users in containers
- Read-only file systems where possible
- No privileged mode
- Auto-cleanup prevents resource leaks

## 🧪 Testing

### Unit Tests (Example)

```typescript
// tests/services/LabService.test.ts
describe('LabService', () => {
  it('should start lab instance', async () => {
    const instance = await LabService.startLab({
      userId: 'user-123',
      labId: 'lab-456'
    });

    expect(instance.status).toBe(LabInstanceStatus.RUNNING);
    expect(instance.accessUrl).toBeDefined();
  });

  it('should enforce per-user limit', async () => {
    // Create max instances
    for (let i = 0; i < 5; i++) {
      await LabService.startLab({userId, labId});
    }

    // Should throw error
    await expect(
      LabService.startLab({userId, labId})
    ).rejects.toThrow('Maximum 5 active instances');
  });
});
```

## 📈 Performance Considerations

### Caching Strategy
- Instance info cached in Redis (5 min TTL)
- Lab configs cached on first load
- Port availability cached

### Database Optimization
- Indexes on foreign keys (user_id, lab_id)
- Index on container_id for quick lookups
- Index on expires_at for cleanup queries

### Container Performance
- Image pre-pulling to reduce start time
- Reuse existing containers when possible
- Batch cleanup operations

## 🔄 Cleanup Job

### Cron Job Setup

```bash
# Run cleanup every hour
0 * * * * curl -X POST http://localhost:4000/api/admin/cleanup
```

### Manual Cleanup

```typescript
import LabService from '@services/LabService';

const cleanedCount = await LabService.cleanupExpiredInstances();
console.log(`Cleaned up ${cleanedCount} instances`);
```

## 🚀 Deployment

### Docker Compose

```yaml
services:
  backend:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Docker access
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
```

### Kubernetes (Alternative)

```yaml
# Use Docker-in-Docker or external Docker daemon
# Mount docker.sock as volume
# Set appropriate permissions
```

## 📝 Files Created

```
backend/src/
├── models/
│   ├── User.ts                      # User model with auth
│   ├── Lab.ts                       # Lab definitions
│   ├── LabInstance.ts               # Running instances
│   ├── UserProgress.ts              # Progress tracking
│   └── index.ts                     # Model exports
├── repositories/
│   ├── LabRepository.ts             # Lab data access
│   └── LabInstanceRepository.ts      # Instance data access
├── services/
│   ├── DockerService.ts             # Docker orchestration ⭐
│   └── LabService.ts                # Business logic ⭐
├── controllers/
│   └── LabController.ts             # HTTP handlers
├── routes/
│   ├── labs.routes.ts               # Lab endpoints
│   └── index.ts                     # Route setup
├── middleware/
│   ├── auth.ts                      # JWT authentication
│   ├── validation.ts                # Request validation
│   └── errorHandler.ts              # Error handling
├── config/
│   ├── database.ts                  # PostgreSQL setup
│   └── redis.ts                     # Redis setup
├── utils/
│   └── logger.ts                    # Winston logging
├── websocket/
│   └── index.ts                     # Socket.IO setup
└── server.ts                        # Application entry
```

## ✅ Status

**Completed Features**:
- ✅ Full Docker container lifecycle management
- ✅ User session isolation
- ✅ Resource limits and management
- ✅ State persistence with PostgreSQL
- ✅ Automatic cleanup and expiration
- ✅ Real-time WebSocket updates
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Authentication & authorization
- ✅ Redis caching
- ✅ Logging infrastructure

**Ready for Production**: Yes ✅

## 🎓 Usage Examples

See `IMPLEMENTATION_GUIDE.md` for frontend integration examples and complete API documentation.

---

**Created**: November 2025
**Version**: 2.0.0
**Status**: Production Ready ✅
