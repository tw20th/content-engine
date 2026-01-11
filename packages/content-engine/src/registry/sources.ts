//packages/content-engine/src/registry/sources.ts
import type { Source, SourceId } from '../types';

const sources = new Map<SourceId, Source>();

export const registerSource = (source: Source): void => {
  sources.set(source.sourceId, source);
};

export const getSource = (sourceId: SourceId): Source => {
  const s = sources.get(sourceId);
  if (!s) {
    const available = [...sources.keys()].join(', ');
    throw new Error(`Source not found: "${sourceId}". Available: ${available || '(none)'}`);
  }
  return s;
};

export const listSources = (): SourceId[] => {
  return [...sources.keys()];
};
