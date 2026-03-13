import { GoogleGenerativeAI } from "@google/generative-ai";
import { PromptManager } from '../utils/prompt_manager';
import { ResilienceService } from './resilience.service';

/**
 * AI ORCHESTRATOR SERVICE
 * Manages the Multi-Layered Analysis Pipeline:
 * Layer 1 & 2: Gemini (Vision/OCR + Medical Context)
 * Layer 3: Groq (Conversational Rendering)
 */
export class AIOrchestrator {
  private static visionModel = process.env.GEMINI_VISION_MODEL || 'gemini-1.5-pro';

  /**
   * Complete Pipeline Execution
   * @param imageBuffer - Buffer of the lab report image
   * @param historicalData - Optional historical records for trend analysis
   * @param userProfile - Optional user profile for deeper context
   */
  static async executeAnalysisPipeline(
    imageBuffer: Buffer, 
    historicalData: any[] | string = [],
    userProfile?: any
  ) {
    const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';
    try {
      // 1. LAYER 1: VISION OCR (GEMINI)
      const rawData = await ResilienceService.executeWithResilience('GEMINI', async (apiKey) => {
        return await this.performVisionOCR(apiKey, imageBuffer);
      });
      console.log(`[AI Orchestrator] Layer 1: OCR Complete (${model})`);

      // 2. LAYER 2: MEDICAL CONTEXT (GEMINI)
      const clinicalInsights = await ResilienceService.executeWithResilience('GEMINI', async (apiKey) => {
        return await this.performMedicalAnalysis(apiKey, rawData, userProfile);
      });
      console.log(`[AI Orchestrator] Layer 2: Clinical Contextualization Complete (${model})`);

      // 3. LAYER 3: CONVERSATIONAL RENDERING (GROQ)
      const userResponse = await ResilienceService.executeWithResilience('GROQ', async (apiKey) => {
        return await this.performConversationalRendering(apiKey, clinicalInsights, historicalData, userProfile);
      });
      console.log('[AI Orchestrator] Layer 3: Conversational Rendering Complete');

      return {
        raw_data: rawData,
        clinical_insights: clinicalInsights,
        final_response: userResponse
      };
    } catch (error) {
      console.error('[AI Orchestrator] Pipeline Failure', error);
      throw error;
    }
  }

