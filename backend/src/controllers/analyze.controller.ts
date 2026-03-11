import { Request, Response } from 'express';
import { AIOrchestrator } from '../services/ai_orchestrator.service';
import { DatabaseService } from '../services/database.service';
import { HealthMemoryService } from '../services/health_memory.service';

export class AnalyzeController {
  /**
   * Main entry point for analyzing a laboratory report.
   * This orchestrates vision OCR, clinical analysis, and conversational rendering.
   */
  static async analyzeReport(req: Request, res: Response) {
    const { fileUrl, userId, sessionId } = req.body;

    if (!fileUrl || !userId) {
      return res.status(400).json({ error: 'Missing fileUrl or userId' });
    }

    try {
      console.log(`[Analysis Initiated] User: ${userId}, Resource: ${fileUrl}, Session: ${sessionId || 'New'}`);

      // 1. Ensure Session exists
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const newSession = await DatabaseService.createChatSession(userId, `Report Analysis: ${new Date().toLocaleDateString()}`);
        activeSessionId = newSession.id;
      }

      // 2. Fetch Image from URL (Assuming fileUrl is a signed storage URL)
      const imageResponse = await fetch(fileUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // 3. Retrieve Historical Snapshot (Memory Retrieval)
      const healthSnapshot = await HealthMemoryService.getHealthSnapshot(userId);
      const userProfile = await DatabaseService.getUserProfile(userId);

      // 4. Execute Multi-Layered AI Pipeline (Gemini 2.5 Flash + Groq Orchestration)
      const analysis = await AIOrchestrator.executeAnalysisPipeline(
        imageBuffer, 
        healthSnapshot,
        userProfile || undefined
      );

      // 5. Persistence (Saving to Supabase for future Memory)
      const savedReport = await DatabaseService.saveAnalyzedReport(
        { 
          user_id: userId, 
          file_url: fileUrl, 
          overall_summary: analysis.final_response,
          report_date: new Date().toISOString()
        },
        analysis.raw_data.map((item: any) => ({
          user_id: userId,
          name: item.biomarker,
          value: parseFloat(item.value) || 0,
          unit: item.unit,
          reference_range: item.range,
          is_abnormal: !!item.flag,
          clinical_insight: analysis.clinical_insights.findings?.find((f: any) => f.biomarker === item.biomarker)?.insight || '',
          recorded_at: new Date().toISOString()
        }))
      );

      // 6. Save messages to session history
      const isDocument = !!analysis.raw_data && analysis.raw_data.length > 0;
      await DatabaseService.saveChatMessage(activeSessionId, 'user', `Analyzed ${isDocument ? 'report' : 'visual symptom'}: ${fileUrl}`, { reportId: savedReport?.id });
      
      await DatabaseService.saveChatMessage(
        activeSessionId, 
        'assistant', 
        analysis.final_response, 
        { 
          type: isDocument ? 'analysis' : 'visual_analysis', 
          findings: analysis.clinical_insights 
        }
      );

      // 7. Sophisticated Response Delivery
      return res.status(200).json({
        reportId: savedReport.id,
        sessionId: activeSessionId,
        summary: analysis.final_response,
        findings: analysis.raw_data,
        clinicalInsights: analysis.clinical_insights,
        metadata: {
          analyzedAt: new Date().toISOString(),
          memoryUsed: healthSnapshot !== "This is the first report for this user. Establish a baseline."
        }
      });

    } catch (error) {
      console.error('[AnalyzeController Error]', error);
      return res.status(500).json({ 
        error: 'Critical failure during analysis pipeline',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Conversational endpoint for interacting with MEDIQ Core.
   */
  static async chat(req: Request, res: Response) {
    const { message, userId, sessionId, history } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Missing message or userId' });
    }

    try {
      console.log(`[Chat Initiated] User: ${userId}, Session: ${sessionId || 'New'}`);

      // 1. Ensure Session exists
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const newSession = await DatabaseService.createChatSession(userId, message.substring(0, 30) + '...');
        activeSessionId = newSession.id;
      }

      // 2. Save User Message
      await DatabaseService.saveChatMessage(activeSessionId, 'user', message);

      // 3. Retrieve Context (Health Memory + Profile)
      const healthSnapshot = await HealthMemoryService.getHealthSnapshot(userId);
      const userProfile = await DatabaseService.getUserProfile(userId);

      // 4. Execute Conversational AI
      const response = await AIOrchestrator.performDirectChat(
        message,
        history || [],
        healthSnapshot,
        userProfile || undefined
      );

      // 5. Save AI Response
      await DatabaseService.saveChatMessage(activeSessionId, 'assistant', response);

      return res.status(200).json({
        response,
        sessionId: activeSessionId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[ChatController Error]', error);
      return res.status(500).json({ 
        error: 'Critical failure during chat interaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Session Management Endpoints
   */
  static async getSessions(req: Request, res: Response) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
      const sessions = await DatabaseService.getUserSessions(userId as string);
      return res.status(200).json(sessions);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }

  static async getHistory(req: Request, res: Response) {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    try {
      const messages = await DatabaseService.getSessionMessages(sessionId as string);
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  }
}
