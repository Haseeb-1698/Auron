# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

**⚠️ Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Auron, please report it responsibly:

### Reporting Process

1. **Email**: Send details to security@example.com (replace with actual email)
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Response**: You'll receive acknowledgment within 48 hours
4. **Updates**: We'll keep you informed of progress

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Best effort

### Disclosure Policy

- We practice responsible disclosure
- Security advisories published after fix is released
- Credit given to reporters (unless anonymity requested)

## Security Considerations

### Platform Security

**Important**: Auron is an educational platform featuring intentionally vulnerable applications.

#### Lab Environment Security

⚠️ **CRITICAL WARNINGS**:

1. **Never expose lab services to the internet**
   - All vulnerable applications (DVWA, Juice Shop, Metasploitable) are intentionally insecure
   - Exposing them could compromise your entire network
   - Use only in isolated, local environments

2. **Network Isolation**
   - Run on private networks only
   - Use firewall rules to restrict access
   - Consider using separate VLANs or VM isolation

3. **Resource Access**
   - Do not store sensitive data in lab environments
   - Use separate credentials from production systems
   - Regularly reset lab containers

4. **Host System Security**
   - Keep Docker and host OS updated
   - Use strong passwords for lab access
   - Monitor system resources and logs

#### Backend Security

The backend API implements several security measures:

1. **Authentication**
   - JWT token-based authentication
   - 7-day token expiration
   - Strong password requirements recommended

2. **Password Security**
   - Bcrypt hashing with 10 rounds
   - Passwords never stored in plaintext
   - No password hints or recovery without verification

3. **API Security**
   - Rate limiting (100 requests per 15 minutes)
   - CORS configuration
   - Helmet.js security headers
   - Input validation

4. **Database Security**
   - Parameterized queries (SQL injection prevention)
   - No exposed database ports
   - Regular backups recommended

#### Extension Security

The browser extension follows security best practices:

1. **Permissions**
   - Minimal required permissions
   - No unnecessary data access
   - Transparent about data collection

2. **Data Handling**
   - Local-first storage
   - Optional backend sync
   - No third-party analytics

3. **Content Security**
   - No external script loading
   - CSP enforcement
   - XSS prevention

### Known Limitations

1. **SQLite for Production**
   - Default SQLite not suitable for high-traffic production
   - Recommend PostgreSQL or MySQL for production deployments

2. **JWT Storage**
   - Tokens stored in local storage (XSS vulnerable)
   - Consider httpOnly cookies for production

3. **Rate Limiting**
   - IP-based (can be bypassed with proxies)
   - Consider more sophisticated solutions for production

4. **Session Management**
   - No automatic token refresh
   - No session revocation mechanism
   - Consider Redis-based sessions for production

### Security Best Practices

#### For Users

1. **Lab Usage**
   ```bash
   # Good: Local access only
   http://localhost:8080
   
   # Bad: Exposing to network
   http://0.0.0.0:8080
   ```

2. **Password Management**
   - Use strong, unique passwords
   - Don't reuse production passwords
   - Consider password manager

3. **Environment Separation**
   - Dedicated machine or VM for labs
   - Separate network if possible
   - Regular system updates

4. **Data Handling**
   - No real credentials in practice
   - No sensitive data in reports
   - Regular cleanup of findings

#### For Developers

1. **Code Review**
   - All PRs reviewed for security
   - Use static analysis tools
   - Check dependencies for vulnerabilities

2. **Dependency Management**
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Fix vulnerabilities
   npm audit fix
   ```

3. **Secret Management**
   - Never commit secrets to git
   - Use environment variables
   - Rotate credentials regularly
   - Use `.env.example` for templates

4. **Input Validation**
   ```javascript
   // Always validate and sanitize input
   const { username, email } = req.body;
   if (!isValidUsername(username)) {
     return res.status(400).json({ error: 'Invalid username' });
   }
   ```

5. **Error Handling**
   ```javascript
   // Don't expose sensitive error details
   // Good
   res.status(500).json({ error: 'An error occurred' });
   
   // Bad - exposes internals
   res.status(500).json({ error: error.stack });
   ```

### Vulnerability Disclosure

If a vulnerability is found:

1. **Assessment**: We evaluate severity and impact
2. **Fix Development**: Create and test patch
3. **Release**: Deploy fix to supported versions
4. **Advisory**: Publish security advisory
5. **Credit**: Acknowledge reporter (if desired)

### Security Updates

- Security patches released as soon as possible
- Users notified via GitHub security advisories
- Upgrade instructions provided
- Breaking changes documented

### Scope

#### In Scope
- Backend API vulnerabilities
- Browser extension security issues
- Docker configuration problems
- Authentication/authorization flaws
- Data exposure risks

#### Out of Scope
- Vulnerabilities in intentionally vulnerable lab apps (DVWA, Juice Shop, etc.)
- Social engineering attacks
- Physical access attacks
- DDoS attacks
- Issues in third-party dependencies (report to upstream)

### Security Checklist for Deployments

- [ ] Change default JWT_SECRET
- [ ] Use HTTPS for production
- [ ] Configure firewall rules
- [ ] Isolate lab network
- [ ] Enable Docker security features
- [ ] Regular backups configured
- [ ] Monitoring and logging enabled
- [ ] Keep all systems updated
- [ ] Strong passwords enforced
- [ ] Review access permissions

### Compliance

This project:
- Does not store personal data by default
- Provides data export functionality
- Allows data deletion
- Uses industry-standard security practices

### Contact

For security-related questions:
- Security issues: security@example.com
- General questions: GitHub Discussions
- Urgent issues: Mark email as "URGENT SECURITY"

### References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)

---

Last Updated: 2024-01-01

**Remember**: The vulnerable applications in this platform are for EDUCATIONAL purposes only. Always practice ethical and legal security testing.
