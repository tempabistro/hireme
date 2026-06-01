import type { AIMessage } from '../provider';
import type { CandidateProfile, Job, CountryConfig } from '@/lib/types';

/**
 * Build the prompt messages for generating a tailored cover letter.
 */
export function buildCoverLetterPrompt(
  profile: CandidateProfile,
  job: Job,
  countryConfig: CountryConfig,
  style: 'short' | 'standard' | 'expression_of_interest' = 'standard',
): AIMessage[] {
  const spelling = countryConfig.spelling_style === 'british' ? 'British English' :
    countryConfig.spelling_style === 'american' ? 'American English' :
    countryConfig.spelling_style === 'canadian' ? 'Canadian English' : 'Australian English';

  const lengthGuide = style === 'short' ? '150-250 words' :
    style === 'expression_of_interest' ? '200-350 words' : '300-450 words';

  return [
    {
      role: 'system',
      content: `You are an expert job application writer specialising in ${countryConfig.country_name} roles.

TASK: Write a ${style.replace('_', ' ')} cover letter (${lengthGuide}).

RULES:
1. Use ONLY verified facts from the candidate profile. NEVER invent experience.
2. Use ${spelling} spelling.
3. Make the letter specific to the company and role — no generic filler.
4. Do not repeat the ${countryConfig.document_label} word for word.
5. Highlight the candidate's most relevant experience for this specific role.
6. Mention matched criteria from the job description.
7. Flag any missing evidence at the end under "--- WARNINGS ---".
8. Keep the tone professional, confident, and concise.

FORMAT: Return clean text with proper letter formatting.`,
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

Write the ${style.replace('_', ' ')} cover letter now.`,
    },
  ];
}
