# Contributing to Auron

Thank you for your interest in contributing to Auron! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check the [existing issues](https://github.com/Haseeb-1698/Auron/issues)
2. Verify you're using the latest version
3. Check the [troubleshooting guide](docs/GETTING_STARTED.md#troubleshooting)

When filing a bug report, include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Docker version, Node version)
- Screenshots or logs if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:
- Clear description of the feature
- Use cases and benefits
- Potential implementation approach
- Any relevant examples or mockups

### Pull Requests

#### Before You Start

1. Check if an issue exists for your change
2. For major changes, open an issue first to discuss
3. Fork the repository
4. Create a feature branch from `main`

#### Development Process

1. **Setup Development Environment**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Auron.git
   cd Auron
   docker-compose up -d
   cd backend && npm install && npm run dev
   ```

2. **Make Your Changes**
   - Follow existing code style
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

3. **Test Your Changes**
   ```bash
   # Test backend
   cd backend
   npm test
   
   # Test Docker services
   docker-compose ps
   docker-compose logs
   
   # Test extension
   # Load unpacked extension and test manually
   ```

4. **Submit Pull Request**
   - Push to your fork
   - Create PR against `main` branch
   - Fill out the PR template
   - Link related issues

#### PR Guidelines

- One feature/fix per PR
- Clear PR title and description
- Reference related issues
- Include screenshots for UI changes
- Ensure all checks pass
- Be responsive to review feedback

## Development Guidelines

### Code Style

#### JavaScript
- Use ES6+ features
- 2-space indentation
- Semicolons required
- Use `const` over `let` when possible
- Meaningful variable names

Example:
```javascript
// Good
const getUserProgress = async (userId) => {
  const progress = await db.getUserProgress(userId);
  return progress;
};

// Avoid
var getdata = function(id) {
  return db.get(id)
}
```

#### File Organization
```
component/
├── index.js          # Main export
├── helpers.js        # Helper functions
├── config.js         # Configuration
└── README.md         # Component docs
```

### Backend Development

#### API Endpoints
- RESTful conventions
- Proper HTTP methods and status codes
- Input validation
- Error handling
- Authentication where needed

#### Database
- Use parameterized queries
- Add indexes for performance
- Include migrations for schema changes
- Document schema changes

#### Security
- Never commit secrets
- Validate all inputs
- Use prepared statements
- Implement rate limiting
- Log security events

### Extension Development

#### Structure
- Separate concerns (UI, logic, API)
- Use message passing for communication
- Minimal permissions
- Handle errors gracefully

#### Performance
- Debounce expensive operations
- Use efficient DOM queries
- Cache when appropriate
- Lazy load resources

### Docker/Lab Development

#### Adding New Labs
1. Research the vulnerable application
2. Test the Docker image locally
3. Add to `docker-compose.yml`
4. Configure networking and ports
5. Document in `docker-lab/README.md`
6. Create learning modules
7. Test deployment

#### Configuration
- Use environment variables
- Provide sensible defaults
- Document all options
- Include health checks

### Documentation

#### Required Documentation
- README for new features
- API documentation for endpoints
- Inline comments for complex logic
- Architecture docs for major changes

#### Documentation Style
- Clear and concise
- Include examples
- Use proper markdown
- Add diagrams where helpful

## Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(extension): add phishing detection with OpenPhish API

Integrate OpenPhish API to check URLs against known phishing sites.
Adds configuration option for API key in extension settings.

Closes #123
```

```
fix(backend): prevent SQL injection in progress endpoint

Use parameterized queries instead of string concatenation.

Fixes #456
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

Test coverage requirements:
- New features: minimum 80% coverage
- Bug fixes: add regression test
- API endpoints: test success and error cases

### Extension Testing
Manual testing checklist:
- [ ] Cookie analysis works on test sites
- [ ] Session detection identifies session cookies
- [ ] CSP analysis shows correct headers
- [ ] Phishing detection flags suspicious URLs
- [ ] Export functionality creates valid JSON
- [ ] Extension works across page reloads

### Integration Testing
```bash
# Start all services
docker-compose up -d

# Run integration tests
npm run test:integration
```

## Review Process

### Reviewer Guidelines
- Be constructive and respectful
- Focus on code quality and maintainability
- Check for security implications
- Verify documentation is updated
- Test changes locally when needed

### Author Guidelines
- Respond to feedback promptly
- Don't take criticism personally
- Ask questions if unclear
- Update PR based on feedback
- Mark conversations as resolved

## Release Process

1. Version bump in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Generate release notes
5. Update Docker images
6. Announce release

## Getting Help

- **Questions**: Open a [Discussion](https://github.com/Haseeb-1698/Auron/discussions)
- **Bugs**: Open an [Issue](https://github.com/Haseeb-1698/Auron/issues)
- **Chat**: Join our community (link TBD)

## Recognition

Contributors are recognized in:
- README contributors section
- Release notes
- Git commit history

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Additional Resources

- [Getting Started Guide](docs/GETTING_STARTED.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](backend/README.md)
- [Extension Guide](browser-extension/README.md)

---

Thank you for contributing to Auron! 🎉
