import { v4 as uuidv4 } from 'uuid';

/**
 * Seed data for the 4 main Docker lab environments:
 * 1. DVWA - Damn Vulnerable Web Application
 * 2. OWASP Juice Shop
 * 3. Metasploitable 2
 * 4. Wazuh Security Platform
 */

export const labsSeedData = [
  // ============================================================================
  // 1. DVWA - Damn Vulnerable Web Application
  // ============================================================================
  {
    id: uuidv4(),
    name: 'DVWA - Damn Vulnerable Web Application',
    description:
      'Foundation for learning OWASP Top 10 vulnerabilities in a PHP-based application with adjustable security levels (Low/Medium/High/Impossible). Practice SQL injection, XSS, CSRF, file upload vulnerabilities, command injection, and more.',
    category: 'web_security',
    difficulty: 'beginner',
    estimatedTime: 180, // 3 hours
    points: 500,
    tags: [
      'owasp-top-10',
      'sql-injection',
      'xss',
      'csrf',
      'file-upload',
      'command-injection',
      'php',
      'mysql',
    ],
    imageUrl: '/assets/lab-images/dvwa.png',
    containerConfig: {
      image: 'vulnerables/web-dvwa:latest',
      ports: [
        { container: 80, host: 8080 },
        { container: 3306, host: 3306 }, // MySQL
      ],
      environment: {
        MYSQL_HOST: 'dvwa-db',
        MYSQL_DATABASE: 'dvwa',
        MYSQL_USER: 'dvwa',
        MYSQL_PASSWORD: 'p@ssw0rd',
        MYSQL_ROOT_PASSWORD: 'root',
      },
      volumes: ['dvwa-data:/var/www/html'],
      networks: ['auron-network'],
      memoryLimit: '512m',
      cpuLimit: '1.0',
      dependsOn: ['dvwa-db'],
    },
    exercises: [
      {
        id: 'dvwa-sqli-1',
        title: 'SQL Injection - Authentication Bypass',
        description: 'Bypass the login using SQL injection techniques',
        instructions:
          "Navigate to the SQL Injection module and try to bypass authentication. Test various payloads like ' OR '1'='1",
        hints: [
          { id: 'hint-1', content: "Try using ' OR '1'='1 in the user field", cost: 10 },
          { id: 'hint-2', content: 'Comment out the rest of the query using --', cost: 20 },
          { id: 'hint-3', content: "Complete payload: admin' OR '1'='1' --", cost: 30 },
        ],
        points: 100,
        order: 1,
        difficulty: 'beginner',
        category: 'sql-injection',
      },
      {
        id: 'dvwa-xss-1',
        title: 'Reflected XSS Attack',
        description: 'Execute a reflected XSS attack to steal session cookies',
        instructions:
          'Find and exploit a reflected XSS vulnerability to execute arbitrary JavaScript',
        hints: [
          { id: 'hint-1', content: 'Try injecting <script>alert(1)</script>', cost: 10 },
          {
            id: 'hint-2',
            content: 'Use document.cookie to access session cookies',
            cost: 20,
          },
        ],
        points: 80,
        order: 2,
        difficulty: 'beginner',
        category: 'xss',
      },
      {
        id: 'dvwa-upload-1',
        title: 'File Upload Vulnerability',
        description: 'Upload a web shell to gain remote code execution',
        instructions: 'Bypass file upload restrictions to upload a PHP web shell',
        hints: [
          { id: 'hint-1', content: 'Try uploading a .php file disguised as an image', cost: 15 },
          { id: 'hint-2', content: 'Check if the server validates MIME types', cost: 25 },
        ],
        points: 120,
        order: 3,
        difficulty: 'intermediate',
        category: 'file-upload',
      },
      {
        id: 'dvwa-cmd-1',
        title: 'Command Injection',
        description: 'Execute OS commands through a vulnerable input field',
        instructions: 'Find the ping utility and inject OS commands',
        hints: [
          { id: 'hint-1', content: 'Try chaining commands with ; or &&', cost: 10 },
          { id: 'hint-2', content: 'Example: 127.0.0.1; ls -la', cost: 20 },
        ],
        points: 100,
        order: 4,
        difficulty: 'beginner',
        category: 'command-injection',
      },
      {
        id: 'dvwa-csrf-1',
        title: 'CSRF Token Bypass',
        description: 'Forge a request to change admin password without token',
        instructions: 'Exploit CSRF vulnerability to perform unauthorized actions',
        hints: [
          { id: 'hint-1', content: 'Analyze the password change form', cost: 15 },
          { id: 'hint-2', content: 'Create a hidden form that auto-submits', cost: 25 },
        ],
        points: 90,
        order: 5,
        difficulty: 'intermediate',
        category: 'csrf',
      },
    ],
    prerequisites: [],
    learningObjectives: [
      'Understand OWASP Top 10 vulnerabilities',
      'Practice SQL injection techniques',
      'Learn XSS attack vectors',
      'Master file upload bypass methods',
      'Understand command injection',
      'Exploit CSRF vulnerabilities',
    ],
    isActive: true,
    timeoutDuration: 7200000, // 2 hours
    maxInstancesPerUser: 3,
  },

  // ============================================================================
  // 2. OWASP Juice Shop
  // ============================================================================
  {
    id: uuidv4(),
    name: 'OWASP Juice Shop',
    description:
      'Modern web application security training in JavaScript/Node.js environment. Features 100+ CTF-style challenges covering injection attacks, broken authentication, sensitive data exposure, XXE, broken access control, and more. Includes Angular frontend with built-in scoreboard.',
    category: 'web_security',
    difficulty: 'intermediate',
    estimatedTime: 300, // 5 hours
    points: 800,
    tags: [
      'owasp-top-10',
      'nodejs',
      'angular',
      'api-security',
      'jwt',
      'nosql-injection',
      'xxe',
      'oauth',
      'ctf',
    ],
    imageUrl: '/assets/lab-images/juice-shop.png',
    containerConfig: {
      image: 'bkimminich/juice-shop:latest',
      ports: [{ container: 3000, host: 3000 }],
      environment: {
        NODE_ENV: 'production',
      },
      volumes: ['juice-shop-data:/juice-shop/data'],
      networks: ['auron-network'],
      memoryLimit: '1024m',
      cpuLimit: '2.0',
    },
    exercises: [
      {
        id: 'juice-sqli-1',
        title: 'SQL Injection in REST API',
        description: 'Exploit SQL injection in the login API endpoint',
        instructions: 'Find and exploit SQL injection vulnerability in the authentication API',
        hints: [
          { id: 'hint-1', content: "Try SQL injection in the email field with '", cost: 10 },
          { id: 'hint-2', content: "Use: admin'-- to comment out the password check", cost: 20 },
        ],
        points: 100,
        order: 1,
        difficulty: 'intermediate',
        category: 'sql-injection',
      },
      {
        id: 'juice-jwt-1',
        title: 'JWT Token Manipulation',
        description: 'Manipulate JWT tokens to escalate privileges',
        instructions: 'Decode and modify JWT token to gain admin access',
        hints: [
          { id: 'hint-1', content: 'Inspect the JWT token structure using jwt.io', cost: 15 },
          { id: 'hint-2', content: 'Try changing the role field to admin', cost: 25 },
          { id: 'hint-3', content: 'Check if the token signature is validated', cost: 35 },
        ],
        points: 150,
        order: 2,
        difficulty: 'advanced',
        category: 'broken-authentication',
      },
      {
        id: 'juice-xxe-1',
        title: 'XML External Entity (XXE) Attack',
        description: 'Exploit XXE vulnerability in file upload functionality',
        instructions: 'Upload a malicious XML file to read server files',
        hints: [
          { id: 'hint-1', content: 'Find file upload that accepts XML', cost: 20 },
          { id: 'hint-2', content: 'Use XXE payload to read /etc/passwd', cost: 30 },
        ],
        points: 180,
        order: 3,
        difficulty: 'advanced',
        category: 'xxe',
      },
      {
        id: 'juice-idor-1',
        title: 'Insecure Direct Object Reference',
        description: 'Access other users data by manipulating API requests',
        instructions: 'Exploit IDOR to view other users baskets and orders',
        hints: [
          { id: 'hint-1', content: 'Check the basket API endpoint for user IDs', cost: 10 },
          { id: 'hint-2', content: 'Try changing the user ID parameter', cost: 20 },
        ],
        points: 120,
        order: 4,
        difficulty: 'intermediate',
        category: 'broken-access-control',
      },
      {
        id: 'juice-nosql-1',
        title: 'NoSQL Injection',
        description: 'Exploit NoSQL injection in search functionality',
        instructions: 'Bypass authentication or extract data using NoSQL injection',
        hints: [
          { id: 'hint-1', content: 'Try MongoDB operators like $ne, $gt', cost: 15 },
          { id: 'hint-2', content: 'Example: {"$ne": null}', cost: 25 },
        ],
        points: 140,
        order: 5,
        difficulty: 'advanced',
        category: 'injection',
      },
    ],
    prerequisites: ['dvwa'],
    learningObjectives: [
      'Master modern web application vulnerabilities',
      'Understand API security weaknesses',
      'Learn JWT attack techniques',
      'Practice XXE exploitation',
      'Exploit IDOR vulnerabilities',
      'Understand NoSQL injection',
      'Analyze Angular security issues',
    ],
    isActive: true,
    timeoutDuration: 10800000, // 3 hours
    maxInstancesPerUser: 2,
  },

  // ============================================================================
  // 3. Metasploitable 2
  // ============================================================================
  {
    id: uuidv4(),
    name: 'Metasploitable 2 - Network Penetration Testing',
    description:
      'Comprehensive network penetration testing environment with multiple vulnerable services. Practice exploitation of FTP, SSH, Samba, web services (Mutillidae, DVWA), and more. Ideal for learning service exploitation, privilege escalation, and post-exploitation techniques.',
    category: 'network_security',
    difficulty: 'advanced',
    estimatedTime: 480, // 8 hours
    points: 1200,
    tags: [
      'penetration-testing',
      'metasploit',
      'exploitation',
      'privilege-escalation',
      'network-services',
      'samba',
      'ssh',
      'ftp',
      'web-exploitation',
    ],
    imageUrl: '/assets/lab-images/metasploitable.png',
    containerConfig: {
      image: 'tleemcjr/metasploitable2:latest',
      ports: [
        { container: 80, host: 8081 }, // HTTP
        { container: 22, host: 2222 }, // SSH
        { container: 21, host: 2121 }, // FTP
        { container: 3306, host: 33060 }, // MySQL
        { container: 445, host: 4445 }, // Samba
        { container: 23, host: 2323 }, // Telnet
        { container: 5900, host: 5900 }, // VNC
      ],
      environment: {},
      volumes: ['metasploitable-data:/root'],
      networks: ['auron-network'],
      memoryLimit: '2048m',
      cpuLimit: '2.0',
      privileged: true,
    },
    exercises: [
      {
        id: 'meta-scan-1',
        title: 'Network Reconnaissance',
        description: 'Perform network scanning to identify vulnerable services',
        instructions: 'Use nmap to discover open ports and running services',
        hints: [
          { id: 'hint-1', content: 'Use nmap -sV for service version detection', cost: 10 },
          { id: 'hint-2', content: 'Try nmap -A for aggressive scan', cost: 20 },
        ],
        points: 80,
        order: 1,
        difficulty: 'beginner',
        category: 'reconnaissance',
      },
      {
        id: 'meta-ftp-1',
        title: 'ProFTPD Backdoor Exploitation',
        description: 'Exploit the backdoored ProFTPD 1.3.1 service',
        instructions: 'Use Metasploit to exploit ProFTPD backdoor',
        hints: [
          { id: 'hint-1', content: 'Search for proftpd in Metasploit', cost: 15 },
          { id: 'hint-2', content: 'Module: exploit/unix/ftp/proftpd_133c_backdoor', cost: 30 },
        ],
        points: 150,
        order: 2,
        difficulty: 'intermediate',
        category: 'exploitation',
      },
      {
        id: 'meta-samba-1',
        title: 'Samba trans2open Overflow',
        description: 'Exploit Samba service to gain root shell',
        instructions: 'Use the trans2open vulnerability to get remote code execution',
        hints: [
          { id: 'hint-1', content: 'Search for samba trans2open in Metasploit', cost: 20 },
          { id: 'hint-2', content: 'Module: exploit/linux/samba/trans2open', cost: 35 },
        ],
        points: 200,
        order: 3,
        difficulty: 'advanced',
        category: 'exploitation',
      },
      {
        id: 'meta-privesc-1',
        title: 'Privilege Escalation',
        description: 'Escalate privileges from standard user to root',
        instructions: 'Find and exploit SUID binaries or kernel vulnerabilities',
        hints: [
          { id: 'hint-1', content: 'Search for SUID files: find / -perm -4000', cost: 15 },
          { id: 'hint-2', content: 'Check kernel version: uname -a', cost: 25 },
          { id: 'hint-3', content: 'Look for local exploit suggester in Metasploit', cost: 40 },
        ],
        points: 250,
        order: 4,
        difficulty: 'expert',
        category: 'privilege-escalation',
      },
      {
        id: 'meta-web-1',
        title: 'Mutillidae Exploitation',
        description: 'Exploit vulnerabilities in Mutillidae web application',
        instructions: 'Access Mutillidae and exploit OWASP Top 10 vulnerabilities',
        hints: [
          { id: 'hint-1', content: 'Navigate to /mutillidae on port 80', cost: 10 },
          { id: 'hint-2', content: 'Try SQL injection in login forms', cost: 20 },
        ],
        points: 180,
        order: 5,
        difficulty: 'intermediate',
        category: 'web-exploitation',
      },
    ],
    prerequisites: ['juice-shop'],
    learningObjectives: [
      'Master network reconnaissance techniques',
      'Exploit vulnerable network services',
      'Use Metasploit Framework effectively',
      'Understand privilege escalation methods',
      'Practice post-exploitation techniques',
      'Learn service-specific exploits',
    ],
    isActive: true,
    timeoutDuration: 14400000, // 4 hours
    maxInstancesPerUser: 1,
  },

  // ============================================================================
  // 4. Wazuh Security Platform (SIEM & Blue Team)
  // ============================================================================
  {
    id: uuidv4(),
    name: 'Wazuh - SIEM & Security Monitoring Platform',
    description:
      'Blue team training platform for security monitoring, threat detection, and incident response. Learn SIEM operations, log analysis, correlation rules, intrusion detection, vulnerability scanning, and compliance monitoring. Based on Elastic Stack with Wazuh extensions.',
    category: 'defensive',
    difficulty: 'intermediate',
    estimatedTime: 300, // 5 hours
    points: 700,
    tags: [
      'siem',
      'blue-team',
      'threat-detection',
      'incident-response',
      'log-analysis',
      'ids',
      'compliance',
      'elk-stack',
      'wazuh',
    ],
    imageUrl: '/assets/lab-images/wazuh.png',
    containerConfig: {
      image: 'wazuh/wazuh:latest',
      ports: [
        { container: 1514, host: 1514 }, // Wazuh agent connection
        { container: 1515, host: 1515 }, // Wazuh agent enrollment
        { container: 55000, host: 55000 }, // Wazuh API
        { container: 5601, host: 5601 }, // Kibana dashboard
      ],
      environment: {
        WAZUH_MANAGER_HOST: 'wazuh-manager',
        ELASTIC_PASSWORD: 'changeme',
      },
      volumes: [
        'wazuh-data:/var/ossec/data',
        'wazuh-logs:/var/ossec/logs',
        'wazuh-etc:/var/ossec/etc',
      ],
      networks: ['auron-network'],
      memoryLimit: '4096m',
      cpuLimit: '2.0',
    },
    exercises: [
      {
        id: 'wazuh-setup-1',
        title: 'Wazuh Dashboard Configuration',
        description: 'Configure Wazuh dashboard and explore security events',
        instructions: 'Access Wazuh dashboard and configure basic monitoring',
        hints: [
          { id: 'hint-1', content: 'Default credentials: admin/admin', cost: 5 },
          { id: 'hint-2', content: 'Navigate to Security Events dashboard', cost: 10 },
        ],
        points: 50,
        order: 1,
        difficulty: 'beginner',
        category: 'configuration',
      },
      {
        id: 'wazuh-rules-1',
        title: 'Create Custom Detection Rules',
        description: 'Write custom rules to detect specific attack patterns',
        instructions: 'Create a rule to detect brute force SSH attempts',
        hints: [
          { id: 'hint-1', content: 'Check /var/ossec/ruleset/rules/', cost: 15 },
          { id: 'hint-2', content: 'Use rule ID 5700-5799 for SSH events', cost: 25 },
        ],
        points: 150,
        order: 2,
        difficulty: 'intermediate',
        category: 'rule-creation',
      },
      {
        id: 'wazuh-logs-1',
        title: 'Log Analysis & Correlation',
        description: 'Analyze logs to identify attack patterns and correlate events',
        instructions: 'Use Wazuh to correlate multiple security events',
        hints: [
          { id: 'hint-1', content: 'Look for multiple failed login attempts', cost: 10 },
          { id: 'hint-2', content: 'Use the Event correlation feature', cost: 20 },
        ],
        points: 120,
        order: 3,
        difficulty: 'intermediate',
        category: 'log-analysis',
      },
      {
        id: 'wazuh-fim-1',
        title: 'File Integrity Monitoring',
        description: 'Configure FIM to detect unauthorized file changes',
        instructions: 'Set up file integrity monitoring for critical system files',
        hints: [
          { id: 'hint-1', content: 'Edit ossec.conf for FIM configuration', cost: 15 },
          { id: 'hint-2', content: 'Monitor /etc/passwd and /etc/shadow', cost: 25 },
        ],
        points: 130,
        order: 4,
        difficulty: 'intermediate',
        category: 'file-integrity',
      },
      {
        id: 'wazuh-incident-1',
        title: 'Incident Response Workflow',
        description: 'Respond to a simulated security incident using Wazuh',
        instructions: 'Investigate alerts, identify root cause, and document response',
        hints: [
          { id: 'hint-1', content: 'Start with high-severity alerts', cost: 10 },
          { id: 'hint-2', content: 'Use threat hunting features', cost: 20 },
          { id: 'hint-3', content: 'Check related events timeline', cost: 30 },
        ],
        points: 200,
        order: 5,
        difficulty: 'advanced',
        category: 'incident-response',
      },
    ],
    prerequisites: [],
    learningObjectives: [
      'Understand SIEM architecture and operations',
      'Master log collection and analysis',
      'Create custom detection rules',
      'Configure file integrity monitoring',
      'Perform threat hunting',
      'Implement incident response workflows',
      'Understand compliance monitoring (PCI DSS, HIPAA)',
    ],
    isActive: true,
    timeoutDuration: 10800000, // 3 hours
    maxInstancesPerUser: 2,
  },
];
