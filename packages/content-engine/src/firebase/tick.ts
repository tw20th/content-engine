//packages/content-engine/src/firebase/tick.ts
import { onRequest } from 'firebase-functions/v2/https';

export const tick = onRequest({ region: 'asia-northeast1' }, async (_req, res) => {
  res.status(200).json({ ok: true, message: 'tick ok', now: Date.now() });
});
