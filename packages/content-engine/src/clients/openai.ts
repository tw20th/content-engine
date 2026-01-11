// packages/content-engine/src/clients/openai.ts
export type OpenAIJsonArgs = {
  instructions: string;
  input: string;
  model?: string;
};

type UnknownObj = Record<string, unknown>;

const ENDPOINT = 'https://api.openai.com/v1/responses';

const mustGetEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

const normalizeModel = (m: string): string => m.trim().toLowerCase();

/**
 * ```json ... ``` / ``` ... ``` を剥がす
 */
const stripCodeFence = (s: string): string => {
  const t = s.trim();
  if (!t.startsWith('```')) return t;

  const lines = t.split('\n');
  if (lines.length < 2) return t;

  // 末尾 ``` を落とす
  const last = lines[lines.length - 1]?.trim();
  if (last === '```') {
    return lines.slice(1, -1).join('\n').trim();
  }

  return t;
};

/**
 * 文章が混ざっても、最初の {..} か [..] を雑に抜く（JSON.parseが通る形に寄せる）
 */
const extractFirstJsonObjectOrArray = (s: string): string => {
  const t = stripCodeFence(s);

  const firstBrace = t.indexOf('{');
  const firstBracket = t.indexOf('[');

  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);

  if (start === -1) return t;

  const endBrace = t.lastIndexOf('}');
  const endBracket = t.lastIndexOf(']');

  const end = Math.max(endBrace, endBracket);
  if (end <= start) return t;

  return t.slice(start, end + 1).trim();
};

/**
 * Responses API / ChatCompletions API どちらの形でも “テキスト” を拾えるようにする
 */
const extractText = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  const d = data as UnknownObj;

  // 1) SDKっぽい便利フィールド（あるときだけ）
  const ot = d.output_text;
  if (typeof ot === 'string' && ot.trim()) return ot;

  // 2) Responses API: output[] の中に message/content が入る
  const output = d.output;
  if (Array.isArray(output)) {
    const texts: string[] = [];

    for (const item of output) {
      if (!item || typeof item !== 'object') continue;
      const it = item as UnknownObj;

      // item.content: [{ type: 'output_text', text: '...' }, ...]
      const content = it.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (!c || typeof c !== 'object') continue;
          const cc = c as UnknownObj;

          const type = cc.type;
          const text = cc.text;

          if (
            (type === 'output_text' || type === 'text') &&
            typeof text === 'string' &&
            text.trim()
          ) {
            texts.push(text);
          }
        }
      }

      // たまに item に直接 text がいることもある
      const directText = it.text;
      if (typeof directText === 'string' && directText.trim()) {
        texts.push(directText);
      }
    }

    const joined = texts.join('\n').trim();
    if (joined) return joined;
  }

  // 3) ChatCompletions 互換: choices[0].message.content
  const choices = d.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === 'object') {
    const c0 = choices[0] as UnknownObj;
    const msg = c0.message;
    if (msg && typeof msg === 'object') {
      const m = msg as UnknownObj;
      const content = m.content;
      if (typeof content === 'string' && content.trim()) return content;
    }
  }

  return null;
};

export const generateJsonWithOpenAI = async <T>(args: OpenAIJsonArgs): Promise<T> => {
  const apiKey = mustGetEnv('OPENAI_API_KEY');

  const modelRaw = args.model ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
  const model = normalizeModel(modelRaw);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: args.instructions,
      input: args.input,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }

  const data = (await res.json()) as unknown;
  const text = extractText(data);

  if (!text) {
    const raw = JSON.stringify(data).slice(0, 800);
    throw new Error(`OpenAI response missing text. raw=${raw}`);
  }

  const jsonText = extractFirstJsonObjectOrArray(text);

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error(`Failed to parse JSON from model output: ${text}`);
  }
};
