//apps/functions/src/schedules/monthlyInsight.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

import { onRequest } from 'firebase-functions/v2/https';

import { runMonthlyPipeline } from '@tw20th/content-engine/monthly';

const REGION = 'asia-northeast1';
const TIME_ZONE = 'Asia/Tokyo';

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const NODE_AUTH_TOKEN = defineSecret('NODE_AUTH_TOKEN');

const toPrevMonth = (now: Date): string => {
  // JSTの「先月」を狙う（UTCズレしにくくて楽）
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-11
  const prev = new Date(y, m - 1, 1);

  const yy = prev.getFullYear();
  const mm = String(prev.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
};

export const monthlyInsight = onSchedule(
  {
    schedule: '0 6 1 * *', // 毎月1日 06:00
    timeZone: TIME_ZONE,
    region: REGION,
    secrets: [OPENAI_API_KEY, NODE_AUTH_TOKEN],
  },
  async () => {
    // content-engine が process.env を見る前提を満たす
    process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();
    process.env.NODE_AUTH_TOKEN ||= NODE_AUTH_TOKEN.value();

    const month = toPrevMonth(new Date());
    logger.info(`[monthlyInsight] start month=${month}`);

    await runMonthlyPipeline({ month, open: false });

    logger.info(`[monthlyInsight] done month=${month}`);
  },
);

export const monthlyInsightDebug = onRequest(
  {
    region: REGION,
    secrets: [OPENAI_API_KEY, NODE_AUTH_TOKEN],
  },
  async (req, res) => {
    // content-engine が process.env を見る前提を満たす
    process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();
    process.env.NODE_AUTH_TOKEN ||= NODE_AUTH_TOKEN.value();

    const monthParam = typeof req.query.month === 'string' ? req.query.month : null;
    const month =
      monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : toPrevMonth(new Date());

    logger.info(`[monthlyInsightDebug] start month=${month}`);

    await runMonthlyPipeline({ month, open: false });

    logger.info(`[monthlyInsightDebug] done month=${month}`);

    res.status(200).json({ ok: true, month });
  },
);
