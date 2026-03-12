import { supabaseAdmin } from '../config/supabase';
import { BiomarkerData, LabReport, UserProfile } from '../types/medical';

export class DatabaseService {
  /**
   * Retrieves all historical biomarkers for a user to enable trend analysis.
   */
  static async getUserHealthHistory(userId: string): Promise<BiomarkerData[]> {
    const { data, error } = await supabaseAdmin
      .from('biomarkers')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('[DatabaseService] Error fetching health history:', error);
      return [];
    }

    return data as BiomarkerData[];
  }

  /**
   * Retrieves the most recent record for each unique biomarker for a user.
   */
  static async getLatestBiomarkers(userId: string): Promise<BiomarkerData[]> {
    const { data, error } = await supabaseAdmin
      .from('biomarkers')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('[DatabaseService] Error fetching latest biomarkers:', error);
      return [];
    }

    // Filter to get only the latest entry for each biomarker name
    const latest: Record<string, BiomarkerData> = {};
    (data as BiomarkerData[]).forEach(item => {
      if (!latest[item.name]) {
        latest[item.name] = item;
      }
    });

    return Object.values(latest);
  }

  /**
   * Saves a new analyzed report and its individual biomarkers.
   */
  static async saveAnalyzedReport(report: Partial<LabReport>, biomarkers: Partial<BiomarkerData>[]) {
    try {
      // 1. Save Report Metadata
      const { data: reportData, error: reportError } = await supabaseAdmin
        .from('reports')
        .insert(report)
        .select()
        .single();

      if (reportError) throw reportError;

      // 2. Save Granular Biomarkers linked to this report
      const biomarkersWithReportId = biomarkers.map(b => ({
        ...b,
        report_id: reportData.id
      }));

      const { error: biomarkersError } = await supabaseAdmin
        .from('biomarkers')
        .insert(biomarkersWithReportId);

      if (biomarkersError) throw biomarkersError;

      return reportData;
    } catch (error) {
      console.error('[DatabaseService] Error saving report data:', error);
      throw error;
    }
  }

  /**
   * CHAT SESSION MANAGEMENT
   */

  static async createChatSession(userId: string, title?: string, platform: 'dashboard' | 'whatsapp' = 'dashboard') {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({ 
        user_id: userId, 
        title: title || 'New Protocol Discussion',
        platform
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSession(sessionId: string) {
    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  }

  static async getUserSessions(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getSessionSummary(sessionId: string) {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('summary')
      .eq('id', sessionId)
      .single();

    if (error) return null;
    return data.summary;
  }

  static async updateSessionSummary(sessionId: string, summary: string) {
    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ summary, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Cross-platform context: Get the latest summary from the other platform.
   */
  static async getPlatformSummary(userId: string, targetPlatform: 'whatsapp' | 'dashboard') {
    const { data: sessions, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, summary')
      .eq('user_id', userId)
      .not('summary', 'is', null)
      .order('updated_at', { ascending: false });

    if (error || !sessions) return null;

    for (const s of sessions) {
      const { data: messages } = await supabaseAdmin
        .from('chat_messages')
        .select('platform')
        .eq('session_id', s.id)
        .eq('platform', targetPlatform)
        .limit(1);
      
      if (messages && messages.length > 0) return s.summary;
    }
    return null;
  }

  static async getSessionMessages(sessionId: string) {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async saveChatMessage(sessionId: string, role: 'user' | 'assistant', content: string, platform: 'dashboard' | 'whatsapp' = 'dashboard', metadata?: any) {
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .insert({ session_id: sessionId, role, content, platform, metadata });

    if (error) throw error;

    // Update session timestamp
    await supabaseAdmin
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  static async getLastVisualAnalysis(userId: string) {
    // Queries chat_messages across all sessions for this user looking for analysis metadata
    return await supabaseAdmin
      .from('chat_messages')
      .select('content, created_at')
      .eq('role', 'assistant')
      .not('metadata', 'is', null)
      .filter('metadata->type', 'eq', 'visual_analysis')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
  }

  /**
   * WHATSAPP USER MANAGEMENT
   */

  /**
   * Resolves a profile by searching for the number part of the WhatsApp JID.
   */
  static async getProfileByNumber(number: string) {
    const cleanNumber = number.replace(/\D/g, '');
    console.log(`[DatabaseService] Resolving profile for number: ${cleanNumber}`);
    
    // Search using a pattern match to handle different JID suffixes
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .filter('whatsapp_number', 'ilike', `%${cleanNumber}%`)
      .maybeSingle();

    if (error) {
      console.error('[DatabaseService] Error resolving profile by number:', error);
      return null;
    }
    
    if (data) console.log(`[DatabaseService] Profile found for ${cleanNumber}: ${data.full_name} (${data.id})`);
    else console.log(`[DatabaseService] No profile found for ${cleanNumber}`);
    
    return data;
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * LID BRIDGE METHODS
   */
  static async saveLidMapping(lid: string, phone: string) {
    const { error } = await supabaseAdmin
      .from('lid_mappings')
      .upsert({ lid, phone }, { onConflict: 'lid' });
    if (error) console.error('[DatabaseService] Error saving LID mapping:', error);
  }

  static async getPhoneByLid(lid: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('lid_mappings')
      .select('phone')
      .eq('lid', lid)
      .maybeSingle();
    
    if (error || !data) return null;
    return data.phone;
  }

  /**
   * Registers a new user with their profile details.
   */
  static async registerUser(profile: Partial<UserProfile>) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[DatabaseService] Registration error:', error);
      throw error;
    }

    return data;
  }

  static async getOrCreateUserByWhatsApp(whatsappId: string) {
    // 1. Precise Normalization
    let normalizedId = whatsappId.trim();
    const cleanNumber = normalizedId.split('@')[0].replace(/\D/g, '');
    
    console.log(`[DatabaseService] WhatsApp Lookup -> JID: ${normalizedId} | CleanNum: ${cleanNumber}`);

    // 2. Lookup with precedence:
    // A. Direct JID Match (Best case, catches mapped LIDs and PNIDs)
    const { data: userByJid } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('whatsapp_number', normalizedId)
      .maybeSingle();

    if (userByJid) {
      console.log(`[DatabaseService] Identity Match Found: ${userByJid.full_name}`);
      return { user: userByJid, isNew: false };
    }

    // B. LID BRIDGE RECOVERY (New: Catch users before they become "Genesis")
    if (normalizedId.endsWith('@lid')) {
      const mappedPhone = await this.getPhoneByLid(normalizedId);
      if (mappedPhone) {
        console.log(`[DatabaseService] LID Bridge Hit: ${normalizedId} -> ${mappedPhone}`);
        // Attempt recovery using the mapped phone number
        const { data: recoveredUser } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .ilike('whatsapp_number', `%${mappedPhone}%`)
          .maybeSingle();

        if (recoveredUser) {
          console.log(`[DatabaseService] Identity Recovered via Bridge: ${recoveredUser.full_name}`);
          // Promote LID to primary JID for future direct matches
          await supabaseAdmin.from('profiles').update({ whatsapp_number: normalizedId }).eq('id', recoveredUser.id);
          return { user: { ...recoveredUser, whatsapp_number: normalizedId }, isNew: false };
        }
      }
    }

    // C. Numeric Match (Fallback for unmapped LIDs or different PNID formats)
    console.log(`[DatabaseService] No direct match. Searching by number: %${cleanNumber}%`);
    const { data: userByNumberMatch } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('whatsapp_number', `%${cleanNumber}%`)
      .maybeSingle();

    if (userByNumberMatch) {
      console.log(`[DatabaseService] Numeric Match Found: ${userByNumberMatch.full_name}. Linking JID ${normalizedId}`);
      const { data: updatedUser } = await supabaseAdmin
        .from('profiles')
        .update({ whatsapp_number: normalizedId })
        .eq('id', userByNumberMatch.id)
        .select()
        .single();
      return { user: updatedUser || userByNumberMatch, isNew: false };
    }

    console.log(`[DatabaseService] Total Identity Mismatch. Provisioning Genesis Profile for ${normalizedId}`);
    // 3. Create new user if no identity exists
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({ 
        whatsapp_number: normalizedId,
        full_name: 'Sovereign User',
        username: `user_${cleanNumber.slice(-4)}`
      })
      .select()
      .single();

    if (createError) {
      console.error('[DatabaseService] Error during implicit WhatsApp registration:', createError);
      throw createError;
    }
    
    return { user: newUser, isNew: true };
  }

  static async markWelcomeSent(userId: string) {
    await supabaseAdmin
      .from('profiles')
      .update({ welcome_sent: true })
      .eq('id', userId);
  }

  static async incrementConsumables(userId: string, words: number, docs: number = 0) {
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('words_consumed, docs_consumed')
      .eq('id', userId)
      .single();

    if (user) {
      await supabaseAdmin
        .from('profiles')
        .update({
          words_consumed: (user.words_consumed || 0) + words,
          docs_consumed: (user.docs_consumed || 0) + docs
        })
        .eq('id', userId);
    }
  }

  /**
   * Gets the user's health profile for AI context.
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[DatabaseService] Could not fetch user profile:', error.message);
      return null;
    }

    return data as UserProfile;
  }
}
