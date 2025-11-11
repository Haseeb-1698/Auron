# Architecture Overview

This document describes the architecture of the Auron cybersecurity training platform.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Web Browser  │  Chrome Extension  │  CLI/API Clients       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Backend    │    │   Browser    │    │    Docker    │  │
│  │     API      │◄───┤  Extension   │    │     Labs     │  │
│  │  (Node.js)   │    │   (Chrome)   │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                         │          │
│         ▼                                         ▼          │
│  ┌──────────────┐                     ┌──────────────────┐  │
│  │   SQLite     │                     │   Lab Services   │  │
│  │   Database   │                     │  - DVWA          │  │
│  └──────────────┘                     │  - Juice Shop    │  │
│                                       │  - Wazuh         │  │
│                                       │  - Metasploitable│  │
│                                       └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
├─────────────────────────────────────────────────────────────┤
│              Docker Network (auron-network)                  │
│              Docker Volumes (Persistent Storage)             │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Browser Extension

**Purpose**: Real-time security analysis of web pages

**Technology**:
- Manifest V3
- JavaScript (Vanilla)
- Chrome Extension APIs

**Components**:
- `manifest.json`: Extension configuration
- `background.js`: Service worker for background tasks
- `content.js`: Injected into pages for DOM analysis
- `popup.html/js/css`: User interface

**Responsibilities**:
- Cookie security analysis
- Session management validation
- CSP header inspection
- Phishing detection
- Local storage of findings
- Backend synchronization

**Data Flow**:
```
Web Page → Content Script → Background Worker → Popup UI
                               ↓
                        Chrome Storage API
                               ↓
                         Backend API (sync)
```

### 2. Backend API

**Purpose**: Central service for authentication, progress tracking, and data persistence

**Technology**:
- Node.js 18+
- Express.js
- SQLite3
- JWT Authentication

**Architecture Pattern**: RESTful API with MVC-like structure

**Components**:
```
backend/
├── server.js              # Entry point, middleware setup
├── config/
│   └── database.js       # Database connection & schema
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── progress.js       # Progress tracking
│   ├── reports.js        # Report management
│   └── labs.js           # Lab information
└── middleware/
    └── auth.js           # JWT verification
```

**Data Models**:
- User: Authentication and profile
- Progress: Lab completion tracking
- Report: Vulnerability reports and findings
- Lab: Lab metadata and configuration

**Security Features**:
- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting (100 req/15min)
- Helmet.js security headers
- CORS configuration
- SQL injection prevention (parameterized queries)

### 3. Docker Lab Environment

**Purpose**: Isolated, reproducible vulnerable application environment

**Technology**:
- Docker & Docker Compose
- Networking: Bridge network
- Storage: Named volumes

**Services**:

#### DVWA (Damn Vulnerable Web Application)
- **Image**: `vulnerables/web-dvwa`
- **Purpose**: OWASP Top 10 practice
- **Ports**: 8080 (HTTP)
- **Dependencies**: MySQL database

#### Juice Shop
- **Image**: `bkimminich/juice-shop`
- **Purpose**: Modern web app vulnerabilities
- **Ports**: 3000 (HTTP)
- **Features**: 100+ challenges, scoring system

#### Wazuh
- **Images**: `wazuh/wazuh-manager`, `wazuh/wazuh-dashboard`
- **Purpose**: Security monitoring and SIEM
- **Ports**: 1514, 1515, 514/udp, 55000, 5601
- **Features**: Log analysis, threat detection

#### Metasploitable
- **Image**: `tleemcjr/metasploitable2`
- **Purpose**: Penetration testing practice
- **Ports**: 8081 (HTTP), 2222 (SSH), 2121 (FTP)
- **Vulnerabilities**: Multiple outdated services

**Network Architecture**:
```
auron-network (172.18.0.0/16)
├── dvwa (172.18.0.2)
├── dvwa-db (172.18.0.3)
├── juiceshop (172.18.0.4)
├── wazuh (172.18.0.5)
├── wazuh-dashboard (172.18.0.6)
├── metasploitable (172.18.0.7)
└── backend (172.18.0.8)
```

## Data Flow

### Authentication Flow
```
1. User → POST /api/auth/register → Backend
2. Backend → Hash password → Store in DB
3. Backend → Generate JWT → Return to User
4. User → Store JWT locally
5. User → Include JWT in subsequent requests
```

### Progress Tracking Flow
```
1. User completes lab exercise
2. User/Extension → POST /api/progress + JWT → Backend
3. Backend → Verify JWT → Update database
4. Backend → Return success
5. User → GET /api/progress/stats → View progress
```

### Extension Analysis Flow
```
1. Page Load → Content Script injected
2. Content Script → Analyze DOM
3. Content Script → Send findings → Background Worker
4. Background Worker → Store in Chrome Storage
5. User opens popup → Display findings
6. User authenticated → Sync to Backend API
```

