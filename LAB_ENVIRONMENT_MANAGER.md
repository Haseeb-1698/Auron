# Lab Environment Manager - Implementation Documentation

## 🎯 Overview

The **Lab Environment Manager** is a production-ready cloud-based lab orchestration system that provides:
- **On-demand Vultr VM deployment** for isolated lab environments
- Each lab runs on a **dedicated cloud VM** with Docker pre-installed
- **Automatic VM creation and destruction** based on user requests
- User session isolation with complete VM-level isolation
- State persistence and monitoring across cloud instances
- **AI-powered learning** via LiquidMetal AI (Claude) and SmartMemory
- Automatic cleanup and expiration handling
- Real-time status updates via WebSocket

### Key Advantages of Cloud Architecture
- **True Isolation**: Each lab gets its own VM (not just container)
- **Scalability**: No local resource constraints
- **Security**: VM-level separation prevents cross-contamination
- **Flexibility**: Deploy labs globally across multiple regions
- **Cost-Effective**: Pay only for active lab sessions

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│              Cloud Lab Environment Manager                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Controller  │→│CloudLabSvc  │→│  Repository  │      │
│  │  (HTTP API)  │  │  (Business)  │  │  (Data)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                   │             │
│         │                  ↓                   ↓             │
│         │          ┌──────────────┐    ┌──────────────┐    │
│         │          │   Vultr API  │    │  PostgreSQL  │    │
│         │          │   Service    │    │   Database   │    │
│         │          └──────────────┘    └──────────────┘    │
│         │                  │                                │
│         │                  ↓                                │
│         │          ┌──────────────┐                         │
│         │          │ LiquidMetal  │                         │
│         │          │  AI Service  │                         │
│         │          │   (Claude)   │                         │
│         │          └──────────────┘                         │
│         │                                                    │
│         ↓                  ↓                                │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  WebSocket   │  │    Redis     │                        │
│  │   Events     │  │    Cache     │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
        ┌──────────────────────────────────────┐
        │        Vultr Cloud Infrastructure     │
        ├──────────────────────────────────────┤
        │                                       │
        │  ┌──────────┐  ┌──────────┐         │
        │  │   VM 1   │  │   VM 2   │  ...    │
        │  │ (User A) │  │ (User B) │         │
        │  │  Docker  │  │  Docker  │         │
        │  └──────────┘  └──────────┘         │
        │                                       │
        └──────────────────────────────────────┘
```

### Data Flow

1. **User Request** → Controller validates and authenticates
2. **Controller** → CloudLabService performs business logic checks
3. **Service** → Repository queries/updates database
4. **Service** → VultrService creates cloud VM with Docker
5. **Service** → VM auto-deploys container via cloud-init script
6. **Service** → LiquidMetalService tracks learning progress
7. **Service** → Redis caches instance info
8. **Service** → WebSocket emits status updates
9. **Response** → User receives VM IP and access details

### Cloud VM Lifecycle

1. **Creation**: Vultr API creates Ubuntu 22.04 VM with Docker
2. **Provisioning**: Cloud-init script pulls and runs container
3. **Running**: User accesses lab via VM's public IP
4. **Monitoring**: Background jobs sync VM status
5. **Expiration**: Auto-cleanup destroys VM after timeout
6. **Deletion**: Complete VM destruction (no residual resources)

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

  -- Cloud VM Information
  cloud_instance_id VARCHAR NOT NULL,        -- Vultr VM ID
  public_ip VARCHAR,                         -- VM public IP
  internal_ip VARCHAR,                       -- VM internal IP
  cloud_provider VARCHAR DEFAULT 'vultr',   -- Provider name
  cloud_instance_info JSONB,                 -- Region, plan, specs

  -- Container Information (running on VM)
  container_id VARCHAR,
  container_name VARCHAR,

  -- Instance Status
  status lab_instance_status DEFAULT 'starting',
  access_url VARCHAR,                        -- http://public_ip:port
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
  INDEX idx_lab_instances_cloud_id (cloud_instance_id),
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

### 1. Cloud VM Lifecycle Management

**VultrService.ts** provides:

- **VM Creation**: Creates Ubuntu 22.04 instances with Docker pre-installed
- **Cloud-init Provisioning**: Auto-deploys containers on VM startup
- **IP Management**: Assigns public and internal IPs
- **Region Selection**: Deploy globally (US, EU, Asia)
- **Plan Selection**: Choose VM specs (1GB RAM, 2GB RAM, etc.)
- **Health Checks**: Monitors VM status via Vultr API
- **Auto-cleanup**: Destroys VMs on expiration (complete removal)

**CloudLabService.ts** orchestrates:

- **Business Logic**: Quota checks, validation, permissions
- **VM Provisioning**: Creates VMs via VultrService
- **AI Integration**: Tracks learning progress via LiquidMetal
- **Database Management**: Stores instance metadata
- **Cache Management**: Redis caching for fast lookups

### 2. Resource Management

**Per-User Limits**:
```typescript
// Default: 5 active VMs per user
MAX_CONTAINERS_PER_USER=5

