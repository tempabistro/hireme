import type { AIMessage } from '../provider';
import type { CandidateProfile, Job } from '@/lib/types';

/**
 * Build the prompt for generating a UK public sector supporting statement.
 */
export function buildSupportingStatementPrompt(
  profile: CandidateProfile,
  job: Job,
  wordCount: 500 | 750 | 1000 = 750,
): AIMessage[] {
  return [
    {
      role: 'system',
      content: `You are an expert UK public sector application writer.

TASK: Write a supporting statement of approximately ${wordCount} words.

RULES:
1. Map the candidate's verified experience to the essential criteria in the job description.
2. Use clear, specific evidence from the candidate profile. NEVER invent experience.
3. Use the STARR format (Situation, Task, Action, Result, Reflection) for behavioural examples.
4. Use British English spelling throughout.
5. Include relevant language for:
   - Project delivery and governance
   - Risk management and mitigation
   - Stakeholder management and engagement
   - Budget management and financial oversight
   - Assurance and quality control
   - Benefits realisation
6. Keep the tone professional, evidence-led, and concise.
7. Do not repeat the CV word for word — provide additional depth and context.
8. Flag any essential criteria where the candidate lacks clear evidence.

FORMAT: Return as clean formatted text with clear paragraph breaks.
At the end, add "--- WARNINGS ---" listing any essential criteria not fully evidenced.`,
    },
    {
      role: 'user',
      content: `CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

TARGET JOB:
Title: ${job.title ?? 'Not specified'}
Company: ${job.company ?? 'Not specified'}
Country: ${job.country ?? 'GB'}
Description:
${job.raw_description ?? ''}

Write the ${wordCount}-word supporting statement now.`,
    },
  ];
}
