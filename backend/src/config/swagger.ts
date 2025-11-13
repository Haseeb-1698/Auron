import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auron Cybersecurity Training Platform API',
      version,
      description: `
        Complete API documentation for the Auron Cybersecurity Training Platform.

        ## Features
        - **Authentication & Authorization**: JWT-based auth with 2FA support
        - **Lab Management**: Docker-based vulnerable application environments
        - **Vulnerability Scanning**: Automated security testing and reporting
        - **Progress Tracking**: User progress, achievements, and gamification
        - **Real-time Collaboration**: WebSocket-based live sessions
        - **AI Integration**: Claude AI for hints and learning assistance
        - **Reporting**: Generate and download security reports

        ## Authentication
        Most endpoints require authentication via Bearer token:
        \`\`\`
        Authorization: Bearer <your-access-token>
        \`\`\`

        Obtain your access token by calling the \`/api/auth/login\` endpoint.
      `,
      contact: {
        name: 'Auron API Support',
        email: 'support@auron.dev',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.auron.dev',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.auron.dev',
        description: 'Staging server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Labs',
        description: 'Lab management and instance control',
      },
      {
        name: 'Scans',
        description: 'Vulnerability scanning operations',
      },
      {
        name: 'Reports',
        description: 'Security report generation and management',
      },
      {
        name: 'Progress',
        description: 'User progress tracking and statistics',
      },
      {
        name: 'Collaboration',
        description: 'Real-time collaboration sessions',
      },
      {
        name: 'Gamification',
        description: 'Badges, achievements, and leaderboards',
      },
      {
        name: 'AI',
        description: 'AI-powered learning assistance',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (admin only)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            username: {
              type: 'string',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['student', 'instructor', 'admin'],
            },
            avatar: {
              type: 'string',
              format: 'uri',
            },
            twoFactorEnabled: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Lab: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            category: {
              type: 'string',
              enum: [
                'web_security',
                'network_security',
                'cryptography',
                'exploitation',
                'defensive',
                'forensics',
              ],
            },
            difficulty: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            },
            estimatedTime: {
              type: 'integer',
              description: 'Estimated time in minutes',
            },
            points: {
              type: 'integer',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            prerequisites: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            learningObjectives: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            exercises: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Exercise',
              },
            },
            isActive: {
              type: 'boolean',
            },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            instructions: {
              type: 'string',
            },
            hints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                  },
                  content: {
                    type: 'string',
                  },
                  cost: {
                    type: 'integer',
                  },
                },
              },
            },
            points: {
              type: 'integer',
            },
            order: {
              type: 'integer',
            },
          },
        },
        LabInstance: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            labId: {
              type: 'string',
              format: 'uuid',
            },
            containerId: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['starting', 'running', 'stopping', 'stopped', 'error'],
            },
            accessUrl: {
              type: 'string',
              format: 'uri',
            },
            ports: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  container: {
                    type: 'integer',
                  },
                  host: {
                    type: 'integer',
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Scan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            labId: {
              type: 'string',
              format: 'uuid',
            },
            targetUrl: {
              type: 'string',
              format: 'uri',
            },
            scanType: {
              type: 'string',
              enum: ['basic', 'full', 'custom'],
            },
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
            },
            progress: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
            },
            vulnerabilities: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Vulnerability',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Vulnerability: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            scanId: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low', 'info'],
            },
            cvss: {
              type: 'number',
              minimum: 0,
              maximum: 10,
            },
            cwe: {
              type: 'string',
            },
            cve: {
              type: 'string',
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            evidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['screenshot', 'code', 'log', 'network'],
                  },
                  content: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        Report: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            labId: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            reportType: {
              type: 'string',
              enum: ['lab_completion', 'vulnerability_scan', 'progress_summary', 'custom'],
            },
            format: {
              type: 'string',
              enum: ['pdf', 'json', 'csv', 'html'],
            },
            status: {
              type: 'string',
              enum: ['pending', 'generating', 'completed', 'failed'],
            },
            fileName: {
              type: 'string',
            },
            filePath: {
              type: 'string',
            },
            fileSize: {
              type: 'integer',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UserProgress: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            labId: {
              type: 'string',
              format: 'uuid',
            },
            exerciseId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed', 'failed'],
            },
            score: {
              type: 'integer',
            },
            timeSpent: {
              type: 'integer',
              description: 'Time spent in seconds',
            },
            hintsUsed: {
              type: 'integer',
            },
            attempts: {
              type: 'integer',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Badge: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            icon: {
              type: 'string',
            },
            criteria: {
              type: 'object',
            },
            points: {
              type: 'integer',
            },
            rarity: {
              type: 'string',
              enum: ['common', 'rare', 'epic', 'legendary'],
            },
          },
        },
        CollaborationSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            hostId: {
              type: 'string',
              format: 'uuid',
            },
            labId: {
              type: 'string',
              format: 'uuid',
            },
            participants: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
            },
            maxParticipants: {
              type: 'integer',
            },
            status: {
              type: 'string',
              enum: ['active', 'paused', 'ended'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Missing or invalid authentication token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        BadRequest: {
          description: 'Bad Request - Invalid input',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
    './src/docs/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