// Per-lab limit (configurable per lab)
lab.maxInstancesPerUser = 5
```

**Global Limits**:
```typescript
MAX_GLOBAL_INSTANCES = 100  // System-wide concurrent VMs (increased for cloud)
```

**VM Plans (Vultr)**:
```typescript
// vc2-1c-1gb: 1 vCPU, 1GB RAM, 25GB SSD - $6/month
// vc2-2c-4gb: 2 vCPU, 4GB RAM, 80GB SSD - $18/month
// vc2-4c-8gb: 4 vCPU, 8GB RAM, 160GB SSD - $36/month

VULTR_DEFAULT_PLAN=vc2-1c-1gb  // Basic plan for most labs
```

**Regions Available**:
```typescript
// US: ewr (New Jersey), ord (Chicago), dfw (Dallas),
//     sea (Seattle), lax (Los Angeles), atl (Atlanta), sjc (Silicon Valley)
// EU: ams (Amsterdam), lhr (London), fra (Frankfurt)

VULTR_DEFAULT_REGION=ewr  // New Jersey (lowest latency for US East)
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

**Background Jobs** (node-cron):

**CleanupJob.ts** - Runs every 5 minutes:
```typescript
// Automatic cleanup of expired VMs
CleanupJob.start();

// Actions performed:
- Finds expired lab instances
- Deletes Vultr VMs (complete destruction)
- Updates database status
- Clears Redis cache
- Logs cleanup metrics
```

**MonitoringJob.ts** - Runs every 10 minutes:
```typescript
// Health monitoring and status sync
MonitoringJob.start();

// Actions performed:
- Syncs VM status from Vultr API
- Detects orphaned VMs
- Checks for expired-but-running instances
- Stores monitoring metrics in Redis
- Alerts on anomalies
```

**Manual Trigger**:
```typescript
// Trigger cleanup manually
await CleanupJob.trigger();

// Trigger monitoring manually
await MonitoringJob.trigger();
```

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
# Vultr Cloud Configuration (Primary Lab Infrastructure)
VULTR_API_KEY=your_vultr_api_key_here
VULTR_DEFAULT_REGION=ewr                 # New Jersey
VULTR_DEFAULT_PLAN=vc2-1c-1gb           # Basic plan ($6/mo)

# Available regions: ewr, ord, dfw, sea, lax, atl, ams, lhr, fra, sjc
# Available plans: vc2-1c-1gb, vc2-2c-4gb, vc2-4c-8gb

# LiquidMetal AI Configuration (Claude Integration & SmartMemory)
LIQUIDMETAL_API_KEY=your_liquidmetal_api_key_here
LIQUIDMETAL_ENDPOINT=https://api.liquidmetal.ai/v1
CLAUDE_MODEL=claude-3-sonnet-20240229
SMART_MEMORY_ENABLED=true

