/**
 * Sensitive question detection for job applications.
 * These questions must NEVER be auto-answered — they always require explicit user input.
 */

const SENSITIVE_PATTERNS: { category: string; patterns: RegExp[] }[] = [
  {
    category: 'disability',
    patterns: [
      /\bdisabilit/i,
      /\bdisabled\b/i,
      /\breasonable\s+adjustment/i,
      /\baccess\s+needs/i,
      /\blong[\s-]term\s+(health|condition)/i,
    ],
  },
  {
    category: 'health',
    patterns: [
      /\bhealth\s+(condition|status|issue|problem)/i,
      /\bmedical\s+(condition|history|record)/i,
      /\bsick\s+days/i,
      /\bphysical\s+limitation/i,
    ],
  },
  {
    category: 'criminal_record',
    patterns: [
      /\bcriminal\s+(record|conviction|history|check|offence)/i,
      /\bDBS\s+check/i,
      /\bbackground\s+check/i,
      /\bunspent\s+conviction/i,
      /\bfelony/i,
      /\bmisdemean/i,
    ],
  },
  {
    category: 'immigration',
    patterns: [
      /\bimmigration\s+status/i,
      /\bvisa\s+(status|type|requirement)/i,
      /\bnational(ity|ities)/i,
      /\bcountry\s+of\s+(birth|origin)/i,
      /\bpassport/i,
      /\bright\s+to\s+(work|remain)/i,
      /\bwork\s+(permit|authoris|authoriz)/i,
    ],
  },
  {
    category: 'equal_opportunities',
    patterns: [
      /\bequal\s+opportunit/i,
      /\bdiversity\s+(monitoring|data|form|survey)/i,
      /\bequality\s+(monitoring|data|form)/i,
    ],
  },
  {
    category: 'gender',
    patterns: [
      /\bgender\b/i,
      /\bsex\b(?!\s*(year|month|day))/i,
      /\bpronouns?\b/i,
      /\btransgender/i,
      /\bnon[\s-]binary/i,
    ],
  },
  {
    category: 'ethnicity',
    patterns: [
      /\bethnic(ity)?\b/i,
      /\brace\b/i,
      /\bracial\b/i,
      /\bheritage\b/i,
    ],
  },
  {
    category: 'religion',
    patterns: [
      /\breligio(n|us)\b/i,
      /\bfaith\b/i,
      /\bbelief\b/i,
      /\bworship/i,
    ],
  },
  {
    category: 'political_views',
    patterns: [
      /\bpolitical\s+(view|opinion|affiliation|party|belief)/i,
      /\bparty\s+member/i,
    ],
  },
  {
    category: 'sponsorship',
    patterns: [
      /\bsponsorship\b/i,
      /\bsponsor\b/i,
      /\btier\s+\d/i,
      /\bskilled\s+worker\s+visa/i,
    ],
  },
  {
    category: 'work_authorisation',
    patterns: [
      /\bauthori[sz]ed?\s+to\s+work/i,
      /\beligib(le|ility)\s+to\s+work/i,
      /\blegal(ly)?\s+(able|permitted|entitled)\s+to\s+work/i,
      /\bwork\s+(eligib|right)/i,
    ],
  },
];

export interface SensitiveCheckResult {
  sensitive: boolean;
  category: string | null;
}

/**
 * Check whether a question touches on sensitive topics that require user input.
 */
export function isSensitiveQuestion(question: string): SensitiveCheckResult {
  for (const { category, patterns } of SENSITIVE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(question)) {
        return { sensitive: true, category };
      }
    }
  }
  return { sensitive: false, category: null };
}

/**
 * Get a user-facing warning for a sensitive question category.
 */
export function getSensitiveWarning(category: string): string {
  const warnings: Record<string, string> = {
    disability:
      'This question relates to disability. ApplyPilot AI will never answer disability-related questions automatically. Please provide your own response.',
    health:
      'This question relates to health or medical information. Please answer this question yourself.',
    criminal_record:
      'This question relates to criminal record or background checks. Please answer this question yourself.',
    immigration:
      'This question relates to immigration status. Please review and answer carefully.',
    equal_opportunities:
      'This is an equal opportunities monitoring question. Your response is voluntary. Please answer yourself.',
    gender:
      'This question relates to gender identity. Please provide your own response.',
    ethnicity:
      'This question relates to ethnicity or race. Please provide your own response.',
    religion:
      'This question relates to religion or beliefs. Please provide your own response.',
    political_views:
      'This question relates to political views. Please provide your own response.',
    sponsorship:
      'This question relates to visa sponsorship. Please confirm your sponsorship requirements.',
    work_authorisation:
      'This question relates to work authorisation. Please confirm your status.',
  };
  return warnings[category] || 'This question may be sensitive. Please review and answer yourself.';
}

/**
 * Get all sensitive categories.
 */
export function getSensitiveCategories(): string[] {
  return SENSITIVE_PATTERNS.map((p) => p.category);
}
