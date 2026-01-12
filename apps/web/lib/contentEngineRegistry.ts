// apps/web/lib/contentEngineRegistry.ts
import {
  bootstrapContentEngine,
  listChannels,
  listSources,
  listStrategies,
} from '@tw20th/content-engine';

export const initContentEngineRegistry = (): void => {
  bootstrapContentEngine();
};

export const getRegistryOptions = () => ({
  strategies: listStrategies(),
  sources: listSources(),
  channels: listChannels(),
});
