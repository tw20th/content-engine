//apps/functions/src/lib/initEngine.ts
import { logger } from 'firebase-functions';
import { bootstrapContentEngine } from '@tw20th/content-engine';
import { registerStrategies } from './registerStrategies';

let initialized = false;

export const initEngineOnce = (): void => {
  if (initialized) return;

  try {
    bootstrapContentEngine();
    registerStrategies();
    initialized = true;
    logger.info('[initEngineOnce] initialized');
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Unknown init error');
    logger.error('[initEngineOnce] failed', { message: err.message, stack: err.stack });
    throw err;
  }
};
