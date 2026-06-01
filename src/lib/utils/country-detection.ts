import { CountryPreference } from '@/lib/types';

/** City and location keywords mapped to country codes */
const COUNTRY_INDICATORS: Record<string, { cities: string[]; keywords: string[]; currencies: string[] }> = {
  GB: {
    cities: ['london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'edinburgh', 'bristol', 'liverpool', 'cardiff', 'belfast', 'oxford', 'cambridge', 'nottingham', 'sheffield', 'newcastle', 'york', 'bath', 'brighton', 'reading', 'southampton'],
    keywords: ['united kingdom', 'uk', 'england', 'scotland', 'wales', 'northern ireland', 'nhs', 'civil service', 'right to work in the uk', 'british'],
    currencies: ['gbp', '£'],
  },
  US: {
    cities: ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'san francisco', 'seattle', 'boston', 'denver', 'atlanta', 'miami', 'dallas', 'austin', 'san diego', 'portland', 'washington dc', 'san jose', 'minneapolis', 'philadelphia', 'detroit'],
    keywords: ['united states', 'usa', 'u.s.', 'u.s.a', 'america', 'authorized to work in the us', 'authorized to work in the united states', 'e-verify', 'h-1b', 'green card'],
    currencies: ['usd', '$'],
  },
  CA: {
    cities: ['toronto', 'vancouver', 'montreal', 'calgary', 'ottawa', 'edmonton', 'winnipeg', 'quebec city', 'hamilton', 'victoria', 'halifax', 'kitchener'],
    keywords: ['canada', 'canadian', 'ontario', 'british columbia', 'alberta', 'quebec', 'manitoba', 'saskatchewan', 'nova scotia', 'job bank'],
    currencies: ['cad', 'c$'],
  },
  DE: {
    cities: ['berlin', 'munich', 'hamburg', 'frankfurt', 'cologne', 'düsseldorf', 'stuttgart', 'dortmund', 'essen', 'leipzig', 'bremen', 'dresden', 'hannover', 'nuremberg'],
    keywords: ['germany', 'german', 'deutschland', 'bundesland', 'arbeitserlaubnis', 'aufenthaltserlaubnis'],
    currencies: ['eur', '€'],
  },
  IE: {
    cities: ['dublin', 'cork', 'galway', 'limerick', 'waterford'],
    keywords: ['ireland', 'irish', 'republic of ireland', 'eire'],
    currencies: ['eur', '€'],
  },
  NL: {
    cities: ['amsterdam', 'rotterdam', 'the hague', 'utrecht', 'eindhoven', 'groningen', 'tilburg'],
    keywords: ['netherlands', 'dutch', 'holland', 'nederland'],
    currencies: ['eur', '€'],
  },
  AU: {
    cities: ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'gold coast', 'canberra', 'hobart'],
    keywords: ['australia', 'australian', 'new south wales', 'victoria', 'queensland', 'western australia'],
    currencies: ['aud', 'a$'],
  },
};

/**
 * Detect the most likely country from job description text.
 */
export function detectCountryFromText(text: string): string | null {
  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [code, indicators] of Object.entries(COUNTRY_INDICATORS)) {
    let score = 0;

    for (const city of indicators.cities) {
      if (lowerText.includes(city)) {
        score += 3;
      }
    }

    for (const keyword of indicators.keywords) {
      if (lowerText.includes(keyword)) {
        score += 5;
      }
    }

    for (const currency of indicators.currencies) {
      if (lowerText.includes(currency)) {
        score += 2;
      }
    }

    if (score > 0) {
      scores[code] = score;
    }
  }

  // Check for remote indicators
  const remotePatterns = [
    /\bremote\s+(worldwide|global|anywhere|international)\b/i,
    /\bwork\s+from\s+anywhere\b/i,
    /\bfully\s+remote\b/i,
    /\blocation[\s-]independent\b/i,
  ];

  let isRemoteGlobal = false;
  for (const pattern of remotePatterns) {
    if (pattern.test(text)) {
      isRemoteGlobal = true;
      break;
    }
  }

  // If no country detected but remote global, return REMOTE
  const entries = Object.entries(scores);
  if (entries.length === 0) {
    return isRemoteGlobal ? 'REMOTE' : null;
  }

  // Return the country with the highest score
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Check if a job's country matches the user's selected countries.
 */
export function checkCountryMatch(
  jobCountry: string | null,
  userCountries: CountryPreference[]
): { match: boolean; reason: string } {
  if (!jobCountry) {
    return { match: false, reason: 'Job country could not be determined.' };
  }

  const activeCountries = userCountries.filter((c) => c.is_active);

  if (activeCountries.length === 0) {
    return { match: false, reason: 'No active countries configured.' };
  }

  // Direct match
  const directMatch = activeCountries.find(
    (c) => c.country_code.toUpperCase() === jobCountry.toUpperCase()
  );
  if (directMatch) {
    return { match: true, reason: `Job country matches selected country: ${directMatch.country_name}` };
  }

  // Remote global match — check if user has REMOTE active and job is remote
  const hasRemote = activeCountries.find((c) => c.country_code === 'REMOTE');
  if (hasRemote && jobCountry === 'REMOTE') {
    return { match: true, reason: 'Remote global job matches Remote Global preference.' };
  }

  return {
    match: false,
    reason: `Job country (${jobCountry}) does not match any active country: ${activeCountries.map((c) => c.country_name).join(', ')}.`,
  };
}

/**
 * Detect if a job description says "remote" but restricts to a specific country.
 */
export function detectRestrictedRemote(text: string): { restricted: boolean; restrictedTo: string | null } {
  const lowerText = text.toLowerCase();

  const restrictionPatterns = [
    { pattern: /remote\b.*?\bmust\s+be\s+(based|located)\s+in\s+the\s+(us|usa|united states)/i, country: 'US' },
    { pattern: /remote\b.*?\bmust\s+be\s+(based|located)\s+in\s+the\s+(uk|united kingdom)/i, country: 'GB' },
    { pattern: /remote\b.*?\bmust\s+be\s+(based|located)\s+in\s+canada/i, country: 'CA' },
    { pattern: /remote\b.*?\bmust\s+be\s+(based|located)\s+in\s+germany/i, country: 'DE' },
    { pattern: /remote\s+\(?(us|usa|united states)\s+only\)?/i, country: 'US' },
    { pattern: /remote\s+\(?(uk|united kingdom)\s+only\)?/i, country: 'GB' },
    { pattern: /remote\s+\(?canada\s+only\)?/i, country: 'CA' },
  ];

  for (const { pattern, country } of restrictionPatterns) {
    if (pattern.test(lowerText)) {
      return { restricted: true, restrictedTo: country };
    }
  }

  return { restricted: false, restrictedTo: null };
}
