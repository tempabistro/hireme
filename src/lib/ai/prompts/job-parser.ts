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
- If a field is not mentioned, set its value to null.
- For salary, extract exact numbers when stated; otherwise null.
- For skills, separate "required" from "nice to have" carefully.
- For visa_sponsorship, only set true/false if explicitly stated; otherwise null.
- Return a single JSON object matching this exact schema:

{
  "title": string | null,
  "company": string | null,
  "location": string | null,
  "country": string | null,
  "work_mode": "remote" | "hybrid" | "onsite" | null,
  "salary_min": number | null,
  "salary_max": number | null,
  "salary_currency": string | null,
  "seniority": string | null,
  "employment_type": string | null,
  "industry": string | null,
  "department": string | null,
  "required_skills": string[] | null,
  "nice_to_have_skills": string[] | null,
  "required_experience_years": number | null,
  "required_qualifications": string[] | null,
  "responsibilities": string[] | null,
  "benefits": string[] | null,
  "visa_sponsorship": boolean | null,
  "application_deadline": string | null,
  "application_url": string | null,
  "contact_email": string | null,
  "warnings": string[]
}

In the "warnings" array, include notes about:
- Missing critical information (e.g., "No salary information provided")
- Ambiguous requirements
- Anything that may need human verification

Return ONLY the JSON object, no additional text.`,
    },
    {
      role: 'user',
      content: `Parse the following job description:\n\n${rawDescription}`,
    },
  ];
}
