// packages/content-engine/src/types.ts
export type StrategyId = string;
export type SourceId = string;
export type ChannelId = string;

export type ContentEngineIds = {
  strategyId: StrategyId;
  sourceId: SourceId;
  channelId: ChannelId;
};

export type GenerateInput = {
  topic: string;
  sourceId: SourceId;
  channelId: ChannelId;

  draft?: string;
  product?: {
    id?: string;
    name?: string;
    affiliateUrl?: string;
  };
};

export type GeneratedArticleMeta = {
  strategyMetrics?: Record<string, unknown>;
};

export type GeneratedArticle = {
  topic: string;
  title: string;
  content: string;
  ids: ContentEngineIds;
  createdAt: string; // ISO
  meta?: GeneratedArticleMeta; // ✅ 追加（任意）
};

export type MaybePromise<T> = T | Promise<T>;

export type Strategy = {
  strategyId: StrategyId;
  generate: (input: GenerateInput) => MaybePromise<GeneratedArticle>;
};

export type SourceContext = {
  strategyId: StrategyId;
  channelId: ChannelId;
  nowIso: string;
};

export type SourcePayload = {
  topic: string;
  draft?: string;
  product?: {
    id?: string;
    name?: string;
    affiliateUrl?: string;
  };
};

export type Source = {
  sourceId: SourceId;
  prepare: (ctx: SourceContext) => SourcePayload;
};

export type Channel = {
  channelId: ChannelId;
  optimize: (article: GeneratedArticle) => GeneratedArticle;
};
