// apps/functions/src/index.ts
import { bootstrapContentEngine } from '@tw20th/content-engine';
import { registerStrategies } from './lib/registerStrategies';

registerStrategies();
bootstrapContentEngine();

export { tick } from './schedules/tick';
export { runDue } from './http/runDue';
