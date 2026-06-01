import type { AIProvider } from './provider';
import { OpenAIAdapter } from './openai-adapter';

/**
 * Create the correct AI provider based on the `AI_PROVIDER` environment variable.
 *
 * Supported values:
 *  - `"openai"` (default) — Uses the OpenAI Chat Completions endpoint.
 *  - `"hermes"` — Uses Hermes via an OpenAI‑compatible proxy endpoint.
 *
 * To add a new provider:
 *  1. Create an adapter implementing `AIProvider`.
 *  2. Add a `case` here.
 *  3. Set `AI_PROVIDER` in `.env.local`.
 */
export function createAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  switch (provider) {
    case 'hermes':
      // Hermes exposes an OpenAI‑compatible endpoint, so we reuse the same adapter
      // but with HERMES‑specific env overrides (AI_BASE_URL, AI_API_KEY, AI_MODEL).
      return new OpenAIAdapter();

    case 'openai':
    default:
      return new OpenAIAdapter();
  }
}
