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
    userProfile?: any
  ) {
    const prompt = PromptManager.getPrompt('conversation_persona.txt');
    const modelName = process.env.GROQ_CONVERSATION_MODEL || 'llama3-70b-8192';

    const systemContext = `
      ${prompt}
      
      USER CONTEXT:
      Profile: ${JSON.stringify(userProfile || 'Not provided')}
      Health History Snapshot: ${healthSnapshot}
      
      CURRENT CONVERSATION LOGIC:
      Respond to the user's latest message while maintaining the MEDIQ persona.
      If they ask about health data, refer to their health history snapshot.
      Be concise, empathetic, and relatable.
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
            { role: 'system', content: systemContext },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Groq API failure');
      return data.choices[0].message.content;
    });
  }
}
