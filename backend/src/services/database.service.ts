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
