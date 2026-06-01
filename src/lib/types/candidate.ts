export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date?: string;
  grade?: string;
}

export interface WorkHistory {
  id?: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface CandidateProfile {
  id?: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  current_title?: string;
  years_experience?: number;
  headline?: string;
  summary?: string;
  skills: string[];
  tools: string[];
  certifications: string[];
  languages: string[];
  education: Education[];
  work_history: WorkHistory[];
  target_titles: string[];
  target_seniority?: string;
  preferred_industries: string[];
  notice_period?: string;
  availability_date?: string;
  relocation_willingness?: string;
  master_cv_text?: string;
  created_at?: string;
  updated_at?: string;
}
