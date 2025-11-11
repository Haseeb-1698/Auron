# Auron Examples

This directory contains example scripts and configurations for working with the Auron platform.

## Available Examples

### API Example (`api-example.js`)

A Node.js script demonstrating how to interact with the Auron Backend API.

**Features:**
- User registration and authentication
- Progress tracking
- Lab information retrieval
- Report creation
- Statistics viewing

**Usage:**
```bash
# Install node-fetch if needed (Node.js < 18)
npm install node-fetch

# Run the example
node examples/api-example.js

# Or with custom API URL
AURON_API_URL=http://localhost:4000/api node examples/api-example.js
```

**Output:**
```
========================================
   Auron API Example
========================================

Registering user...
✓ Registration successful

--- Fetching Available Labs ---
Found 4 labs
  - DVWA - Damn Vulnerable Web Application (beginner)
  - OWASP Juice Shop (intermediate)
  - Wazuh Security Monitoring (advanced)
  - Metasploitable (advanced)

--- Updating Progress ---
Updating progress for dvwa/sql-injection-1...
✓ Progress updated
...
```

### Using the Client Class

You can also import and use the `AuronClient` class in your own scripts:

```javascript
const AuronClient = require('./examples/api-example');

const client = new AuronClient('http://localhost:4000/api');

await client.login('username', 'password');
await client.updateProgress('dvwa', 'sql-injection-1', true, 100);
const stats = await client.getStats();
console.log(stats);
```

## Configuration Examples

### Docker Compose Override

See `docker-compose.override.yml.example` for customizing Docker services.

Copy and modify:
```bash
cp docker-compose.override.yml.example docker-compose.override.yml
# Edit docker-compose.override.yml with your changes
docker-compose up -d
```

### Backend Environment Variables

See `backend/.env.example` for backend configuration options.

```bash
cd backend
cp .env.example .env
# Edit .env with your settings
npm start
```

## More Examples

### cURL Examples

#### Register User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student",
    "email": "student@example.com",
    "password": "SecurePassword123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student",
    "password": "SecurePassword123"
  }'
```

#### Update Progress
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:4000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "lab_id": "dvwa",
    "module_id": "sql-injection-1",
    "completed": true,
    "score": 100
  }'
```

#### Get Progress
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/progress
```

#### Create Report
```bash
curl -X POST http://localhost:4000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "report_type": "vulnerability",
    "title": "SQL Injection Found",
    "description": "SQL injection in login form",
    "severity": "high",
    "findings": {
      "url": "http://localhost:8080/login.php",
      "payload": "'\'' OR '\''1'\''='\''1"
    }
  }'
```

### Python Example

```python
import requests
import json

class AuronClient:
    def __init__(self, base_url='http://localhost:4000/api'):
        self.base_url = base_url
        self.token = None
    
    def register(self, username, email, password):
        response = requests.post(
            f'{self.base_url}/auth/register',
            json={'username': username, 'email': email, 'password': password}
        )
        data = response.json()
        self.token = data.get('token')
        return data
    
    def login(self, username, password):
        response = requests.post(
            f'{self.base_url}/auth/login',
            json={'username': username, 'password': password}
        )
        data = response.json()
        self.token = data.get('token')
        return data
    
    def get_progress(self):
        response = requests.get(
            f'{self.base_url}/progress',
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return response.json()

# Usage
client = AuronClient()
client.login('student', 'SecurePassword123')
progress = client.get_progress()
print(json.dumps(progress, indent=2))
```

## Testing Extensions

### Testing Cookie Analysis

1. Visit a site with cookies (e.g., http://localhost:8080)
2. Open Auron extension
3. Go to "Cookies" tab
4. Verify cookie analysis shows security issues

### Testing Phishing Detection

1. Visit http://localhost:8080
2. Open Auron extension
3. Go to "Phishing" tab
4. Should show "No phishing indicators" for localhost

### Testing CSP Analysis

1. Visit a site with CSP header
2. Open Auron extension
3. Go to "CSP" tab
4. Verify CSP policy is displayed and analyzed

## Lab Exercise Examples

### DVWA SQL Injection

1. Access http://localhost:8080
2. Login with admin/password
3. Go to SQL Injection page
4. Try: `1' OR '1'='1`
5. Document findings in Auron

### Juice Shop Challenge

1. Access http://localhost:3000
2. Try to access admin page
3. Analyze with browser extension
4. Document findings

## Troubleshooting

### Example Script Fails

**Problem:** `node examples/api-example.js` fails with connection error

**Solution:**
```bash
# Make sure backend is running
cd backend
npm start

# Or start with Docker
docker-compose up -d backend
```

### Authentication Errors

**Problem:** "Invalid token" errors

**Solution:**
- Token may have expired (7 day validity)
- Login again to get new token
- Check that JWT_SECRET hasn't changed

### No Labs Found

**Problem:** `getLabs()` returns empty array

**Solution:**
```bash
# Initialize labs
curl -X POST http://localhost:4000/api/labs/initialize
```

## Contributing Examples

To contribute new examples:

1. Create a new file in this directory
2. Add documentation to this README
3. Include usage instructions
4. Test thoroughly
5. Submit a pull request

## Support

For help with examples:
- Check main documentation in `docs/`
- Review API documentation in `backend/README.md`
- Open an issue on GitHub
