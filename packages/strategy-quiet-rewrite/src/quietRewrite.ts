import type { GenerateInput, GeneratedArticle, Strategy } from '@content-engine/core';

const nowIso = (): string => new Date().toISOString();

const buildTitle = (topic: string): string => {
  return `静かなリライト：${topic}`;
};

const buildContent = (topic: string, draft?: string): string => {
  const excerpt = draft ? draft.slice(0, 500) : '';

  return [
    `# ${buildTitle(topic)}`,
    ``,
    `## ちょっとだけ、息を整える`,
    `全部を理解しなくていい。今日は視点だけ持ち帰れれば十分。`,
    ``,
    `## 置いておく視点（1つだけ）`,
    `「何を優先するか」を1つ決めると、比較が少し楽になります。`,
    ``,
    `---`,
    `## 元の下書き（抜粋）`,
    excerpt || '（下書きがありません）',
    `---`,
    ``,
    `## 余白`,
    `また必要になったとき、ここに戻ってこれるように。`,
  ].join('\n');
};

export const quietRewriteStrategy: Strategy = {
  strategyId: 'quiet-rewrite',
  generate: (input: GenerateInput): GeneratedArticle => {
    const createdAt = nowIso();

    return {
      topic: input.topic,
      title: buildTitle(input.topic),
      content: buildContent(input.topic, input.draft),
      ids: {
        strategyId: 'quiet-rewrite',
        sourceId: input.sourceId,
        channelId: input.channelId,
      },
      createdAt,
    };
  },
};
