// apps/functions/src/lib/registerStrategies.ts
import { registerStrategy } from '@tw20th/content-engine';

import { quietSpreadStrategy } from '@tw20th/strategy-quiet-spread';
import { quietRewriteStrategy } from '@tw20th/strategy-quiet-rewrite';
import { rewriteBasicStrategy } from '@tw20th/strategy-rewrite-basic';
import { seoBasicStrategy } from '@tw20th/strategy-seo-basic';
import { openaiBasicStrategy } from '@tw20th/strategy-openai-basic';

export const registerStrategies = (): void => {
  registerStrategy(quietSpreadStrategy);
  registerStrategy(quietRewriteStrategy);
  registerStrategy(rewriteBasicStrategy);
  registerStrategy(seoBasicStrategy);
  registerStrategy(openaiBasicStrategy);
};
