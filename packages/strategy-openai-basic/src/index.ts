// packages/strategy-openai-basic/src/index.ts
import { registerStrategy } from '@tw20th/content-engine';
import { openaiBasicStrategy } from './openaiBasic.js';

export { openaiBasicStrategy };

export const registerOpenaiBasicStrategy = (): void => {
  registerStrategy(openaiBasicStrategy);
};
