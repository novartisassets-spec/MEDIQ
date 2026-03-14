import { Request, Response } from 'express';
import { AIOrchestrator } from '../services/ai_orchestrator.service';
import { ResilienceService } from '../services/resilience.service';
import fetch from 'node-fetch';

export class SupportController {
  /**
   * Handle support chat for visitors and users.
   * This does NOT persist to the main clinical database to keep it clean for visitors.
   */
  static async handleSupportChat(req: Request, res: Response) {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    try {
      console.log(`[Support Chat] New inquiry received.`);

      const supportPersona = `
        You are the MEDIQ Support Architect, an elite concierge for the world's most advanced biological dominance platform.
        Your goal is to assist visitors and users with platform navigation, technical support, and explaining the value of MEDIQ.
        
        TONE:
        - Sophisticated, professional, and slightly futuristic.
        - Direct and helpful.
        - Use "clinical" and "architectural" metaphors sparingly but effectively.
        
        KEY KNOWLEDGE:
        - MEDIQ provides AI-driven health analysis from lab reports.
        - Users get a "Golden Thread" of their health across WhatsApp and Web.
        - We prioritize "Biological Sovereignty" (Privacy and User-owned data).
        - To start: Users should "Initialize Access" (Sign up) and drop a lab report.
        
        RULES:
        - Do NOT provide medical advice.
        - Focus on platform utility.
        - If asked about "Biological Dominance", explain it as the proactive mastery of one's own physiological data.
        - Keep responses concise and elegant.
      `;

      const aiResponse = await ResilienceService.executeWithResilience('GROQ', async (apiKey) => {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.GROQ_CONVERSATION_MODEL || 'llama3-70b-8192',
            messages: [
              { role: 'system', content: supportPersona },
              ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
              { role: 'user', content: message }
            ],
            temperature: 0.6,
            max_tokens: 500,
          }),
        });

        const data: any = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Groq API failure');
        return data.choices[0].message.content;
      });

      return res.status(200).json({
        response: aiResponse,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[SupportController Error]', error);
      return res.status(500).json({ 
        error: 'Support link unstable',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
