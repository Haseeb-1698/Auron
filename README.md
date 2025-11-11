# 🛡️ Auron - Cybersecurity Training Platform

A comprehensive, unified cybersecurity training platform combining hands-on vulnerable application labs with real-time browser security analysis. Auron enables students and security professionals to learn, test, and defend within a single integrated environment.

## 🎯 Overview

Auron provides:
- **Docker-based Lab Environment**: Pre-configured vulnerable applications for hands-on practice
- **Browser Security Extension**: Real-time analysis of cookies, sessions, CSP, and phishing indicators
- **Backend API**: Progress tracking, reporting, and user management
- **Comprehensive Learning Path**: From beginner to advanced security concepts

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
- Docker and Docker Compose (20.10+)
- Node.js 18+ (for backend development)
- Chrome Browser (for extension)
- 8GB RAM minimum
- 20GB free disk space

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron
```

2. **Start the lab environment**
```bash
docker-compose up -d
```

3. **Initialize the backend**
```bash
cd backend
npm install
npm start
```

4. **Install the browser extension**
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `browser-extension` directory

### Accessing Services

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| DVWA | http://localhost:8080 | admin / password |
| Juice Shop | http://localhost:3000 | - |
| Wazuh Dashboard | http://localhost:5601 | admin / SecretPassword |
| Metasploitable | http://localhost:8081 | - |
| Backend API | http://localhost:4000 | - |

## 📚 Project Structure

```
Auron/
├── docker-compose.yml           # Main Docker configuration
├── backend/                     # Node.js/Express API
│   ├── server.js               # API server
│   ├── routes/                 # API endpoints
│   ├── config/                 # Database configuration
│   ├── middleware/             # Authentication middleware
│   └── Dockerfile              # Backend container
├── browser-extension/          # Chrome extension
│   ├── manifest.json          # Extension configuration
│   ├── popup/                 # Extension UI
│   ├── js/                    # Background and content scripts
│   └── icons/                 # Extension icons
├── docker-lab/                 # Lab documentation
│   └── README.md              # Lab setup guide
└── docs/                       # Additional documentation

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

### Database Schema

The backend uses SQLite with the following tables:
- `users` - User accounts
- `user_progress` - Learning progress tracking
- `reports` - Security reports
- `extension_findings` - Browser extension findings
- `labs` - Available lab information

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
