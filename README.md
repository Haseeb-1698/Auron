# 🛡️ Auron - Cybersecurity Training Platform

> A production-ready, comprehensive cybersecurity training platform with React dashboard, TypeScript backend, containerized vulnerable applications, and AI-powered learning features.

## 🎯 Overview

**Auron** is a unified platform for cybersecurity education combining:
- 🎓 **Modern React Dashboard**: Full-featured web application with Material-UI
- 🐳 **Dockerized Lab Environment**: DVWA, Juice Shop, Wazuh, Metasploitable
- 🔌 **Chrome Security Extension**: Real-time vulnerability analysis
- 🤖 **AI-Powered Learning**: LiquidMetal AI integration for hints and explanations
- 🔄 **Real-time Collaboration**: WebSocket-based live sessions
- 📊 **Progress Tracking**: Gamification with points, badges, and leaderboards

## ✨ What's New in v2.0

- ✅ **Complete TypeScript Migration**: Frontend and backend
- ✅ **React 18+ Dashboard**: Modern UI with Material-UI components
- ✅ **Redux Toolkit**: Centralized state management
- ✅ **PostgreSQL + Redis**: Production-grade database and caching
- ✅ **Clean Architecture**: Repository pattern, dependency injection
- ✅ **WebSocket Support**: Real-time updates via Socket.IO
- ✅ **Docker Multi-stage Builds**: Optimized production containers
- ✅ **Test Infrastructure**: Vitest, Cypress, Jest configured
- ✅ **CI/CD Ready**: GitHub Actions configuration included

## ✨ Features

### 🔬 Lab Environment
- **DVWA (Damn Vulnerable Web Application)**: Practice OWASP Top 10 vulnerabilities
- **OWASP Juice Shop**: Modern vulnerable web app with 100+ challenges
- **Wazuh**: Security monitoring and SIEM platform
- **Metasploitable**: Penetration testing practice environment

### 🔍 Browser Extension
- **Cookie Analysis**: Detect insecure cookie configurations
- **Session Security**: Identify session management vulnerabilities
- **CSP Evaluation**: Analyze Content Security Policy headers
- **Phishing Detection**: URL analysis and OpenPhish API integration ready

### 🔧 Backend API
- **User Authentication**: Secure JWT-based authentication
- **Progress Tracking**: Monitor learning progress across labs
- **Report Generation**: Store and retrieve security findings
- **Lab Management**: Track available labs and exercises

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose v2.0+
- Node.js 18+ and npm 9+
- 8GB RAM minimum
- 20GB free disk space

### Installation (All Services via Docker)

1. **Clone and setup environment**
```bash
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron
cp .env.example .env
# Edit .env with your configuration
```

2. **Start all services**
```bash
docker-compose up -d
```

This starts:
- Frontend Dashboard (port 5173)
- Backend API (port 4000)
- PostgreSQL Database (port 5432)
- Redis Cache (port 6379)
- DVWA Lab (port 8080)
- Juice Shop (port 3000)
- Wazuh Dashboard (port 5601)
- Metasploitable (port 8081)

3. **Access the dashboard**
```
http://localhost:5173
```

### Development Mode

**Frontend**:
```bash
cd frontend
npm install
npm run dev    # Starts on http://localhost:5173
```

**Backend**:
```bash
cd backend
npm install
npm run dev    # Starts on http://localhost:4000
```

### Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend Dashboard** | http://localhost:5173 | Register new account |
| **Backend API** | http://localhost:4000/api | - |
| **DVWA** | http://localhost:8080 | admin / password |
| **Juice Shop** | http://localhost:3000 | - |
| **Wazuh Dashboard** | http://localhost:5601 | admin / SecretPassword |
| **Metasploitable** | http://localhost:8081 | - |
| **PostgreSQL** | localhost:5432 | See .env file |
| **Redis** | localhost:6379 | - |

## 📚 Project Structure

```
Auron/
├── frontend/                    # React TypeScript Dashboard
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── features/           # Redux slices (auth, labs, dashboard)
│   │   ├── pages/              # Route pages
│   │   ├── services/           # API & WebSocket clients
│   │   ├── store/              # Redux store
│   │   └── types/              # TypeScript definitions
│   ├── Dockerfile              # Multi-stage production build
│   └── package.json
│
├── backend/                    # Node.js TypeScript API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Data access layer
│   │   ├── models/             # Database models
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API routes
│   │   ├── websocket/          # Socket.IO handlers
│   │   └── server.ts           # Entry point
│   ├── tests/                  # Jest tests
│   ├── Dockerfile              # Multi-stage production build
│   └── package.json
│
├── browser-extension/          # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/                  # Extension UI
│   └── js/                     # Background & content scripts
│
├── shared/                     # Shared TypeScript types
├── deployment/                 # Deployment configs (Vultr, scripts)
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # All services orchestration
├── IMPLEMENTATION_GUIDE.md     # Detailed implementation docs
└── package.json                # Root workspace config
```

