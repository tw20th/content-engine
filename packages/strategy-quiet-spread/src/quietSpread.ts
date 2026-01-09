import type { GenerateInput, GeneratedArticle, Strategy } from '@tw20th/content-engine';

const buildTitle = (topic: string): string => {
  return `静かな広がり：${topic}`;
};

const buildContent = (topic: string): string => {
  // ここは後で prompt に置き換える前提の“仮文章”
  return [
    `# ${buildTitle(topic)}`,
    ``,
    `## ちょっとだけ、共感から`,
    `疲れているときって、ちゃんと調べるのがいちばん大変だったりするよね。`,
    ``,
    `## 断片で受け取れるように`,
    `- 「全部理解しなくていい」`,
    `- 「今日はここまででもいい」`,
    `- 「また思い出せる形で残しておく」`,
    ``,
    `## 余白のまま置いておく`,
    `答えを急がず、視点だけそっと置いておく。`,
    `必要なときに、またここに戻ってこれるように。`,
  ].join('\n');
};

export const quietSpreadStrategy: Strategy = {
  strategyId: 'quiet-spread',
  generate: (input: GenerateInput): GeneratedArticle => {
    const now = new Date().toISOString();

    return {
      topic: input.topic, // ✅ 追加
      title: buildTitle(input.topic),
      content: buildContent(input.topic),
      ids: {
        strategyId: 'quiet-spread',
        sourceId: input.sourceId,
        channelId: input.channelId,
      },
      createdAt: now,
    };
  },
};
