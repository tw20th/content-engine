import type { Strategy, StrategyId } from '../types';

const strategies = new Map<StrategyId, Strategy>();

export const registerStrategy = (strategy: Strategy): void => {
  strategies.set(strategy.strategyId, strategy);
};

export const getStrategy = (strategyId: StrategyId): Strategy => {
  const s = strategies.get(strategyId);
  if (!s) {
    const available = [...strategies.keys()].join(', ');
    throw new Error(`Strategy not found: "${strategyId}". Available: ${available || '(none)'}`);
  }
  return s;
};

export const listStrategies = (): StrategyId[] => {
  return [...strategies.keys()];
};
