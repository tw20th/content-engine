// apps/functions/src/types/content-engine.d.ts
declare module '@tw20th/content-engine' {
  export function bootstrapContentEngine(): void;

  export type RunResolvedInputUnresolved = {
    presetId?: string;
    strategyId?: string;
    sourceId?: string;
    channelId?: string;

    topic?: string;
    draft?: unknown;

    warnings?: string[];
    [k: string]: unknown;
  };

  export type GeneratedArticle = {
    ids: {
      blogId: string;
      [k: string]: string;
    };
    [k: string]: unknown;
  };

  export function runResolvedContentEngine(input: RunResolvedInputUnresolved): Promise<{
    article: GeneratedArticle;
    config: RunResolvedInputUnresolved;
  }>;
}
