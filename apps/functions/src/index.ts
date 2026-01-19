// apps/functions/src/index.ts
import { setGlobalOptions } from 'firebase-functions/v2';
import { bootstrapContentEngine } from '@tw20th/content-engine';
import { registerStrategies } from './lib/registerStrategies';

setGlobalOptions({ region: 'asia-northeast1' });

bootstrapContentEngine();
registerStrategies();

// ✅ package 側の firebase 関数をそのまま export（経路一本化）
export { tick, runDue, runJob } from '@tw20th/content-engine/firebase';

// monthly
export { monthlyInsight, monthlyInsightDebug } from './schedules/monthlyInsight';
