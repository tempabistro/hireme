/**
 * @module AI Provider Interface
 *
 * Provider‑agnostic abstraction for LLM completions.
 * Implementations must handle their own HTTP transport, auth, and retries.
 */

/** A single message in a chat‑style completion request. */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Options for a completion call. */
export interface AICompletionOptions {
  /** The conversation / prompt messages. */
  messages: AIMessage[];
  /** Sampling temperature (0 = deterministic, 1 = creative). Default varies by provider. */
  temperature?: number;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Whether the response should be plain text or a valid JSON string. */
  responseFormat?: 'text' | 'json';
}

/**
 * Contract that every AI provider adapter must implement.
 *
 * This is the single dependency boundary between the application and
 * any LLM backend. Swap providers by changing `AI_PROVIDER` env var
 * — no other code needs to change.
 */
export interface AIProvider {
  /**
   * Send a chat completion request and return the raw text response.
   */
  complete(options: AICompletionOptions): Promise<string>;

  /**
   * Send a chat completion request, parse the response as JSON,
   * and return a typed object.
   *
   * @throws {Error} If the response is not valid JSON.
   */
  completeJSON<T>(options: AICompletionOptions): Promise<T>;
}
