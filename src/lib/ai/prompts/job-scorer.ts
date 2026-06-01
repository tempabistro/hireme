import type { AIMessage } from '../provider';
import type {
  ParsedJobDescription,
  CandidateProfile,
  CountryPreference,
  CountryConfig,
} from '@/lib/types';

/**
 * Build the prompt messages for scoring a parsed job against
 * a candidate profile and country settings.
 */
export function buildJobScorerPrompt(
  job: ParsedJobDescription,
  profile: CandidateProfile,
  countryPreference: CountryPreference,
  countryConfig: CountryConfig,
): AIMessage[] {
  return [
    {
      role: 'system',
      content: `You are a strict, analytical recruitment scoring engine.

Your task is to evaluate how well a candidate matches a specific job, considering their profile, target country settings, and personal preferences.

SCORING DIMENSIONS (each scored 0-100):
1. role – How closely the job title/function matches the candidate's career trajectory.
2. skills – Overlap between required skills and the candidate's verified skills.
3. experience – Whether the candidate's years and depth of experience match the requirement.
4. industry – How relevant the candidate's industry background is.
5. location – Match between job location/work-mode and the candidate's preferences.
6. salary – Whether the salary range overlaps with the candidate's expectations.
7. visa – Whether the candidate has work authorisation or the employer sponsors visas.
8. seniority – Whether the seniority level is appropriate for the candidate.

PENALTY RULES:
- Wrong country AND no remote option → location score ≤ 20.
- Salary below candidate minimum → salary score ≤ 30.
- Visa required but no sponsorship and candidate lacks authorisation → visa score ≤ 10.
- Missing more than half of required skills → skills score ≤ 40.
- Experience gap > 3 years → experience score ≤ 40.

OVERALL SCORE CALCULATION:
Use these weights: role=0.15, skills=0.25, experience=0.15, industry=0.10, location=0.10, salary=0.10, visa=0.10, seniority=0.05.
overall_score = weighted average, rounded to nearest integer.

RECOMMENDATION:
- ≥ 85 → "strong_apply"
- ≥ 70 → "apply"
- ≥ 55 → "maybe"
- < 55 → "skip"

Return a SINGLE JSON object with this structure:
{
  "overall_score": number,
  "role_score": number,
  "skills_score": number,
  "experience_score": number,
  "industry_score": number,
  "location_score": number,
  "salary_score": number,
  "visa_score": number,
  "seniority_score": number,
  "recommendation": "strong_apply" | "apply" | "maybe" | "skip",
  "matched_keywords": string[],
  "missing_keywords": string[],
  "strengths": string[],
  "risks": string[],
  "explanation": string
}

Be honest and rigorous. Do NOT inflate scores to please the candidate.
Return ONLY the JSON object.`,
    },
    {
      role: 'user',
      content: `CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

JOB DETAILS:
${JSON.stringify(job, null, 2)}

CANDIDATE COUNTRY PREFERENCES:
Country: ${countryConfig.country_name} (${countryConfig.country_code})
Work Authorisation Status: ${countryPreference.work_authorisation_status ?? 'Not specified'}
Visa Sponsorship Required: ${countryPreference.visa_sponsorship_required ?? 'Not specified'}
Minimum Salary: ${countryPreference.minimum_salary ?? 'Not set'} ${countryPreference.salary_currency ?? ''}
Remote Preference: ${countryPreference.remote_preference ? 'Yes' : 'No'}
Hybrid Preference: ${countryPreference.hybrid_preference ? 'Yes' : 'No'}
On-site Preference: ${countryPreference.onsite_preference ? 'Yes' : 'No'}

Score this job for this candidate now.`,
    },
  ];
}
