# Changelog

All notable changes to the Auron project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure
- Docker-based lab environment with DVWA, Juice Shop, Wazuh, and Metasploitable
- Chrome browser extension with security analysis features
- Backend API with authentication, progress tracking, and reporting
- Comprehensive documentation

## [1.0.0] - 2024-01-01

### Added

#### Docker Lab Environment
- Docker Compose configuration for easy deployment
- DVWA (Damn Vulnerable Web Application) setup with MySQL
- OWASP Juice Shop integration
- Wazuh security monitoring platform
- Metasploitable 2 for penetration testing practice
- Isolated bridge network for all services
- Persistent volume storage for lab data

#### Browser Extension
- Cookie security analysis
  - Detects missing Secure flags
  - Identifies HttpOnly attribute issues
  - Checks SameSite policy configuration
- Session management analysis
  - Identifies session cookies
  - Checks secure transmission
  - Detects XSS vulnerabilities
- Content Security Policy (CSP) evaluation
  - Analyzes CSP headers
  - Detects unsafe inline scripts
  - Identifies wildcard sources
- Phishing detection
  - URL pattern analysis
  - IDN homograph attack detection
  - OpenPhish API integration ready
- Real-time page analysis with content scripts
- Background service worker for monitoring
- Export functionality for security reports
- Modern popup UI with tabbed interface

#### Backend API
- RESTful API with Express.js
- SQLite database for lightweight deployment
- User authentication system
  - Registration endpoint
  - Login with JWT tokens
  - Password hashing with bcrypt
- Progress tracking
  - Lab completion tracking
  - Module-level progress
  - Statistics and analytics
- Reporting system
  - Vulnerability report creation
  - Extension findings storage
  - Report retrieval and management
- Lab management
  - Lab metadata storage
  - Lab information endpoints
  - Default labs initialization
- Security features
  - JWT authentication
  - Rate limiting (100 req/15min)
  - Helmet.js security headers
  - CORS configuration
  - SQL injection prevention

#### Documentation
- Comprehensive main README with quick start guide
- Architecture documentation
- Getting started guide for new users
- Backend API documentation
- Browser extension guide
- Docker lab setup guide
- Contributing guidelines
- Security policy
- License information

#### Development Tools
- `.gitignore` for Node.js, Docker, and IDE files
- Environment configuration templates
- Docker health checks
- Logging configuration

### Security
- JWT-based authentication
- Password hashing with bcrypt (10 rounds)
- Rate limiting on API endpoints
- Parameterized database queries
- Security headers with Helmet.js
- CORS protection
- Input validation

### Infrastructure
- Docker Compose for orchestration
- Named volumes for data persistence
- Bridge network for service communication
- Health check endpoints
- Dockerfiles for custom services

---

## Release Notes

### Version 1.0.0 - Initial Release

This is the first release of Auron, providing a complete cybersecurity training platform with:

**For Students:**
- Hands-on practice with real vulnerabilities
- Progressive difficulty from beginner to advanced
- Real-time security analysis tools
- Progress tracking and reporting

**For Educators:**
- Ready-to-deploy lab environment
- Pre-configured vulnerable applications
- Student progress monitoring
- Customizable learning paths

**For Developers:**
- Open source and extensible
- Well-documented codebase
- Modern technology stack
- Active development

**Known Issues:**
- Extension icons are placeholders (need proper PNG images)
- OpenPhish API integration needs API key configuration
- SQLite not recommended for high-traffic production
- Manual lab initialization required

**Upcoming Features:**
- Additional vulnerable applications (WebGoat, bWAPP)
- Real-time OpenPhish API integration
- Team collaboration features
- CTF challenge mode
- Mobile companion app
- Automated vulnerability scanning
- Video tutorials

---

## Migration Guides

### Migrating to v1.0.0

This is the initial release, no migration needed.

---

## Deprecation Notices

None for initial release.

---

For detailed changes, see the [commit history](https://github.com/Haseeb-1698/Auron/commits/main).
