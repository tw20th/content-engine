//packages/strategy-openai-basic/src/openaiBasic.ts
import type { GenerateInput, GeneratedArticle, Strategy } from '@tw20th/content-engine';
import { generateJsonWithOpenAI } from '@tw20th/content-engine';

type ModelOutput = {
  topic: string;
  title: string;
  content: string;
};

const buildPrompt = (input: GenerateInput) => {
  // topic が与えられていても、より良いtopicに整えてOKにする
  return `
あなたは記事作成AIです。以下の条件で、必ずJSONだけを返してください。

# 返すJSON形式（必須）
{
  "topic": "string",
  "title": "string",
  "content": "string (Markdown)"
}

# 条件
- topic/title/content は日本語
- content は Markdown で、読みやすく見出しを含める
- 誇張や断定は避け、具体性とやさしさを重視
- 入力 draft がある場合は、内容を活かして整える（引用しすぎない）
- 出力は必ず有効なJSON。余計なテキストは禁止。

# 入力
topic: ${input.topic}
draft: ${input.draft ?? '(none)'}
channelId: ${input.channelId}
sourceId: ${input.sourceId}
`.trim();
};

export const openaiBasicStrategy: Strategy = {
  strategyId: 'openai-basic',
  generate: async (input: GenerateInput): Promise<GeneratedArticle> => {
    const nowIso = new Date().toISOString();

    const json = await generateJsonWithOpenAI<ModelOutput>({
      instructions: 'You are a helpful writing assistant.',
      input: buildPrompt(input),
    });

    return {
      topic: json.topic || input.topic,
      title: json.title,
      content: json.content,
      ids: {
        strategyId: 'openai-basic',
        sourceId: input.sourceId,
        channelId: input.channelId,
      },
      createdAt: nowIso,
    };
  },
};
