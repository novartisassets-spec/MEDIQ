import { Request, Response } from 'express';
import { AIOrchestrator } from '../services/ai_orchestrator.service';
import { DatabaseService } from '../services/database.service';
import { HealthMemoryService } from '../services/health_memory.service';
import { WhatsAppConnection } from '../whatsapp/connection';
import { supabaseAdmin } from '../config/supabase';

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
      await DatabaseService.saveChatMessage(
        activeSessionId, 
        'user', 
        `Analyzed ${isDocument ? 'report' : 'visual symptom'}: ${fileUrl}`, 
        'dashboard',
        { reportId: savedReport?.id }
      );
      
      await DatabaseService.saveChatMessage(
        activeSessionId, 
        'assistant', 
        analysis.final_response, 
        'dashboard',
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

      // 3. Retrieve Context (Health Memory + Profile + Cross-Platform Memory)
      const healthSnapshot = await HealthMemoryService.getHealthSnapshot(userId);
      const userProfile = await DatabaseService.getUserProfile(userId);
      const sessionSummary = await DatabaseService.getSessionSummary(activeSessionId);
      const whatsappSummary = await DatabaseService.getPlatformSummary(userId, 'whatsapp');

      // 4. Manage Conversation History & Summarization
      let processedHistory = await DatabaseService.getSessionMessages(activeSessionId);

      // --- MILLION DOLLAR SURGICAL FIX: Platform Switch Detection ---
      const lastPlatform = await DatabaseService.getLastMessagePlatform(userId);
      console.log(`[OmniChannel Debug] Current Platform Request: dashboard | Last Registered Platform: ${lastPlatform}`);
      
      if (lastPlatform === 'whatsapp') {
        console.log(`[OmniChannel] Platform Switch Detected: WhatsApp -> Dashboard. Fetching bridge history...`);
        const bridgeHistory = await DatabaseService.getLastMessagesByPlatform(userId, 'whatsapp', 3);
        
        // Deduplicate
        const existingContents = new Set(processedHistory.map((m: any) => m.content));
        const uniqueBridge = bridgeHistory.filter((m: any) => !existingContents.has(m.content));
        
        if (uniqueBridge.length > 0) {
          processedHistory = [...uniqueBridge, ...processedHistory];
          console.log(`[OmniChannel Debug] Bridge injected. History size: ${processedHistory.length}`);
        }
      }

      // 2. Save User Message (Moved AFTER check to ensure absolute last platform is correct)
      await DatabaseService.saveChatMessage(activeSessionId, 'user', message, 'dashboard');

      // If history is too long (Triggering at 25 messages for generous window)
      if (processedHistory.length > 25) {
        console.log(`[Chat] Compressing session ${activeSessionId} to prevent token panic...`);
        const newSummary = await AIOrchestrator.generateSessionSummary(processedHistory);
        await DatabaseService.updateSessionSummary(activeSessionId, newSummary);
        
        // We inject the summary to the last few messages for AI context
        processedHistory[0].sessionSummary = newSummary; 
      } else if (sessionSummary) {
        if (processedHistory.length > 0) processedHistory[0].sessionSummary = sessionSummary;
      }

      // 5. Execute Conversational AI with Omnichannel Context
      const response = await AIOrchestrator.performDirectChat(
        message,
        processedHistory,
        healthSnapshot,
        userProfile || undefined,
        whatsappSummary
      );

      // 6. Save AI Response
      await DatabaseService.saveChatMessage(activeSessionId, 'assistant', response, 'dashboard');

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

  static async resolveProfile(req: Request, res: Response) {
    const { number } = req.params;
    if (!number) return res.status(400).json({ error: 'Missing number' });

    try {
      const profile = await DatabaseService.getProfileByNumber(number as string);
      return res.status(200).json(profile);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to resolve profile' });
    }
  }

  /**
   * Endpoint to proactively send a welcome message to a newly registered user via WhatsApp.
   */
  static async sendWelcomeMessage(req: Request, res: Response) {
    const { userId, whatsappJid } = req.body;

    if (!userId || !whatsappJid) {
      return res.status(400).json({ error: 'Missing userId or whatsappJid' });
    }

    try {
      // Ensure WhatsAppConnection is initialized if not already
      // This is a simplified call assuming WhatsAppConnection.sock is available.
      // In a real scenario, you might have a more robust way to get the active sock.
      if (!WhatsAppConnection['sock']) {
        // Attempt to connect if not connected (might need adjustments depending on connection lifecycle)
        console.warn('[AnalyzeController] WhatsAppConnection not initialized. Attempting to connect...');
        await WhatsAppConnection.connect();
      }

      await WhatsAppConnection.sendWelcomeMessageToUser(userId, whatsappJid);
      return res.status(200).json({ message: 'Welcome message sent successfully' });
    } catch (error) {
      console.error('[AnalyzeController] Error sending welcome message:', error);
      return res.status(500).json({ 
        error: 'Failed to send welcome message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getLatestBiomarkers(req: Request, res: Response) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
      const biomarkers = await DatabaseService.getLatestBiomarkers(userId as string);
      return res.status(200).json(biomarkers);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch biomarkers' });
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

  static async nukeUser(req: Request, res: Response) {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
      // Cascade delete starting from messages and sessions
      // Since we added CASCADE in the schema, deleting sessions and the profile should handle it.
      const { error: sessionError } = await supabaseAdmin
        .from('chat_sessions')
        .delete()
        .eq('user_id', userId);
      
      const { error: biomarkersError } = await supabaseAdmin
        .from('biomarkers')
        .delete()
        .eq('user_id', userId);

      const { error: reportsError } = await supabaseAdmin
        .from('reports')
        .delete()
        .eq('user_id', userId);

      // Finally, we can choose to delete the profile or just clear it. 
      // User wants to re-register, so let's delete the profile row.
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      return res.status(200).json({ message: 'User core data purged successfully' });
    } catch (error) {
      console.error('[NukeController Error]', error);
      return res.status(500).json({ error: 'Failed to purge user data' });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    const { userId, updates } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
      const profile = await DatabaseService.updateProfile(userId, updates);
      return res.status(200).json(profile);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async deleteSession(req: Request, res: Response) {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    try {
      await DatabaseService.deleteSession(sessionId as string);
      return res.status(200).json({ message: 'Session archived successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to archive session' });
    }
  }
}
