export type OpenAIChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface OpenAIChatOptions {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface OpenAIChatResult {
  text: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/** Resolves the API key and base URL.
 *  Priority: GROQ_API_KEY → OPENAI_API_KEY (with optional OPENAI_BASE_URL override). */
function resolveProvider(): { apiKey: string; baseUrl: string } {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      apiKey: groqKey,
      baseUrl: (process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
    };
  }
  return {
    apiKey: requiredEnv('OPENAI_API_KEY'),
    baseUrl: (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
  };
}

export async function openAIChat(opts: OpenAIChatOptions): Promise<OpenAIChatResult> {
  const { apiKey, baseUrl } = resolveProvider();

  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 15000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 700,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`LLM error (${res.status}): ${txt || res.statusText}`);
    }

    const json = (await res.json()) as any;
    const text = String(json?.choices?.[0]?.message?.content ?? '').trim();
    const usage = json?.usage
      ? {
          inputTokens: json.usage.prompt_tokens,
          outputTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens,
        }
      : undefined;

    return { text, usage };
  } finally {
    clearTimeout(t);
  }
}
