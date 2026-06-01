import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/lib/ai/factory';
import type { AIMessage } from '@/lib/ai/provider';

/**
 * POST /api/jobs/import-email
 *
 * Webhook endpoint for receiving forwarded job alert emails.
 * Works with SendGrid Inbound Parse, Mailgun Routes, or Postmark Inbound.
 *
 * Accepts:
 * - JSON body with { from, subject, text, html } (universal format)
 * - Or raw email text in the body
 *
 * The AI extracts one or more job listings from the email content
 * and saves each as a new job record.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let emailText = '';
    let subject = '';
    let from = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      emailText = body.text || body.html || body.body || '';
      subject = body.subject || '';
      from = body.from || body.sender || '';
    } else if (contentType.includes('multipart/form-data')) {
      // SendGrid Inbound Parse sends multipart
      const formData = await request.formData();
      emailText = (formData.get('text') as string) || (formData.get('html') as string) || '';
      subject = (formData.get('subject') as string) || '';
      from = (formData.get('from') as string) || '';
    } else {
      emailText = await request.text();
    }

    if (!emailText || emailText.length < 50) {
      return NextResponse.json(
        { error: 'Email content too short or empty' },
        { status: 400 }
      );
    }

    // Strip HTML if present
    let cleanText = emailText;
    if (cleanText.includes('<html') || cleanText.includes('<div') || cleanText.includes('<p>')) {
      cleanText = cleanText.replace(/<style[\s\S]*?<\/style>/gi, '');
      cleanText = cleanText.replace(/<script[\s\S]*?<\/script>/gi, '');
      cleanText = cleanText.replace(/<\/?(p|div|br|h[1-6]|li|tr)[^>]*>/gi, '\n');
      cleanText = cleanText.replace(/<[^>]+>/g, '');
      cleanText = cleanText.replace(/&nbsp;/gi, ' ');
      cleanText = cleanText.replace(/&amp;/gi, '&');
      cleanText = cleanText.replace(/[ \t]+/g, ' ');
      cleanText = cleanText.replace(/\n\s*\n/g, '\n\n');
      cleanText = cleanText.trim();
    }

    // Truncate if too long
    if (cleanText.length > 20000) {
      cleanText = cleanText.slice(0, 20000);
    }

    // ── AI: Extract jobs from email ─────────────────────────────
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a job listing extractor. You receive forwarded job alert emails and extract structured job data from them.

An email may contain one or more job listings. Extract ALL jobs found.

For each job, return:
{
  "title": string,
  "company": string,
  "country": string | null,
  "city": string | null,
  "work_mode": "remote" | "hybrid" | "onsite" | null,
  "salary_min": number | null,
  "salary_max": number | null,
  "currency": string | null,
  "source_url": string | null,
  "seniority": string | null,
  "industry": string | null,
  "contract_type": "permanent" | "contract" | "freelance" | "internship" | null,
  "raw_snippet": string (the relevant text excerpt for this job, max 2000 chars)
}

Return a JSON object: { "jobs": [...] }
If no jobs are found, return { "jobs": [] }
Return ONLY the JSON object.`,
      },
      {
        role: 'user',
        content: `EMAIL SUBJECT: ${subject || 'N/A'}
FROM: ${from || 'N/A'}

EMAIL BODY:
${cleanText}

Extract all job listings from this email.`,
      },
    ];

    interface ExtractedJob {
      title: string;
      company: string;
      country: string | null;
      city: string | null;
      work_mode: string | null;
      salary_min: number | null;
      salary_max: number | null;
      currency: string | null;
      source_url: string | null;
      seniority: string | null;
      industry: string | null;
      contract_type: string | null;
      raw_snippet: string;
    }

    let extractedJobs: ExtractedJob[] = [];

    try {
      const ai = createAIProvider();
      const result = await ai.completeJSON<{ jobs: ExtractedJob[] }>({
        messages,
        temperature: 0.1,
        responseFormat: 'json',
      });
      extractedJobs = result.jobs || [];
    } catch {
      return NextResponse.json(
        { error: 'AI provider not configured. Set AI_API_KEY in .env.local' },
        { status: 503 }
      );
    }

    if (extractedJobs.length === 0) {
      return NextResponse.json({
        message: 'No job listings found in this email',
        jobs: [],
      });
    }

    // ── Save to database ────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? 'email-import';

    const savedJobs = [];
    for (const ej of extractedJobs) {
      const jobData = {
        user_id: userId,
        title: ej.title || 'Untitled',
        company: ej.company || 'Unknown',
        country: ej.country,
        city: ej.city,
        work_mode: ej.work_mode,
        salary_min: ej.salary_min,
        salary_max: ej.salary_max,
        salary_currency: ej.currency,
        source: from ? `Email: ${from}` : 'Email import',
        source_url: ej.source_url,
        application_url: ej.source_url,
        raw_description: ej.raw_snippet || cleanText.slice(0, 3000),
        seniority: ej.seniority,
        industry: ej.industry,
        contract_type: ej.contract_type,
        date_found: new Date().toISOString().split('T')[0],
        status: 'new',
      };

      try {
        const { data: saved, error } = await supabase
          .from('jobs')
          .insert(jobData)
          .select()
          .single();

        if (error) throw error;
        savedJobs.push(saved);
      } catch {
        // DB not available — return the data directly
        savedJobs.push({ id: `email_${Date.now()}_${savedJobs.length}`, ...jobData });
      }
    }

    return NextResponse.json({
      message: `Extracted ${savedJobs.length} job(s) from email`,
      jobs: savedJobs,
    });

  } catch (err) {
    console.error('Email import error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
