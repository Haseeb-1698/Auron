import axios, { AxiosInstance } from 'axios';
import { logger } from '@utils/logger';

/**
 * LiquidMetal AI Service
 * Integrates with LiquidMetal AI for Claude-powered features:
 * - Vulnerability explanations
 * - Adaptive hints
 * - SmartMemory for progress tracking
 * - Learning path recommendations
 */

export interface AIHintRequest {
  userId: string;
  labId: string;
  exerciseId: string;
  context: string;
  previousHints?: string[];
  userProgress?: number;
}

export interface AIHintResponse {
  hint: string;
  confidence: number;
  cost: number;
  nextSteps?: string[];
}

export interface VulnerabilityExplanation {
  vulnerability: string;
  description: string;
  technicalDetails: string;
  impact: string;
  realWorldExamples: string[];
  remediation: string[];
  references: string[];
  difficulty: string;
}

export interface LearningPath {
  userId: string;
  recommendedLabs: string[];
  weakAreas: string[];
  strengths: string[];
  nextObjectives: string[];
}

export interface SmartMemoryEntry {
  userId: string;
  labId?: string;
  exerciseId?: string;
  event: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export class LiquidMetalService {
  private client: AxiosInstance;
  private readonly API_BASE: string;
  private readonly API_KEY: string;
  private readonly MODEL = 'claude-3-sonnet-20240229';

  constructor() {
    this.API_BASE = process.env.LIQUIDMETAL_ENDPOINT || 'https://api.liquidmetal.ai/v1';
    this.API_KEY = process.env.LIQUIDMETAL_API_KEY || '';

    if (!this.API_KEY) {
      logger.warn('LIQUIDMETAL_API_KEY not set. AI features will not function.');
    }

    this.client = axios.create({
      baseURL: this.API_BASE,
      headers: {
        Authorization: `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Generate adaptive hint for lab exercise
   */
  async generateHint(request: AIHintRequest): Promise<AIHintResponse> {
    try {
      const prompt = this.buildHintPrompt(request);

      const response = await this.client.post('/chat/completions', {
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a cybersecurity education assistant. Provide progressive hints that guide learners without giving away the answer directly. Adjust difficulty based on user's progress.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const hintText = response.data.choices[0].message.content;

      // Store in SmartMemory
      await this.storeInSmartMemory({
        userId: request.userId,
        labId: request.labId,
        exerciseId: request.exerciseId,
        event: 'hint_requested',
        metadata: {
          hintLevel: request.previousHints?.length || 0,
          context: request.context,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        hint: hintText,
        confidence: 0.85,
        cost: 10,
        nextSteps: this.extractNextSteps(hintText),
      };
    } catch (error) {
      logger.error('Failed to generate AI hint:', error);
      throw new Error('Failed to generate hint. Please try again.');
    }
  }

  /**
   * Explain a vulnerability in detail
   */
  async explainVulnerability(vulnerabilityType: string): Promise<VulnerabilityExplanation> {
    try {
      const prompt = `Explain the ${vulnerabilityType} vulnerability in detail. Include:
1. Technical description
2. How it works
3. Real-world impact
4. Examples of exploitation
5. Remediation steps
6. References (OWASP, CWE, CVE if applicable)

Format the response in a structured, educational manner suitable for cybersecurity students.`;

      const response = await this.client.post('/chat/completions', {
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a cybersecurity expert educator. Provide comprehensive, accurate explanations of security vulnerabilities.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const explanation = response.data.choices[0].message.content;

      return this.parseVulnerabilityExplanation(vulnerabilityType, explanation);
    } catch (error) {
      logger.error('Failed to explain vulnerability:', error);
      throw new Error('Failed to generate explanation. Please try again.');
    }
  }

  /**
   * Analyze code for security issues
   */
  async analyzeCode(code: string, language: string): Promise<{
    vulnerabilities: Array<{
      type: string;
      severity: string;
      line?: number;
      description: string;
      fix: string;
    }>;
    summary: string;
  }> {
    try {
      const prompt = `Analyze the following ${language} code for security vulnerabilities:

\`\`\`${language}
${code}
\`\`\`

Identify:
1. Security vulnerabilities (SQL injection, XSS, CSRF, etc.)
2. Severity level (Critical, High, Medium, Low)
3. Line numbers (if applicable)
4. Detailed explanation
5. How to fix each issue

Respond in JSON format.`;

      const response = await this.client.post('/chat/completions', {
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a security code reviewer. Analyze code for vulnerabilities and provide actionable fixes.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      });

      const analysis = response.data.choices[0].message.content;
      return this.parseCodeAnalysis(analysis);
    } catch (error) {
      logger.error('Failed to analyze code:', error);
      throw new Error('Failed to analyze code. Please try again.');
    }
  }

  /**
   * Generate personalized learning path
   */
  async generateLearningPath(userId: string, progressData: any): Promise<LearningPath> {
    try {
      const prompt = `Based on the following user progress data, generate a personalized learning path:

${JSON.stringify(progressData, null, 2)}

Recommend:
1. Next labs to attempt
2. Weak areas to focus on
3. Strengths to build upon
4. Specific learning objectives

Respond in JSON format.`;

      const response = await this.client.post('/chat/completions', {
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an AI learning coach for cybersecurity education. Provide personalized, data-driven recommendations.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      });

      const pathData = response.data.choices[0].message.content;
      return this.parseLearningPath(userId, pathData);
    } catch (error) {
      logger.error('Failed to generate learning path:', error);
      throw new Error('Failed to generate learning path. Please try again.');
    }
  }

  /**
   * Store event in SmartMemory
   */
  async storeInSmartMemory(entry: SmartMemoryEntry): Promise<void> {
    try {
      await this.client.post('/smartmemory/store', entry);
      logger.debug('Stored in SmartMemory:', { userId: entry.userId, event: entry.event });
    } catch (error) {
      logger.warn('Failed to store in SmartMemory:', error);
      // Don't throw - memory storage is non-critical
    }
  }

  /**
   * Retrieve user's learning history from SmartMemory
   */
  async getSmartMemory(userId: string, limit = 100): Promise<SmartMemoryEntry[]> {
    try {
      const response = await this.client.get('/smartmemory/retrieve', {
        params: { userId, limit },
      });
      return response.data.entries || [];
    } catch (error) {
      logger.error('Failed to retrieve SmartMemory:', error);
      return [];
    }
  }

  /**
   * Build context-aware hint prompt
   */
  private buildHintPrompt(request: AIHintRequest): string {
    const hintLevel = request.previousHints?.length || 0;
    const progressPercentage = request.userProgress || 0;

    return `Lab Context: ${request.context}

User Progress: ${progressPercentage}%
Previous Hints Given: ${hintLevel}
Hint Level Requested: ${hintLevel + 1}

Provide a progressive hint that:
1. Guides the learner toward the solution
2. Matches their current skill level
3. Doesn't give away the answer directly
4. Encourages critical thinking
5. ${hintLevel >= 2 ? 'Is more explicit (they need more help)' : 'Is subtle (let them explore)'}`;
  }

  /**
   * Extract next steps from hint text
   */
  private extractNextSteps(hintText: string): string[] {
    // Simple extraction - look for numbered lists or bullet points
    const steps: string[] = [];
    const lines = hintText.split('\n');

    for (const line of lines) {
      if (/^[0-9]+\./.test(line.trim()) || /^[-*]/.test(line.trim())) {
        steps.push(line.trim().replace(/^[0-9]+\.\s*/, '').replace(/^[-*]\s*/, ''));
      }
    }

    return steps.slice(0, 3); // Return top 3 steps
  }

  /**
   * Parse vulnerability explanation from AI response
   */
  private parseVulnerabilityExplanation(
    type: string,
    explanation: string
  ): VulnerabilityExplanation {
    // Parse structured explanation
    // This is simplified - you'd want more robust parsing
    return {
      vulnerability: type,
      description: explanation.substring(0, 500),
      technicalDetails: explanation,
      impact: 'High',
      realWorldExamples: [],
      remediation: [],
      references: [],
      difficulty: 'Intermediate',
    };
  }

  /**
   * Parse code analysis from AI response
   */
  private parseCodeAnalysis(analysis: string): any {
    try {
      // Try to parse as JSON
      return JSON.parse(analysis);
    } catch {
      // Fallback if not valid JSON
      return {
        vulnerabilities: [],
        summary: analysis,
      };
    }
  }

  /**
   * Parse learning path from AI response
   */
  private parseLearningPath(userId: string, pathData: string): LearningPath {
    try {
      const parsed = JSON.parse(pathData);
      return {
        userId,
        recommendedLabs: parsed.recommendedLabs || [],
        weakAreas: parsed.weakAreas || [],
        strengths: parsed.strengths || [],
        nextObjectives: parsed.nextObjectives || [],
      };
    } catch {
      return {
        userId,
        recommendedLabs: [],
        weakAreas: [],
        strengths: [],
        nextObjectives: [],
      };
    }
  }

  /**
   * Health check for LiquidMetal API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('LiquidMetal health check failed:', error);
      return false;
    }
  }
}

export default new LiquidMetalService();
