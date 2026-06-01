import type { AIMessage } from '../provider';

/**
 * Build the prompt messages for generating a follow‑up email.
 *
 * @param followUpType - Whether this is after submitting the application
 *                       or after an interview.
 * @returns An `AIMessage[]` ready for `AIProvider.complete()`.
 */
export function buildFollowUpPrompt(
  candidateName: string,
  jobTitle: string,
  company: string,
  applicationDate: string,
  followUpType: 'post_application' | 'post_interview' = 'post_application',
): AIMessage[] {
  const typeInstructions: Record<string, string> = {
    post_application: `This is a follow‑up after submitting an application.
- Politely inquire about the status of the application.
- Reaffirm interest in the role.
- Offer to provide additional information if needed.
- Keep it under 150 words.`,
    post_interview: `This is a follow‑up after an interview.
- Thank the interviewer(s) for their time.
- Briefly reference something specific discussed (leave a [PLACEHOLDER] for the candidate to fill in).
- Reaffirm enthusiasm for the role and the team.
- Keep it under 200 words.`,
  };

  return [
    {
      role: 'system',
      content: `You are a professional email writer.

TASK: Generate a short, polite, professional follow‑up email for a job application.

${typeInstructions[followUpType]}

TONE RULES:
- Professional but warm — not robotic.
- Confident but NOT desperate or pushy.
- Concise — respect the reader's time.
- Do NOT apologise for following up.
- Use a clear, specific subject line.

FORMAT:
Subject: <subject line>

<email body>

Best regards,
${candidateName}`,
    },
    {
      role: 'user',
      content: `Details:
- Candidate Name: ${candidateName}
- Job Title: ${jobTitle}
- Company: ${company}
- Application/Interview Date: ${applicationDate}
- Follow‑up Type: ${followUpType.replace(/_/g, ' ')}

Generate the follow‑up email now.`,
    },
  ];
}
