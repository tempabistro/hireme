import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/lib/ai/factory';
import { buildJobParserPrompt } from '@/lib/ai/prompts/job-parser';
import type { ParsedJobDescription } from '@/lib/types';

/**
 * Strip HTML tags and decode entities to get clean text from a web page.
 */
function htmlToText(html: string): string {
  // Remove script/style blocks
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Convert common block elements to newlines
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|section|article|header|footer)[^>]*>/gi, '\n');
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&rsquo;/gi, "'");
  text = text.replace(/&lsquo;/gi, "'");
  text = text.replace(/&rdquo;/gi, '"');
  text = text.replace(/&ldquo;/gi, '"');
  text = text.replace(/&mdash;/gi, '—');
  text = text.replace(/&ndash;/gi, '–');
  text = text.replace(/&bull;/gi, '•');
  text = text.replace(/&#\d+;/gi, '');

  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();

  // Limit to ~15000 chars to stay within AI context limits
  if (text.length > 15000) {
    text = text.slice(0, 15000) + '\n\n[...truncated]';
  }

  return text;
}

/**
 * POST /api/jobs/import-url
 *
 * Fetches a job posting from a URL, extracts the text content,
 * uses AI to parse it into structured data, and saves it as a new job.
 *
 * Body: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Allow unauthenticated in preview mode
    const userId = user?.id ?? 'preview-user';

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // ── 1. Fetch the page ─────────────────────────────────────────
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: HTTP ${response.status}` },
          { status: 422 }
        );
      }

      html = await response.text();
    } catch (fetchErr) {
      return NextResponse.json(
        { error: `Could not fetch URL. The site may be blocking automated requests. Try pasting the job description text instead.` },
        { status: 422 }
      );
    }

    // ── 2. Extract text ───────────────────────────────────────────
    const rawText = htmlToText(html);

    if (rawText.length < 100) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the page. The site may require JavaScript. Try pasting the job description text instead.' },
        { status: 422 }
      );
    }

    // ── 3. AI Parse ───────────────────────────────────────────────
    let parsed: ParsedJobDescription;
    try {
      const ai = createAIProvider();
      const messages = buildJobParserPrompt(rawText);
      parsed = await ai.completeJSON<ParsedJobDescription>({
        messages,
        temperature: 0.1,
        responseFormat: 'json',
      });
    } catch {
      // If AI isn't configured, create a basic job from the text
      parsed = {
        title: 'Imported Job',
        company: parsedUrl.hostname.replace('www.', ''),
        country: null,
        city: null,
        work_mode: null,
        salary_min: null,
        salary_max: null,
        currency: null,
        responsibilities: [],
        must_have_skills: [],
        nice_to_have_skills: [],
        tools: [],
        certifications: [],
        education: null,
        years_experience: null,
        visa_sponsorship: null,
        work_authorisation: null,
        seniority: null,
        industry: null,
        contract_type: null,
        deadline: null,
        risks: [],
        missing_information: ['AI parsing unavailable — raw text imported only'],
      };
    }

    // ── 4. Save to database ───────────────────────────────────────
    const jobData = {
      user_id: userId,
      title: parsed.title || 'Untitled Job',
      company: parsed.company || parsedUrl.hostname,
      country: parsed.country,
      city: parsed.city,
      work_mode: parsed.work_mode,
      salary_min: parsed.salary_min,
      salary_max: parsed.salary_max,
      salary_currency: parsed.currency,
      source: parsedUrl.hostname,
      source_url: url,
      application_url: url,
      raw_description: rawText,
      parsed_description: parsed,
      responsibilities: parsed.responsibilities || [],
      requirements: parsed.must_have_skills || [],
      nice_to_have: parsed.nice_to_have_skills || [],
      seniority: parsed.seniority,
      industry: parsed.industry,
      contract_type: parsed.contract_type,
      deadline: parsed.deadline,
      date_found: new Date().toISOString().split('T')[0],
      status: 'parsed',
    };

    // Try to save to DB, fall back to returning data if DB not available
    try {
      const { data: saved, error: insertErr } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (insertErr) throw insertErr;
      return NextResponse.json({ job: saved, source: 'database' });
    } catch {
      // DB not available (preview mode) — return the parsed data directly
      return NextResponse.json({
        job: { id: `url_${Date.now()}`, ...jobData },
        source: 'preview',
      });
    }

  } catch (err) {
    console.error('URL import error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
