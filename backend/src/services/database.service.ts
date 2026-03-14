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

  /**
   * Fetches the platform of the absolute last message for a user across all sessions.
   * This is used to detect platform switches (e.g. User moving from WhatsApp to Dashboard).
   */
  static async getLastMessagePlatform(userId: string): Promise<'whatsapp' | 'dashboard' | null> {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('platform, chat_sessions!inner(user_id)')
      .eq('chat_sessions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error(`[DatabaseService] Error in getLastMessagePlatform:`, error);
      return null;
    }
    
    const platform = (data as any).platform as 'whatsapp' | 'dashboard';
    return platform;
  }

  /**
   * Fetches the last N messages from a specific platform for a user across all sessions.
   * Useful for injecting context during a platform switch.
   */
  static async getLastMessagesByPlatform(userId: string, platform: 'whatsapp' | 'dashboard', limit: number = 3) {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select(`
        role, 
        content, 
        platform, 
        created_at,
        chat_sessions!inner(user_id)
      `)
      .eq('chat_sessions.user_id', userId)
      .eq('platform', platform)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`[DatabaseService] Error fetching last ${platform} messages:`, error);
      return [];
    }

    // Clean up the data to remove the nested join object and return in chronological order
    return (data || []).map((m: any) => ({
      role: m.role,
      content: m.content,
      platform: m.platform,
      created_at: m.created_at
    })).reverse();
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

  static async getOrCreateUserByWhatsApp(whatsappId: string, resolvedPhone?: string) {
    // 1. Precise Normalization
    let normalizedId = whatsappId.trim();
    const idNumber = normalizedId.split('@')[0].replace(/\D/g, '');
    const cleanPhone = resolvedPhone ? resolvedPhone.replace(/\D/g, '') : null;
    
    console.log(`[DatabaseService] WhatsApp Lookup -> JID: ${normalizedId} | ResolvedPhone: ${cleanPhone}`);

    // 2. HIGHEST PRIORITY: Match by Resolved Phone Number (Extracted from metadata)
    if (cleanPhone) {
      console.log(`[DatabaseService] Attempting Phone-First Match: %${cleanPhone}%`);
      const { data: userByPhone } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('whatsapp_number', `%${cleanPhone}%`)
        .maybeSingle();

      if (userByPhone) {
        console.log(`[DatabaseService] Identity FOUND by Phone: ${userByPhone.full_name}`);
        // If the current JID is an LID and the DB still has the old PNID, update it to the LID
        if (normalizedId.endsWith('@lid') && userByPhone.whatsapp_number !== normalizedId) {
          console.log(`[DatabaseService] Updating Profile JID to LID: ${normalizedId}`);
          await supabaseAdmin.from('profiles').update({ whatsapp_number: normalizedId }).eq('id', userByPhone.id);
        }
        return { user: { ...userByPhone, whatsapp_number: normalizedId }, isNew: false };
      }
    }

    // 3. SECOND PRIORITY: Direct JID Match
    const { data: userByJid } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('whatsapp_number', normalizedId)
      .maybeSingle();

    if (userByJid) {
      console.log(`[DatabaseService] Identity FOUND by JID: ${userByJid.full_name}`);
      return { user: userByJid, isNew: false };
    }

    // 4. THIRD PRIORITY: Numeric ID Match (Last Resort)
    console.log(`[DatabaseService] No phone or JID match. Searching by ID number: %${idNumber}%`);
    const { data: userByNumberMatch } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('whatsapp_number', `%${idNumber}%`)
      .maybeSingle();

    if (userByNumberMatch) {
      console.log(`[DatabaseService] Identity FOUND by ID Match: ${userByNumberMatch.full_name}. Linking JID ${normalizedId}`);
      await supabaseAdmin.from('profiles').update({ whatsapp_number: normalizedId }).eq('id', userByNumberMatch.id);
      return { user: { ...userByNumberMatch, whatsapp_number: normalizedId }, isNew: false };
    }

    console.log(`[DatabaseService] TOTAL IDENTITY MISMATCH. Provisioning fresh profile for ${normalizedId}`);
    // 5. Create new user if all else fails
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({ 
        whatsapp_number: normalizedId,
        full_name: 'Sovereign User',
        username: `user_${idNumber.slice(-4)}`
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
