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
