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

  static async sendWelcomeMessageToUser(userId: string, whatsappJid: string, isProactive: boolean = true) {
    try {
      const userProfile = await DatabaseService.getUserProfile(userId);
      if (!userProfile) return;
      
      if (userProfile.welcome_sent) {
        console.log(`[WhatsApp] Welcome already sent to ${whatsappJid}. Skipping.`);
        return;
      }

      // 1. RESOLVE LIVE IDENTITY (LID Bridge)
      // WhatsApp might prefer an LID over the PNID we have. 
      // We query WhatsApp to see what the "official" JID for this number is right now.
      let liveJid = whatsappJid;
      try {
        const cleanNumber = whatsappJid.split('@')[0].replace(/\D/g, '');
        const [result] = await this.sock.onWhatsApp(cleanNumber);
        if (result && result.exists) {
          liveJid = result.jid;
          console.log(`[WhatsApp] Identity Resolved: ${whatsappJid} -> ${liveJid}`);
          
          // NEW: If result.jid is an LID, save it to the mapping table proactively
          if (liveJid.endsWith('@lid')) {
            console.log(`[WhatsApp Bridge] Saving Proactive Mapping: ${liveJid} -> ${cleanNumber}`);
            await DatabaseService.saveLidMapping(liveJid, cleanNumber);
          }

          // Update the database with the resolved Live JID so replies match perfectly
          await DatabaseService.updateProfile(userId, { whatsapp_number: liveJid });
        }
      } catch (e) {
        console.warn(`[WhatsApp] Identity resolution failed for ${whatsappJid}, using original.`);
      }

      const welcomeMsg = await AIOrchestrator.generateWelcomeMessage(userProfile.full_name || userProfile.username);
      
      // 2. Create the Anchor Session immediately
      const session = await DatabaseService.createChatSession(userId, 'WhatsApp Health Link', 'whatsapp');
      
      // 3. Persist the message so it shows on Dashboard
      await DatabaseService.saveChatMessage(session.id, 'assistant', welcomeMsg, 'whatsapp');

      // 4. Send the actual WhatsApp message to the LIVE JID
      console.log(`[WhatsApp] Sending ${isProactive ? 'PROACTIVE' : 'REACTIVE'} Welcome to ${liveJid}`);
      await this.sock.sendMessage(liveJid, { text: welcomeMsg });
      
      // 5. Mark as sent to prevent duplicates
      await DatabaseService.markWelcomeSent(userId);
    } catch (error) {
      console.error(`[WhatsApp] Error in welcome flow:`, error);
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

    // --- LID IDENTITY MAPPING ---
    const mapLidToProfile = async (contacts: any[]) => {
      for (const contact of contacts) {
        // Detailed logging to find where WhatsApp hides the phone number
        if (contact.id.endsWith('@lid')) {
          const phone = (contact as any).phoneNumber || (contact as any).verifiedName || (contact as any).notify;
          if (phone && /^\d+$/.test(phone.replace(/\D/g, ''))) {
            const cleanPhone = phone.replace(/\D/g, '');
            console.log(`[WhatsApp Bridge] Mapping Found: ${cleanPhone} -> ${contact.id}`);
            await DatabaseService.saveLidMapping(contact.id, cleanPhone);
          }
        }
      }
    };

    this.sock.ev.on('messaging-history.set', ({ contacts }: any) => {
      console.log(`[WhatsApp Bridge] Processing history for ${contacts?.length} contacts...`);
      mapLidToProfile(contacts || []);
    });

    this.sock.ev.on('contacts.upsert', (contacts: any) => {
      mapLidToProfile(contacts || []);
    });

    this.sock.ev.on('messages.upsert', async (m: any) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        let from = msg.key.remoteJid;
        const pushName = msg.pushName || 'Unknown';
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const imageMsg = msg.message.imageMessage;

        if (!text && !imageMsg) continue;

        // --- NEW: PN-FIRST IDENTITY RESOLUTION ---
        // 1. Extract potential phone number from metadata (LID to PN Bridge)
        const senderPn = (msg as any).senderPn || 
                         (msg.key as any).participantAlt || 
                         (msg.key as any).remoteJidAlt;
        
        let resolvedFrom = from;
        if (from.endsWith('@lid') && senderPn) {
          const cleanPn = senderPn.split('@')[0].replace(/\D/g, '');
          console.log(`[WhatsApp Bridge] Meta-Data PN Detected: ${cleanPn} for LID: ${from}`);
          
          // 2. Perform Lookup by PN first
          const profile = await DatabaseService.getProfileByNumber(cleanPn);
          if (profile) {
            console.log(`[WhatsApp Bridge] Profile Matched by PN: ${profile.full_name}. Linking LID: ${from}`);
            // Map the profile to this LID permanently and use PN for resolution
            await DatabaseService.updateProfile(profile.id, { whatsapp_number: from });
            await DatabaseService.saveLidMapping(from, cleanPn);
            // We'll let the next step use the LID as it's now mapped
          }
        }

        try {
          console.log(`[WhatsApp] Incoming Message | From: ${from} (${pushName}) | Type: ${imageMsg ? 'IMAGE' : 'TEXT'}`);

          // 2. Resolve User (Now LID-aware and self-healing)
          const { user, isNew } = await DatabaseService.getOrCreateUserByWhatsApp(from);

          // 2. Elite Onboarding (Unique Welcome)
          if (isNew && !user.welcome_sent) {
            await WhatsAppConnection.sendWelcomeMessageToUser(user.id, from, false);
          }

          // 3. Clinical Synthesis
          await this.sock.presenceSubscribe(from);
          await this.sock.sendPresenceUpdate('composing', from);

          const healthSnapshot = await HealthMemoryService.getHealthSnapshot(user.id);
          const dashboardSummary = await DatabaseService.getPlatformSummary(user.id, 'dashboard');
          
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

            // Persistence for Media Analysis
            const currentSessions = await DatabaseService.getUserSessions(user.id);
            const mid = currentSessions.length > 0 ? currentSessions[0].id : (await DatabaseService.createChatSession(user.id, 'Clinical Media Analysis', 'whatsapp')).id;
            await DatabaseService.saveChatMessage(mid, 'user', '[Clinical Image Sent]', 'whatsapp');
            await DatabaseService.saveChatMessage(mid, 'assistant', aiResponse, 'whatsapp');

            // Track Doc Consumption
            if (!user.is_registered) {
              await DatabaseService.incrementConsumables(user.id, 0, 1);
            }
          } else {
            // --- TEXT FLOW ---
            let sessionId;
            const sessions = await DatabaseService.getUserSessions(user.id);
            // WhatsApp is the "Anchor" session. We always use the most recent WhatsApp-dominant session.
            sessionId = sessions.length > 0 ? sessions[0].id : (await DatabaseService.createChatSession(user.id, 'WhatsApp Health Link', 'whatsapp')).id;

            let rawHistory = await DatabaseService.getSessionMessages(sessionId);

            // --- MILLION DOLLAR SURGICAL FIX: Platform Switch Detection ---
            const lastPlatform = await DatabaseService.getLastMessagePlatform(user.id);
            console.log(`[OmniChannel Debug] User: ${user.id} | Current Platform: whatsapp | Last Absolute Platform: ${lastPlatform}`);

            if (lastPlatform === 'dashboard') {
              console.log(`[OmniChannel] Platform Switch Detected: Dashboard -> WhatsApp. Fetching bridge history...`);
              const bridgeHistory = await DatabaseService.getLastMessagesByPlatform(user.id, 'dashboard', 3);
              console.log(`[OmniChannel Debug] Fetched ${bridgeHistory.length} messages from Dashboard for injection.`);
              
              // Only inject if the messages are NOT already in the current session (to avoid duplication)
              const existingContents = new Set(rawHistory.map((m: any) => m.content));
              const uniqueBridge = bridgeHistory.filter((m: any) => !existingContents.has(m.content));
              console.log(`[OmniChannel Debug] Unique bridge messages to inject: ${uniqueBridge.length}`);
              
              if (uniqueBridge.length > 0) {
                rawHistory = [...uniqueBridge, ...rawHistory];
                console.log(`[OmniChannel Debug] History augmented. New count: ${rawHistory.length}`);
              }
            }
            
            // 25-Message Summarization Trigger
            if (rawHistory.length > 25) {
              const newSummary = await AIOrchestrator.generateSessionSummary(rawHistory);
              await DatabaseService.updateSessionSummary(sessionId, newSummary);
              rawHistory[0].sessionSummary = newSummary;
            } else {
              const existingSummary = await DatabaseService.getSessionSummary(sessionId);
              if (existingSummary && rawHistory.length > 0) rawHistory[0].sessionSummary = existingSummary;
            }

            aiResponse = await AIOrchestrator.performDirectChat(
              text!,
              rawHistory, 
              healthSnapshot,
              user,
              dashboardSummary
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
          finalSessionId = currentSessions.length > 0 ? currentSessions[0].id : (await DatabaseService.createChatSession(user.id, 'WhatsApp Consult', 'whatsapp')).id;

          await DatabaseService.saveChatMessage(finalSessionId, 'user', text || '[Clinical Image Sent]', 'whatsapp');
          await DatabaseService.saveChatMessage(finalSessionId, 'assistant', aiResponse, 'whatsapp');

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