### Lab Access Flow
```
1. User → Start docker-compose
2. Docker creates network and containers
3. Services initialize and become accessible
4. User → Access via localhost ports
5. User practices vulnerabilities
6. User documents findings → Backend API
```

## Security Architecture

### Browser Extension Security
- Minimal required permissions
- Content Security Policy enforcement
- No external script loading
- Local-first data storage
- Optional backend sync

### Backend Security
- JWT with 7-day expiration
- Password hashing (bcrypt, 10 rounds)
- Rate limiting per IP
- Helmet.js security headers
- CORS whitelist
- Input validation
- SQL injection prevention

### Lab Isolation
- Docker network isolation
- No external network access by default
- Volume-based persistence
- Container resource limits
- Regular security updates

## Scalability Considerations

### Current Architecture (Single Machine)
- Suitable for: 1-50 concurrent users
- Database: SQLite (file-based)
- Deployment: Docker Compose

### Future Scaling Options

#### Medium Scale (50-500 users)
- Database: PostgreSQL/MySQL
- Caching: Redis
- Load Balancer: Nginx
- Multiple backend instances

#### Large Scale (500+ users)
- Database: Clustered PostgreSQL
- Message Queue: RabbitMQ/Redis
- Container Orchestration: Kubernetes
- CDN: CloudFront/CloudFlare
- Monitoring: Prometheus + Grafana

## API Design Principles

### RESTful Conventions
- Resource-based URLs (`/api/labs`, `/api/progress`)
- HTTP methods (GET, POST, PUT, DELETE)
- Status codes (200, 201, 400, 401, 404, 500)
- JSON request/response bodies

### Versioning Strategy
- URL versioning: `/api/v1/...`
- Backward compatibility maintained
- Deprecation warnings in headers

### Error Handling
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Extension Points

### Adding New Labs
1. Add service to `docker-compose.yml`
2. Document in `docker-lab/README.md`
3. Add lab metadata to backend via `/api/labs/initialize`
4. Create learning modules

### Adding New Analysis Features
1. Implement in extension `content.js` or `background.js`
2. Add UI in `popup.html`
3. Update backend API for data collection
4. Document feature usage

### Custom Authentication
- Implement custom auth provider in `backend/routes/auth.js`
- Support OAuth2, LDAP, SAML
- Maintain JWT token format for compatibility

## Technology Choices Rationale

### Why SQLite?
- Zero configuration
- Single file database
- Sufficient for small-medium deployments
- Easy backup and restore
- Low resource usage

### Why Chrome Extension?
- Direct browser integration
- Access to security APIs
- No additional software needed
- Cross-platform (Windows, Mac, Linux)

### Why Docker?
- Reproducible environments
- Easy distribution
- Isolation and security
- Cross-platform compatibility
- Industry standard

### Why Node.js?
- JavaScript ecosystem
- Fast development
- Large package ecosystem
- Good for I/O-bound operations
- Easy to deploy

## Monitoring and Observability

### Current Implementation
- Winston logging (file + console)
- Health check endpoint
- Docker container logs

### Future Enhancements
- Structured logging (JSON)
- Centralized log aggregation
- Metrics collection (Prometheus)
- Distributed tracing (Jaeger)
- Alerting (PagerDuty, Slack)

## Deployment Models

### Local Development
```bash
docker-compose up -d
cd backend && npm run dev
```

### Single Server Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment Options
- **AWS**: ECS + RDS + S3
- **Google Cloud**: GKE + Cloud SQL
- **Azure**: AKS + Azure Database
- **DigitalOcean**: Droplet + Managed Database

## Future Architecture Considerations

### Microservices Split
- Auth Service
- Lab Management Service
- Progress Tracking Service
- Report Generation Service
- Extension Sync Service

### Event-Driven Architecture
- Event bus for service communication
- Async processing of reports
- Real-time updates via WebSocket

### Multi-Tenancy
- Organization support
- Team collaboration
- Shared lab environments
- Role-based access control

## Performance Optimization

### Backend
- Database indexing on frequent queries
- Response caching (Redis)
- Connection pooling
- Async operations
- Pagination for large datasets

### Extension
- Debounced analysis
- Worker threads for heavy processing
- Efficient DOM queries
- Lazy loading of resources

### Labs
- Container resource limits
- Volume mounting optimization
- Image caching
- Parallel container startup

## Backup and Recovery

### Data Backup
```bash
# Database backup
cp backend/data/auron.db backup/auron-$(date +%Y%m%d).db

# Docker volumes backup
docker run --rm -v auron_dvwa-data:/data -v $(pwd):/backup alpine tar czf /backup/volumes-backup.tar.gz /data
```

### Disaster Recovery
1. Restore database from backup
2. Recreate Docker volumes
3. Restart services
4. Verify data integrity

---

For implementation details, refer to component-specific README files.