  private static async performVisionOCR(apiKey: string, imageBuffer: Buffer) {
    const prompt = PromptManager.getPrompt('vision_ocr.txt');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: this.visionModel });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text();
    return JSON.parse(text.replace(/```json|```/g, ""));
  }

  private static async performMedicalAnalysis(apiKey: string, rawData: any, userProfile?: any) {
    const prompt = PromptManager.getPrompt('vision_medical.txt');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: this.visionModel });

    const inputData = {
      biomarkers: rawData,
      user_profile: userProfile || 'Not provided'
    };

    const result = await model.generateContent([
      prompt,
      `INPUT DATA: ${JSON.stringify(inputData)}`
    ]);

    const text = result.response.text();
    return JSON.parse(text.replace(/```json|```/g, ""));
  }

  private static async performConversationalRendering(
    apiKey: string,
    clinicalInsights: any, 
    historicalData: any[] | string,
    userProfile?: any
  ) {
    const prompt = PromptManager.getPrompt('conversation_persona.txt');
    const modelName = process.env.GROQ_CONVERSATION_MODEL || 'llama3-70b-8192';

    const inputData = {
      clinical_insights: clinicalInsights,
      historical_context: historicalData,
      user_profile: userProfile || 'Not provided'
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: prompt },
          { 
            role: 'user', 
            content: `DATA FOR ANALYSIS: ${JSON.stringify(inputData)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data: any = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq API failure');
    return data.choices[0].message.content;
  }

  /**
   * Performs a direct chat interaction with the MEDIQ persona.
   */
  static async performDirectChat(
    userMessage: string,
    history: any[],
    healthSnapshot: string,
    userProfile?: any,
    crossPlatformSummary?: string | null
  ) {
    const prompt = PromptManager.getPrompt('conversation_persona.txt');
    const modelName = process.env.GROQ_CONVERSATION_MODEL || 'llama3-70b-8192';

    // 1. Sliding Window: Take only the last 15 messages for live flow (increased from 9 for better bridge context)
    const liveHistory = history.slice(-15);
    
    // 2. Attribution: Tag messages with platform and timestamp
    const formattedHistory = liveHistory.map(h => {
      const time = h.created_at || h.timestamp ? new Date(h.created_at || h.timestamp).toLocaleTimeString() : 'Recent';
      const platformLabel = h.platform ? h.platform.toUpperCase() : 'CORE';
      return { 
        role: h.role, 
        content: `[${time} - ${platformLabel}] ${h.role === 'assistant' ? 'MEDIQ' : 'User'}: ${h.content}`
      };
    });

    // 3. System Context Assembly (Hierarchical)
    const hasBridgeContext = liveHistory.some(m => m.platform && m.platform !== 'dashboard'); // For Dashboard calls

    const systemContext = `
      ${prompt}
      
      === SOVEREIGN HEALTH SNAPSHOT (REAL-TIME DATA) ===
      ${healthSnapshot}
      
      === LONG-TERM MEMORY (CROSS-PLATFORM CONTINUITY) ===
      ${crossPlatformSummary ? `OTHER FEED SUMMARY: ${crossPlatformSummary}` : 'No prior long-term cross-platform summary yet. Refer to recent conversation history for context.'}
      ${history.length > 15 && history[0].sessionSummary ? `CURRENT SESSION ARCHIVE: ${history[0].sessionSummary}` : ''}
      
      USER IDENTITY:
      ${JSON.stringify(userProfile || 'Sovereign Node')}
      
      MISSION:
      You are an elite clinical orchestrator. You are having a continuous conversation across multiple nodes (WhatsApp & Dashboard). 
      - IMPORTANT: Your response MUST be clean, natural raw text only. **NEVER** include the "[TIME - PLATFORM] MEDIQ:" prefix or any other metadata labels in your own output.
      - Always address the user by their Name if provided.
      - Use the provided context to bridge conversations seamlessly (e.g., if you see a user just moved from WhatsApp, acknowledge it: "Picking up from our talk on WhatsApp...").
      - CRITICAL STATE UPDATE: If you previously stated that you didn't have access to context from another platform, but you now see messages tagged with [WHATSAPP] or [DASHBOARD] in your history, ACKNOWLEDGE the sync immediately (e.g., "Ah, your WhatsApp records just synced through—I can see now we were discussing...").
      - Use the injected context to maintain a single "Golden Thread" of conversation across platforms.
      - If you see history from another platform, acknowledge it to show continuity.
      - Maintain a consistent clinical persona and elite professional tone.
      - If you see a shift in biomarkers in the Snapshot, address it if relevant.
      - Use the provided conversation history (with timestamps) to understand the progression.
      - If you previously asked a question on ANY platform, check if the user answered it.
      - If you were discussing a specific biomarker, maintain that focus until it's natural to move on.
      - Synthesize past context when relevant.
      - Always bridge to their lifestyle.
      - Use plain English ONLY.
    `;

    console.log(`[AI Orchestrator] Final Prompt Constructed. Total History Messages: ${formattedHistory.length}`);
    if (formattedHistory.length > 0) {
      console.log(`[AI Orchestrator Debug] First message in history: ${formattedHistory[0].content}`);
      console.log(`[AI Orchestrator Debug] Last message in history: ${formattedHistory[formattedHistory.length - 1].content}`);
    }

    return await ResilienceService.executeWithResilience('GROQ', async (apiKey) => {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemContext },
            ...formattedHistory,
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Groq API failure');
      
      let aiResponse = data.choices[0].message.content;

      // --- MILLION DOLLAR SURGICAL FIX: Response Sanitizer ---
      // Strips hallucinated headers like "[12:00:00 PM - WHATSAPP] MEDIQ:" or "[CORE] MEDIQ:"
      const headerRegex = /^\[.*?\]\s*(MEDIQ|User):\s*/i;
      if (headerRegex.test(aiResponse)) {
        console.log(`[AI Orchestrator] Sanitizing hallucinated header from response...`);
        aiResponse = aiResponse.replace(headerRegex, '').trim();
      }

      return aiResponse;
    });
  }

  /**
   * Generates a high-density clinical summary of a conversation session.
   */
  static async generateSessionSummary(history: any[]) {
    const modelName = process.env.GROQ_CONVERSATION_MODEL || 'llama3-70b-8192';
    const summaryPrompt = `
      As a Senior Medical Data Analyst, provide a high-density Executive Summary of the following health-related conversation.
      Focus on:
      1. Primary concerns raised by the user.
      2. Key clinical insights or biomarkers discussed.
      3. Actionable advice already given by MEDIQ.
      4. Outstanding questions or next steps.
      
      KEEP IT CONCISE AND FACT-DENSE (under 200 words). Use clinical terminology where appropriate.
    `;

    return await ResilienceService.executeWithResilience('GROQ', async (apiKey) => {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: summaryPrompt },
            { role: 'user', content: `CONVERSATION TO SUMMARIZE: ${JSON.stringify(history)}` }
          ],
          temperature: 0.3
        })
      });

      const data: any = await response.json();
      if (!response.ok) return "Summary recalibrating.";
      return data.choices[0].message.content;
    });
  }

  /**
   * Generates a personalized welcome message for WhatsApp onboarding.
   */
  static async generateWelcomeMessage(userName?: string) {
    const prompt = PromptManager.getPrompt('welcome_persona.txt');
    const modelName = process.env.GROQ_CONVERSATION_MODEL || 'llama3-70b-8192';

    return await ResilienceService.executeWithResilience('GROQ', async (apiKey) => {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: `The user's name is ${userName || 'Sovereign User'}. Greet them and welcome them to MEDIQ.` }
          ],
          temperature: 0.9 // Higher creativity for unique welcome messages
        })
      });

      const data: any = await response.json();
      return data.choices[0].message.content;
    });
  }
}
