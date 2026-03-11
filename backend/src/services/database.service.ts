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

  static async createChatSession(userId: string, title?: string) {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({ user_id: userId, title: title || 'New Protocol Discussion' })
      .select()
      .single();

    if (error) throw error;
    return data;
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

  static async getSessionMessages(sessionId: string) {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async saveChatMessage(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: any) {
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .insert({ session_id: sessionId, role, content, metadata });

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
    // Try to find user by their WhatsApp JID (e.g., 1234567890@s.whatsapp.net)
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('whatsapp_number', whatsappId)
      .maybeSingle();

    if (user) return { user, isNew: false };

    // Create new user if not found (Implicit registration)
    // We try to extract a clean number if possible
    const cleanNumber = whatsappId.split('@')[0];

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({ 
        whatsapp_number: whatsappId,
        full_name: 'Sovereign User',
        username: `user_${cleanNumber.slice(-4)}` // Temporary username
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
