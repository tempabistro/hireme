import type { AIMessage } from '../provider';
import type { CandidateProfile, Job, CountryConfig } from '@/lib/types';

/**
 * Build the prompt for generating application question answers.
 */
export function buildAnswerPrompt(
  profile: CandidateProfile,
  job: Job,
  question: string,
  countryConfig: CountryConfig,
): AIMessage[] {
  const spelling = countryConfig.spelling_style === 'british' ? 'British English' :
    countryConfig.spelling_style === 'american' ? 'American English' :
    countryConfig.spelling_style === 'canadian' ? 'Canadian English' : 'Australian English';

  return [
    {
      role: 'system',
      content: `You are an application question assistant for ${countryConfig.country_name} job applications.

RULES:
1. Answer the question using ONLY verified candidate facts. NEVER invent experience.
2. Use ${spelling} spelling.
3. If the question is SENSITIVE (disability, health, criminal record, immigration, equal opportunities, gender, ethnicity, religion, political views, sponsorship, work authorisation), DO NOT answer it. Instead return:
   { "sensitive": true, "category": "<category>", "message": "This question requires your personal input." }
4. If there is not enough evidence in the profile to answer well, flag what information is missing.
5. Keep answers concise, professional, and evidence-based.
6. For behavioural questions, use the STARR format (Situation, Task, Action, Result, Reflection).

FORMAT: Return the answer as plain text. If sensitive, return JSON as described above.`,
    },
    {
      role: 'user',
      content: `CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

JOB:
Title: ${job.title ?? 'Not specified'}
Company: ${job.company ?? 'Not specified'}
Country: ${job.country ?? countryConfig.country_code}

QUESTION:
${question}

Answer this question now.`,
    },
  ];
}