## 🎓 Learning Paths

### 1️⃣ Beginner Path: Web Application Security
1. Setup DVWA and practice SQL Injection
2. Learn XSS fundamentals
3. Understand CSRF attacks
4. Use browser extension to analyze real websites

### 2️⃣ Intermediate Path: Modern Web Security
1. Complete Juice Shop challenges
2. Study CSP implementation
3. Practice session management
4. Analyze security headers with extension

### 3️⃣ Advanced Path: Penetration Testing
1. Enumerate Metasploitable services
2. Exploit known vulnerabilities
3. Practice post-exploitation
4. Study Wazuh detection mechanisms

### 4️⃣ Defensive Path: Security Monitoring
1. Configure Wazuh agents
2. Create custom detection rules
3. Analyze attack patterns
4. Build incident response procedures

## 🔐 Security Considerations

⚠️ **IMPORTANT SECURITY WARNINGS**:

- All lab applications are **INTENTIONALLY VULNERABLE**
- **NEVER** expose lab services to the internet
- Run labs in isolated network environments only
- Use for educational purposes exclusively
- Reset lab environments regularly
- Do not use real credentials or sensitive data

## 🛠️ Development

### Backend Development
```bash
cd backend
npm install
npm run dev  # Start with nodemon for auto-reload
```

### Backend API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

#### Progress Tracking
- `GET /api/progress` - Get user progress
- `POST /api/progress` - Update progress
- `GET /api/progress/stats` - Get statistics

#### Reports
- `POST /api/reports` - Create security report
- `GET /api/reports` - List user reports
- `POST /api/reports/extension-finding` - Save extension findings

#### Labs
- `GET /api/labs` - List all labs
- `GET /api/labs/:id` - Get specific lab
- `POST /api/labs/initialize` - Initialize default labs

### Extension Development
```bash
cd browser-extension
# Make changes to files
# Reload extension in Chrome (chrome://extensions/)
```

### Tech Stack

**Frontend**:
- React 18+ with TypeScript
- Material-UI (MUI) components
- Redux Toolkit for state management
- React Router for navigation
- Socket.IO client for WebSocket
- Axios for HTTP requests
- Vite for build tooling
- Vitest + Cypress for testing

**Backend**:
- Node.js + Express with TypeScript
- PostgreSQL database (Sequelize ORM)
- Redis for caching and sessions
- Socket.IO for real-time features
- JWT authentication + 2FA (Speakeasy)
- Dockerode for container management
- Winston for logging
- Jest + Supertest for testing

**Infrastructure**:
- Docker + Docker Compose
- Multi-stage production builds
- Nginx for frontend serving
- PostgreSQL 15 + Redis 7
- Health checks and auto-restart

### Database Schema

**PostgreSQL** tables:
- `users` - User accounts with 2FA support
- `labs` - Lab definitions and configurations
- `lab_instances` - Running container instances
- `progress` - User progress per lab/exercise
- `reports` - Security findings and reports
- `achievements` - User achievements and badges
- `collaboration_sessions` - Live collaboration data

## 📖 Documentation

- [Docker Lab Guide](docker-lab/README.md) - Detailed lab setup and usage
- [Browser Extension Guide](browser-extension/README.md) - Extension features and development
- [API Documentation](backend/README.md) - Backend API reference (coming soon)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Consider security implications
- Test in isolated environment

## 🗺️ Roadmap

- [ ] Add more vulnerable applications (WebGoat, bWAPP)
- [ ] Implement OpenPhish API integration
- [ ] Add real-time collaboration features
- [ ] Create mobile companion app
- [ ] Add CTF challenge mode
- [ ] Implement automated vulnerability scanning
- [ ] Add video tutorials and walkthroughs
- [ ] Create certification program

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Legal Disclaimer

This platform is designed for educational purposes only. Users must:
- Only use on systems they own or have permission to test
- Comply with all applicable laws and regulations
- Not use for malicious purposes
- Understand that unauthorized hacking is illegal

The authors and contributors are not responsible for misuse of this platform.

## 🙏 Acknowledgments

- [OWASP](https://owasp.org/) for vulnerable applications
- [Wazuh](https://wazuh.com/) for security monitoring platform
- [Rapid7](https://www.rapid7.com/) for Metasploitable
- All contributors and the security community

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/Haseeb-1698/Auron/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Haseeb-1698/Auron/discussions)
- **Email**: [Contact maintainers](mailto:support@example.com)

## 🌟 Star History

If you find Auron useful, please consider giving it a star ⭐ on GitHub!

---

**Made with ❤️ for the cybersecurity community**
