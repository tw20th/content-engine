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

  // ✅ 将来の素材（今は未使用でもOK）
  draft?: string; // rewrite用
  product?: {
    id?: string;
    name?: string;
    affiliateUrl?: string;
  }; // product用（最小）
};

export type GeneratedArticle = {
  topic: string; // ✅ 追加
  title: string;
  content: string; // markdown想定
  ids: ContentEngineIds;
  createdAt: string; // ISO
};

export type Strategy = {
  strategyId: StrategyId;
  /**
   * ここは最小の実装として、Strategyが「どう書くか」を返す関数だけ持つ
   * （後で prompt / structure / rules に拡張すればOK）
   */

  generate: (input: GenerateInput) => GeneratedArticle;
};

export type SourceContext = {
  strategyId: StrategyId;
  channelId: ChannelId;
  nowIso: string; // 生成タイミング（記録・分岐に使える）
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

  /**
   * Source責務：素材を用意する（topic等）
   * - topicが無いときにエンジン側で呼ばれる
   */
  prepare: (ctx: SourceContext) => SourcePayload;
};

export type Channel = {
  channelId: ChannelId;

  /**
   * Channel最適化：Strategyが生成した結果を“出し方”として整える
   * - Strategyは「どう書くか」
   * - Channelは「どう見せるか」
   */
  optimize: (article: GeneratedArticle) => GeneratedArticle;
};
