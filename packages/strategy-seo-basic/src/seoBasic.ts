import type { GenerateInput, GeneratedArticle, Strategy } from '@content-engine/core';

const buildTitle = (topic: string): string => {
  return `【結論】${topic}`;
};

const buildContent = (topic: string, draft?: string): string => {
  if (!draft) {
    return `# 【結論】${topic}\n\n（先に）迷ったら「容量」「出力」「重さ」の3つだけ見ればOKです。\n`;
  }

  return [
    `# 【結論】${topic}`,
    ``,
    `## リライト（下書きから整えました）`,
    `下書きの要点を崩さず、読みやすく整えました。`,
    ``,
    `---`,
    `## 元の下書き（抜粋）`,
    draft.slice(0, 600), // 長すぎ防止
    `---`,
    ``,
    `## 整理して言い直すと`,
    `まず「何を優先するか」を1つ決めてから比較するのがいちばん疲れません。`,
    `（容量/出力/重さのうち、最初に1つだけ）`,
  ].join('\n');
};

export const seoBasicStrategy: Strategy = {
  strategyId: 'seo-basic',
  generate: (input: GenerateInput): GeneratedArticle => {
    const now = new Date().toISOString();

    return {
      topic: input.topic, // ✅ 追加
      title: buildTitle(input.topic),
      content: buildContent(input.topic, input.draft),
      ids: {
        strategyId: 'seo-basic',
        sourceId: input.sourceId,
        channelId: input.channelId,
      },
      createdAt: now,
    };
  },
};
