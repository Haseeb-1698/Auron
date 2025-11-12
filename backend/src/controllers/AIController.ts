import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import LiquidMetalService from '@services/LiquidMetalService';
import { logger } from '@utils/logger';

/**
 * AI Controller
 * Handles AI-powered features via LiquidMetal AI (Claude)
 */

export class AIController {
  /**
   * Generate AI-powered hint
   * POST /api/ai/hint
   */
  async generateHint(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const {
        labId,
        exerciseId,
        currentProgress,
        previousHints,
        userCode,
        difficulty,
      } = req.body;

      const hint = await LiquidMetalService.generateHint({
        userId,
        labId,
        exerciseId,
        currentProgress,
        previousHints,
        userCode,
        difficulty,
      });

      res.status(200).json({
        success: true,
        data: hint,
      });
    } catch (error: any) {
      logger.error('Generate hint error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate hint',
      });
    }
  }

  /**
   * Explain vulnerability
   * POST /api/ai/explain
   */
  async explainVulnerability(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vulnerabilityType, context, detailedExplanation } = req.body;

      const explanation = await LiquidMetalService.explainVulnerability(
        vulnerabilityType,
        context,
        detailedExplanation
      );

      res.status(200).json({
        success: true,
        data: explanation,
      });
    } catch (error: any) {
      logger.error('Explain vulnerability error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to explain vulnerability',
      });
    }
  }

  /**
   * Analyze code for security issues
   * POST /api/ai/analyze-code
   */
  async analyzeCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code, language, context } = req.body;

      const analysis = await LiquidMetalService.analyzeCode(code, language, context);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      logger.error('Analyze code error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze code',
      });
    }
  }

  /**
   * Generate personalized learning path
   * GET /api/ai/learning-path
   */
  async generateLearningPath(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const progressData = req.body.progressData || null;

      const learningPath = await LiquidMetalService.generateLearningPath(
        userId,
        progressData
      );

      res.status(200).json({
        success: true,
        data: learningPath,
      });
    } catch (error: any) {
      logger.error('Generate learning path error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate learning path',
      });
    }
  }

  /**
   * Get AI conversation history
   * GET /api/ai/history
   */
  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { labId, limit } = req.query;

      // This would query SmartMemory for conversation history
      // For now, return empty array
      const history: any[] = [];

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      logger.error('Get AI history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get AI history',
      });
    }
  }

  /**
   * Validate solution
   * POST /api/ai/validate-solution
   */
  async validateSolution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { labId, exerciseId, solution, expectedOutcome } = req.body;

      // Use AI to validate if the solution is correct
      const validation = {
        isCorrect: false,
        feedback: '',
        suggestions: [] as string[],
        score: 0,
      };

      // Analyze the solution
      const prompt = `
        Validate this cybersecurity lab solution:

        Lab ID: ${labId}
        Exercise ID: ${exerciseId}
        Solution: ${solution}
        Expected Outcome: ${expectedOutcome}

        Determine if the solution is correct and provide constructive feedback.
      `;

      try {
        const response = await LiquidMetalService['client'].post('/chat/completions', {
          model: LiquidMetalService['MODEL'],
          messages: [
            { role: 'system', content: 'You are a cybersecurity education validator.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.3,
        });

        const content = response.data.choices[0].message.content;

        // Parse response (simplified)
        validation.isCorrect = content.toLowerCase().includes('correct') ||
                               content.toLowerCase().includes('valid');
        validation.feedback = content;
        validation.score = validation.isCorrect ? 100 : 50;
        validation.suggestions = validation.isCorrect ? [] : ['Review the vulnerability documentation', 'Try a different approach'];
      } catch (error) {
        logger.error('AI validation error:', error);
      }

      res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error: any) {
      logger.error('Validate solution error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to validate solution',
      });
    }
  }
}

export default new AIController();
