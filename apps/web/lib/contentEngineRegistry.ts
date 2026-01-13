// apps/web/lib/contentEngineRegistry.ts
import {
  bootstrapContentEngine,
  listChannels,
  listSources,
  listStrategies,
  registerStrategy,
} from '@tw20th/content-engine';

// ✅ Turbopack が示した export 名に合わせる
import { quietSpreadStrategy } from '@tw20th/strategy-quiet-spread';
import { quietRewriteStrategy } from '@tw20th/strategy-quiet-rewrite';
import { rewriteBasicStrategy } from '@tw20th/strategy-rewrite-basic';
import { seoBasicStrategy } from '@tw20th/strategy-seo-basic';
import { openaiBasicStrategy } from '@tw20th/strategy-openai-basic';

let initialized = false;

export const initContentEngineRegistry = (): void => {
  if (initialized) return;
  initialized = true;

  bootstrapContentEngine();

  registerStrategy(quietSpreadStrategy);
  registerStrategy(quietRewriteStrategy);
  registerStrategy(rewriteBasicStrategy);
  registerStrategy(seoBasicStrategy);
  registerStrategy(openaiBasicStrategy);
};

export const getRegistryOptions = () => ({
  strategies: listStrategies(),
  sources: listSources(),
  channels: listChannels(),
});
