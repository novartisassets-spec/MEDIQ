export interface UserProfile {
  id: string;
  whatsapp_number?: string;
  username?: string;
  full_name: string;
  email?: string;
  country?: string;
  is_registered?: boolean;
  words_consumed?: number;
  docs_consumed?: number;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  base_health_conditions?: string[];
  welcome_sent?: boolean;
}

export interface LabReport {
  id: string;
  user_id: string;
  report_date: string;
  file_url: string;
  overall_summary: string;
  created_at: string;
}

export interface BiomarkerData {
  id?: string;
  report_id: string;
  user_id: string;
  category: string; // e.g., 'Lipid Panel', 'CBC'
  name: string;      // e.g., 'LDL Cholesterol'
  value: number;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
  clinical_insight: string;
  recorded_at: string;
}

export interface HealthContext {
  previous_results: BiomarkerData[];
  user_profile: UserProfile;
}