# Cerebras (Optional - For ML Model Training)
CEREBRAS_API_KEY=your_cerebras_api_key_here
CEREBRAS_ENDPOINT=https://api.cerebras.ai/v1

# Resource Limits
MAX_CONTAINERS_PER_USER=5
CONTAINER_TIMEOUT=3600000                # 1 hour

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

### Cloud Architecture Deployment

**No Docker socket required!** The backend only needs:
- PostgreSQL database
- Redis cache
- Vultr API access
- Environment variables configured

### Docker Compose

```yaml
services:
  backend:
    # No docker.sock volume needed!
    environment:
      - VULTR_API_KEY=${VULTR_API_KEY}
      - VULTR_DEFAULT_REGION=ewr
      - VULTR_DEFAULT_PLAN=vc2-1c-1gb
      - LIQUIDMETAL_API_KEY=${LIQUIDMETAL_API_KEY}
```

### Vultr VM Setup

1. **Create Vultr Account**: Sign up at vultr.com
2. **Generate API Key**: Settings → API → Personal Access Token
3. **Set Environment Variables**: Add to `.env` file
4. **Deploy Backend**: Can run anywhere (Vultr, AWS, local)
5. **Configure Regions**: Choose optimal regions for users

### Cost Optimization

**Estimated Costs**:
- Basic VM (vc2-1c-1gb): $0.009/hour = $6/month
- 1-hour lab session: $0.01 per user
- 100 concurrent labs: $60/month (if running 24/7)
- Actual cost: Much lower (labs run only when needed)

**Best Practices**:
- Set reasonable timeout durations (1 hour default)
- Enable auto-cleanup
- Monitor unused VMs with MonitoringJob
- Use smallest viable VM plan per lab

## 📝 Files Created

```
backend/src/
├── models/
│   ├── User.ts                      # User model with auth
│   ├── Lab.ts                       # Lab definitions
│   ├── LabInstance.ts               # Cloud VM instances (updated) ⭐
│   ├── UserProgress.ts              # Progress tracking
│   └── index.ts                     # Model exports
├── repositories/
│   ├── LabRepository.ts             # Lab data access
│   └── LabInstanceRepository.ts     # Instance data access
├── services/
│   ├── VultrService.ts              # Vultr cloud VM management ⭐ NEW
│   ├── LiquidMetalService.ts        # AI integration (Claude) ⭐ NEW
│   └── CloudLabService.ts           # Cloud lab orchestration ⭐ NEW
├── jobs/
│   ├── CleanupJob.ts                # Automated VM cleanup ⭐ NEW
│   ├── MonitoringJob.ts             # Health monitoring ⭐ NEW
│   └── index.ts                     # Job manager ⭐ NEW
├── controllers/
│   └── LabController.ts             # HTTP handlers (updated)
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
└── server.ts                        # Application entry (updated)
```

## ✅ Status

**Completed Features**:
- ✅ **Cloud VM lifecycle management** (Vultr)
- ✅ **Dedicated VM per lab** (true isolation)
- ✅ **Auto VM creation/destruction** on user request
- ✅ **AI integration** (LiquidMetal/Claude) with SmartMemory
- ✅ **Background jobs** (cleanup, monitoring)
- ✅ User session isolation (VM-level)
- ✅ Resource limits and management
- ✅ State persistence with PostgreSQL
- ✅ Automatic cleanup and expiration
- ✅ Real-time WebSocket updates
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Authentication & authorization
- ✅ Redis caching
- ✅ Logging infrastructure
- ✅ Global region deployment support
- ✅ Cost estimation and tracking

**Architecture**: Cloud-Native (Vultr) ☁️
**Ready for Production**: Yes ✅

## 🎓 Usage Examples

See `IMPLEMENTATION_GUIDE.md` for frontend integration examples and complete API documentation.

---

**Created**: November 2025
**Version**: 2.0.0
**Status**: Production Ready ✅
