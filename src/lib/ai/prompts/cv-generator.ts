import type { AIMessage } from '../provider';
import type { CandidateProfile, Job, CountryConfig } from '@/lib/types';

/**
 * Build the prompt messages for generating a tailored CV / résumé.
 */
export function buildCVGeneratorPrompt(
  profile: CandidateProfile,
  job: Job,
  countryConfig: CountryConfig,
): AIMessage[] {
  const cvLabel = countryConfig.document_label;
  const spelling = countryConfig.spelling_style === 'british' ? 'British English' :
    countryConfig.spelling_style === 'american' ? 'American English' :
    countryConfig.spelling_style === 'canadian' ? 'Canadian English' : 'Australian English';

  return [
    {
      role: 'system',
      content: `You are an expert ${cvLabel} writer with deep knowledge of ${countryConfig.country_name} hiring conventions.

TASK: Generate a tailored ${cvLabel} for the candidate applying to the specified job.

RULES:
1. Use ONLY verified facts from the candidate's profile. NEVER invent experience, skills, or qualifications.
2. Use ${spelling} spelling throughout.
3. Follow ${countryConfig.country_name} ${cvLabel} conventions.
4. Include sections: Profile Summary, Core Skills, Professional Experience, Key Achievements, Tools & Methodologies, Education, Certifications.
5. Naturally weave in keywords from the job description where they genuinely match the candidate's experience.
6. Quantify achievements where possible (numbers, percentages, monetary values).
7. Keep the tone professional, concise, and results-oriented.
8. At the end, add a "--- WARNINGS ---" section listing:
   - Any required skills the candidate appears to lack.
   - Any qualifications the job requires that are missing from the profile.
   - Any areas where you had to omit detail due to insufficient profile data.

FORMAT: Return the ${cvLabel} as clean Markdown with clear section headings (##).`,
    },
    {
      role: 'user',
      content: `CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

TARGET JOB:
Title: ${job.title ?? 'Not specified'}
Company: ${job.company ?? 'Not specified'}
Country: ${job.country ?? countryConfig.country_code}
Description:
${job.raw_description ?? ''}

Generate the tailored ${cvLabel} now.`,
    },
  ];
}
