import makeWASocket, { 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { AIOrchestrator } from '../services/ai_orchestrator.service';
import { DatabaseService } from '../services/database.service';
import { HealthMemoryService } from '../services/health_memory.service';
import { useSupabaseAuthState } from './supabase_auth';
import { supabaseAdmin } from '../config/supabase';

const logger = pino({ level: 'silent' });

export class WhatsAppConnection {
  private static sock: any;

  static async ensureBucketExists() {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'baileys_auth')) {
      console.log('[WhatsApp] Creating baileys_auth storage bucket...');
      await supabaseAdmin.storage.createBucket('baileys_auth', { public: false });
    }
  }

  static async connect() {
    await this.ensureBucketExists();
    
    const { state, saveCreds } = await useSupabaseAuthState();
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`[WhatsApp] Initializing MEDIQ Neural Link (v${version.join('.')})...`);

    this.sock = makeWASocket({
      version,
      printQRInTerminal: true,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      browser: ['MEDIQ', 'Safari', '3.0.0'],
      // Add more robust connection options
      retryRequestDelayMs: 2000,
      connectTimeoutMs: 20000
    });

    this.sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('[WhatsApp] New QR Received. Scan to establish MEDIQ Link:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.error(`[WhatsApp] Link Disconnected (${statusCode}). Reconnecting: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          // Add a slight delay before reconnecting to prevent rapid cycling
          setTimeout(() => this.connect(), 5000);
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp] MEDIQ Neural Link ONLINE.');
      }
    });

    // Persistent storage of credentials
    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('messages.upsert', async (m: any) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const imageMsg = msg.message.imageMessage;

        if (!text && !imageMsg) continue;

        try {
          console.log(`[WhatsApp] Link Active: ${from} | Type: ${imageMsg ? 'IMAGE' : 'TEXT'}`);

          // 1. Resolve User
          const { user, isNew } = await DatabaseService.getOrCreateUserByWhatsApp(from);

          // 2. Elite Onboarding (Unique Welcome)
          if (isNew && !user.welcome_sent) {
            const welcomeMsg = await AIOrchestrator.generateWelcomeMessage(user.username || user.full_name);
            console.log(`[WhatsApp] Sending Welcome Message to ${from}: ${welcomeMsg.substring(0, 100)}...`);
            await this.sock.sendMessage(from, { text: welcomeMsg });
            await DatabaseService.markWelcomeSent(user.id);
          }

          // 3. Clinical Synthesis
          await this.sock.presenceSubscribe(from);
          await this.sock.sendPresenceUpdate('composing', from);

          const healthSnapshot = await HealthMemoryService.getHealthSnapshot(user.id);
          
          // --- SHADOW LIMIT ENFORCEMENT ---
          const GENESIS_WORD_LIMIT = 1000;
          const GENESIS_DOC_LIMIT = 3;
          
          if (!user.is_registered) {
            if (user.words_consumed >= GENESIS_WORD_LIMIT || user.docs_consumed >= GENESIS_DOC_LIMIT) {
              const cleanNum = from.split('@')[0];
              const signupLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?whatsapp=${cleanNum}`;
              const limitMsg = `[Neural Link Saturated] Your Genesis Access has reached its clinical capacity. To continue this synthesis and preserve your data history, please establish your Sovereign Identity: ${signupLink}`;
              await this.sock.sendMessage(from, { text: limitMsg });
              return;
            }
          }

          let aiResponse: string;

          if (imageMsg) {
            // --- MEDIA FLOW ---
            console.log('[WhatsApp] Downloading clinical media...');
            const buffer = await downloadMediaMessage(msg, 'buffer', {}, { 
              logger, 
              reuploadRequest: this.sock.updateMediaMessage 
            });
            
            const analysis = await AIOrchestrator.executeAnalysisPipeline(
              buffer as Buffer,
              healthSnapshot,
              user
            );
            aiResponse = analysis.final_response;

            // Track Doc Consumption
            if (!user.is_registered) {
              await DatabaseService.incrementConsumables(user.id, 0, 1);
            }
          } else {
            // --- TEXT FLOW ---
            let sessionId;
            const sessions = await DatabaseService.getUserSessions(user.id);
            sessionId = sessions.length > 0 ? sessions[0].id : (await DatabaseService.createChatSession(user.id, 'WhatsApp Protocol')).id;

            const rawHistory = await DatabaseService.getSessionMessages(sessionId);
            const formattedHistory = rawHistory.map((m: any) => ({
              role: m.role,
              content: m.content,
              timestamp: m.created_at
            }));

            aiResponse = await AIOrchestrator.performDirectChat(
              text!,
              formattedHistory, 
              healthSnapshot,
              user
            );

            // Track Word Consumption
            if (!user.is_registered) {
              const words = (text || '').split(/\s+/).length + aiResponse.split(/\s+/).length;
              await DatabaseService.incrementConsumables(user.id, words, 0);
            }
          }

          // 4. Persistence & Simulated Streaming
          let finalSessionId;
          const currentSessions = await DatabaseService.getUserSessions(user.id);
          finalSessionId = currentSessions.length > 0 ? currentSessions[0].id : (await DatabaseService.createChatSession(user.id, 'WhatsApp Consult')).id;

          await DatabaseService.saveChatMessage(finalSessionId, 'user', text || '[Clinical Image Sent]');
          await DatabaseService.saveChatMessage(finalSessionId, 'assistant', aiResponse);

          console.log(`[WhatsApp] Sending AI Response to ${from}: ${aiResponse.substring(0, 100)}...`);
          await this.streamToWhatsApp(from, aiResponse);

        } catch (error) {
          console.error('[WhatsApp Link Error]', error);
        }
      }
    });
  }

  /**
   * Simulates streaming on WhatsApp by sending messages in natural chunks.
   */
  private static async streamToWhatsApp(jid: string, text: string) {
    // Split by sentence endings or double newlines for natural breaks
    const chunks = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      if (!chunk) continue;

      // Simulate typing for this specific chunk based on length
      await this.sock.sendPresenceUpdate('composing', jid);
      const typingDuration = Math.min(Math.max(chunk.length * 50, 1500), 4000);
      await new Promise(r => setTimeout(r, typingDuration));
      
      await this.sock.sendMessage(jid, { text: chunk });
      await this.sock.sendPresenceUpdate('paused', jid);

      // Brief pause between thoughts
      if (i < chunks.length - 1) {
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }
}
