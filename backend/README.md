# Auron Backend API

REST API for the Auron cybersecurity training platform, providing user authentication, progress tracking, and reporting functionality.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting

## Setup

### Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=sqlite:./data/auron.db
JWT_SECRET=your-secret-key-change-this-in-production
```

### Docker Deployment

```bash
# Build image
docker build -t auron-backend .

# Run container
docker run -p 4000:4000 -v auron-data:/app/data auron-backend
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "student123",
  "email": "student@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "student123",
    "email": "student@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "student123",
  "password": "securepassword"
}
```

### Progress Tracking

All progress endpoints require authentication. Include JWT token in header:
```http
Authorization: Bearer <token>
```

#### Get User Progress
```http
GET /api/progress
```

#### Get Lab-Specific Progress
```http
GET /api/progress/lab/dvwa
```

#### Update Progress
```http
POST /api/progress
Content-Type: application/json

{
  "lab_id": "dvwa",
  "module_id": "sql-injection-1",
  "completed": true,
  "score": 100
}
```

#### Get Statistics
```http
GET /api/progress/stats
```

### Reports

#### Create Report
```http
POST /api/reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "report_type": "vulnerability",
  "title": "SQL Injection in Login Form",
  "description": "Found SQL injection vulnerability in login.php",
  "severity": "high",
  "findings": {
    "url": "http://localhost:8080/login.php",
    "parameter": "username",
    "payload": "' OR '1'='1"
  }
}
```

#### Get All Reports
```http
GET /api/reports
Authorization: Bearer <token>
```

#### Get Specific Report
```http
GET /api/reports/:id
Authorization: Bearer <token>
```

#### Save Extension Finding
```http
POST /api/reports/extension-finding
Content-Type: application/json
Authorization: Bearer <token>

{
  "url": "https://example.com",
  "finding_type": "cookie",
  "details": {
    "cookie_name": "session_id",
    "issues": ["Missing Secure flag", "Missing HttpOnly"]
  },
  "risk_level": "high"
}
```

#### Get Extension Findings
```http
GET /api/reports/extension-findings
Authorization: Bearer <token>
```

### Labs

#### Get All Labs
```http
GET /api/labs
```

#### Get Specific Lab
```http
GET /api/labs/dvwa
```

#### Initialize Default Labs
```http
POST /api/labs/initialize
```

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Database Schema

### users
- `id` INTEGER PRIMARY KEY
- `username` TEXT UNIQUE
- `email` TEXT UNIQUE
- `password_hash` TEXT
- `created_at` DATETIME
- `updated_at` DATETIME

### user_progress
- `id` INTEGER PRIMARY KEY
- `user_id` INTEGER (FK)
- `lab_id` TEXT
- `module_id` TEXT
- `completed` BOOLEAN
- `score` INTEGER
- `completed_at` DATETIME
- `created_at` DATETIME

### reports
- `id` INTEGER PRIMARY KEY
- `user_id` INTEGER (FK)
- `report_type` TEXT
- `title` TEXT
- `description` TEXT
- `severity` TEXT
- `findings` TEXT (JSON)
- `created_at` DATETIME

### extension_findings
- `id` INTEGER PRIMARY KEY
- `user_id` INTEGER (FK)
- `url` TEXT
- `finding_type` TEXT
- `details` TEXT (JSON)
- `risk_level` TEXT
- `created_at` DATETIME

### labs
- `id` TEXT PRIMARY KEY
- `name` TEXT
- `description` TEXT
- `difficulty` TEXT
- `category` TEXT
- `docker_service` TEXT
- `created_at` DATETIME

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Request body validation
- **SQL Injection Prevention**: Parameterized queries

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Logging

Logs are written to:
- `error.log` - Error-level logs
- `combined.log` - All logs
- Console - Development environment

## Performance

- SQLite for lightweight deployment
- Connection pooling
- Efficient indexing on frequently queried fields
- Rate limiting to prevent abuse

## Deployment

### Production Considerations

1. **Use PostgreSQL or MySQL** for production instead of SQLite
2. **Set strong JWT_SECRET** in environment variables
3. **Enable HTTPS** with proper SSL certificates
4. **Configure proper CORS** origins
5. **Set up monitoring** and alerting
6. **Regular backups** of database
7. **Update dependencies** regularly

### Docker Compose (Production)

```yaml
backend:
  build: ./backend
  environment:
    - NODE_ENV=production
    - DATABASE_URL=postgresql://user:pass@db:5432/auron
    - JWT_SECRET=${JWT_SECRET}
  depends_on:
    - db
```

## Troubleshooting

### Database locked error
```bash
# Ensure no other processes are accessing the database
lsof data/auron.db
```

### Port already in use
```bash
# Change PORT in .env file or kill process
lsof -ti:4000 | xargs kill -9
```

### JWT token invalid
- Check token expiration (default 7 days)
- Verify JWT_SECRET matches between sessions
- Ensure Authorization header format: `Bearer <token>`

## Contributing

When contributing to the backend:
1. Follow existing code structure
2. Add tests for new endpoints
3. Update this documentation
4. Use ESLint for code formatting
5. Handle errors properly

## License

MIT License - See LICENSE file for details
