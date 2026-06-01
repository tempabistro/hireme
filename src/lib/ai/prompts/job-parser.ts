import type { AIMessage } from '../provider';

/**
 * Build the prompt messages for parsing a raw job description into
 * the structured {@link ParsedJobDescription} shape.
 *
 * @param rawDescription - The unstructured job description text.
 * @returns An `AIMessage[]` ready to pass to `AIProvider.completeJSON()`.
 */
export function buildJobParserPrompt(rawDescription: string): AIMessage[] {
  return [
    {
      role: 'system',
      content: `You are a strict, meticulous job description parser.

Your task is to extract structured JSON from a raw job posting.

RULES:
- Extract ONLY information explicitly stated in the text.
- Do NOT guess, infer, or fabricate any field.
- If a field is not mentioned, set its value to null (for strings/numbers) or [] (for arrays).
- For salary, extract exact numbers when stated; otherwise null.
- For skills, separate "must have" from "nice to have" carefully.
- Return a single JSON object matching this EXACT schema:

{
  "title": string,
  "company": string,
  "country": string | null,
  "city": string | null,
  "work_mode": "remote" | "hybrid" | "onsite" | null,
  "salary_min": number | null,
  "salary_max": number | null,
  "currency": string | null,
  "responsibilities": string[],
  "must_have_skills": string[],
  "nice_to_have_skills": string[],
  "tools": string[],
  "certifications": string[],
  "education": string | null,
  "years_experience": number | null,
  "visa_sponsorship": string | null,
  "work_authorisation": string | null,
  "seniority": string | null,
  "industry": string | null,
  "contract_type": "permanent" | "contract" | "freelance" | "internship" | null,
  "deadline": string | null,
  "risks": string[],
  "missing_information": string[]
}

For "title" and "company": always extract these even if you must use the most likely value from context. Never return null for these — use "Unknown" if truly absent.

For "risks": include red flags like unrealistic requirements, low salary, visa issues, etc.

For "missing_information": note what is NOT stated (e.g., "No salary information", "Remote policy unclear").

Return ONLY the JSON object, no additional text.`,
    },
    {
      role: 'user',
      content: `Parse the following job description:\n\n${rawDescription}`,
    },
  ];
}
