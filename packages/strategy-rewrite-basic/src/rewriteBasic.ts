import type { GenerateInput, GeneratedArticle, Strategy } from '@content-engine/core';

const nowIso = (): string => new Date().toISOString();

const buildTitle = (topic: string): string => {
  // SEO寄り：結論を先に
  return `【結論】${topic}`;
};

const buildContentFromDraft = (topic: string, draft: string): string => {
  const excerpt = draft.slice(0, 700);

  return [
    `# ${buildTitle(topic)}`,
    ``,
    `## リライト（要点だけに圧縮）`,
    `読み手が迷わないように、判断軸を3つだけ残して整えました。`,
    ``,
    `### まず決める（3つだけ）`,
    `- 容量（どれくらい必要？）`,
    `- 出力（急速充電したい？）`,
    `- 重さ（持ち歩き優先？）`,
    ``,
    `---`,
    `## 元の下書き（抜粋）`,
    excerpt,
    `---`,
    ``,
    `## まとめ`,
    `「容量・出力・重さ」のうち、先に1つだけ決めると比較で疲れにくいです。`,
  ].join('\n');
};

const buildContentNew = (topic: string): string => {
  return [
    `# ${buildTitle(topic)}`,
    ``,
    `## まず結論`,
    `迷ったら「容量・出力・重さ」の3つだけ見ればOKです。`,
    ``,
    `## 失敗しない順番`,
    `1) 何を優先するかを1つ決める`,
    `2) 条件で候補を絞る`,
    `3) 最後にレビューを見る`,
  ].join('\n');
};

export const rewriteBasicStrategy: Strategy = {
  strategyId: 'rewrite-basic',
  generate: (input: GenerateInput): GeneratedArticle => {
    const createdAt = nowIso();
    const hasDraft = typeof input.draft === 'string' && input.draft.trim().length > 0;

    const content = hasDraft
      ? buildContentFromDraft(input.topic, input.draft!)
      : buildContentNew(input.topic);

    return {
      topic: input.topic,
      title: hasDraft ? buildTitle(input.topic).replace(/^【結論】/u, '') : buildTitle(input.topic),
      content,
      ids: {
        strategyId: 'rewrite-basic',
        sourceId: input.sourceId,
        channelId: input.channelId,
      },
      createdAt,
    };
  },
};
