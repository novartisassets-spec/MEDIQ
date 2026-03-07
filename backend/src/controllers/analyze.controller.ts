import { Request, Response } from 'express';
import { AIOrchestrator } from '../services/ai_orchestrator.service.js';
import { DatabaseService } from '../services/database.service.js';
import { HealthMemoryService } from '../services/health_memory.service.js';

export class AnalyzeController {
  /**
   * Main entry point for analyzing a laboratory report.
   * This orchestrates vision OCR, clinical analysis, and conversational rendering.
   */
  static async analyzeReport(req: Request, res: Response) {
    const { fileUrl, userId } = req.body;

    if (!fileUrl || !userId) {
      return res.status(400).json({ error: 'Missing fileUrl or userId' });
    }

    try {
      console.log(`[Analysis Initiated] User: ${userId}, Resource: ${fileUrl}`);

      // 1. Fetch Image from URL (Assuming fileUrl is a signed storage URL)
      const imageResponse = await fetch(fileUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // 2. Retrieve Historical Snapshot (Memory Retrieval)
      const healthSnapshot = await HealthMemoryService.getHealthSnapshot(userId);
      const userProfile = await DatabaseService.getUserProfile(userId);

      // 3. Execute Multi-Layered AI Pipeline (Gemini 2.5 Flash + Groq Orchestration)
      const analysis = await AIOrchestrator.executeAnalysisPipeline(
        imageBuffer, 
        healthSnapshot,
        userProfile || undefined
      );

      // 4. Persistence (Saving to Supabase for future Memory)
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

      // 5. Sophisticated Response Delivery
      return res.status(200).json({
        reportId: savedReport.id,
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
}
