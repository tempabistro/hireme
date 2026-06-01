import type { AIProvider, AICompletionOptions } from './provider';

/**
 * OpenAI‑compatible adapter.
 *
 * Works with any endpoint that speaks the OpenAI Chat Completions API,
 * including Azure OpenAI, Hermes, LiteLLM proxies, and local models
 * served via vLLM / Ollama / LM Studio.
 */
export class OpenAIAdapter implements AIProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || '';
    this.model = model || process.env.AI_MODEL || 'gpt-4o';
    this.baseUrl = (baseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    );
  }

  // ── Public API ──────────────────────────────────────────────────────

  /** @inheritdoc */
  async complete(options: AICompletionOptions): Promise<string> {
    const body = this.buildRequestBody(options);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'unknown error');
      throw new Error(
        `AI completion failed (${res.status}): ${errorText}`,
      );
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    return content.trim();
  }

  /** @inheritdoc */
  async completeJSON<T>(options: AICompletionOptions): Promise<T> {
    const raw = await this.complete({
      ...options,
      responseFormat: 'json',
    });

    // Strip markdown code‑fencing that some models add around JSON.
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new Error(
        `AI response was not valid JSON. Raw response:\n${raw}`,
      );
    }
  }

  // ── Internals ───────────────────────────────────────────────────────

  private buildRequestBody(options: AICompletionOptions): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }
    if (options.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    return body;
  }
}
