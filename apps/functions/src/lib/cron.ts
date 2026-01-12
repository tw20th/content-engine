// apps/functions/src/lib/cron.ts
import cronParser from 'cron-parser';

export const getNextRunDate = (cron: string, baseDate: Date): Date => {
  const interval = cronParser.parseExpression(cron, {
    currentDate: baseDate,
  });
  return interval.next().toDate();
};
