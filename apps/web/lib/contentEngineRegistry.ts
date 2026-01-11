// apps/web/lib/contentEngineRegistry.ts
import {
  listChannels,
  listSources,
  listStrategies,
  registerChannel,
  registerSource,
  registerStrategy,
} from '@tw20th/content-engine';

import { quietSpreadStrategy } from '@tw20th/strategy-quiet-spread';
import { seoBasicStrategy } from '@tw20th/strategy-seo-basic';
import { rewriteBasicStrategy } from '@tw20th/strategy-rewrite-basic';
import { quietRewriteStrategy } from '@tw20th/strategy-quiet-rewrite';
import { openaiBasicStrategy } from '@tw20th/strategy-openai-basic';

let initialized = false;

const clampTitle = (title: string, max: number): string => {
  if (title.length <= max) return title;
  return `${title.slice(0, Math.max(0, max - 1))}…`;
};

const stripSeoPrefix = (title: string): string => {
  // 例: 【結論】を外す（seo-basic用の癖を「seo channel」で整える）
  return title.replace(/^【結論】\s*/u, '');
};

const limitH2Sections = (md: string, maxSections: number): string => {
  // "## " 見出しで分割して、先頭（#タイトル等）+ maxSections個のセクションだけ残す
  const parts = md.split('\n## ');
  if (parts.length <= 1) return md; // H2が無い

  const head = parts[0]; // 先頭部分（#〜 と導入）
  const sections = parts.slice(1, 1 + Math.max(0, maxSections));

  return [head, ...sections.map((s) => `## ${s}`)].join('\n');
};

export const initContentEngineRegistry = (): void => {
  if (initialized) return;
  initialized = true;

  // Strategy
  registerStrategy(quietSpreadStrategy);
  registerStrategy(seoBasicStrategy);
  registerStrategy(rewriteBasicStrategy);
  registerStrategy(quietRewriteStrategy);
  registerStrategy(openaiBasicStrategy);

  // Source
  const ymdUtc = (iso: string): string => iso.slice(0, 10);

  const hashToIndex = (seed: string, modulo: number): number => {
    // シンプルなハッシュ（安定・軽い）
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return modulo === 0 ? 0 : h % modulo;
  };

  registerSource({
    sourceId: 'keywords',
    prepare: ({ strategyId, channelId, nowIso }) => {
      const topics = [
        '疲れないモバイルバッテリーの選び方',
        '持ち歩きが楽になるガジェット整理のコツ',
        '充電ストレスを減らすType-C生活の始め方',
        '外出先で困らない“予備電源”の考え方',
        '比較で疲れないための“見る順番”',
        'モバイルバッテリー選びで後悔しないチェック項目',
      ];

      const seed = `${ymdUtc(nowIso)}|${strategyId}|${channelId}`;
      const idx = hashToIndex(seed, topics.length);
      const topic = topics[idx] ?? '疲れない選び方';

      return { topic };
    },
  });

  // Channel: discover（余白寄りに“軽く”）
  registerChannel({
    channelId: 'discover',
    optimize: (article) => {
      const content = limitH2Sections(article.content, 2); // H2を最大2つまで
      return { ...article, content };
    },
  });

  // Channel: seo（タイトル整形だけ入れる）
  registerChannel({
    channelId: 'seo',
    optimize: (article) => {
      const normalized = stripSeoPrefix(article.title);
      const title = clampTitle(normalized, 32); // とりあえず32文字上限
      return { ...article, title };
    },
  });

  registerSource({
    sourceId: 'product',
    prepare: ({ nowIso }) => {
      // 仮データ（後でFirestoreや楽天/A8に差し替え）
      return {
        topic: '軽くて持ち歩きやすいモバイルバッテリーの選び方',
        product: {
          id: `demo-${nowIso.slice(0, 10)}`,
          name: 'デモ商品：軽量モバイルバッテリー',
          affiliateUrl: 'https://example.com',
        },
      };
    },
  });

  registerSource({
    sourceId: 'rewrite',
    prepare: () => {
      return {
        topic: '比較で疲れないための“見る順番”',
        draft: [
          'モバイルバッテリーって、情報が多すぎて疲れる。',
          'だから最初に「何を優先するか」を1つ決めるのが大事。',
          '重さ？ 速度？ それとも価格？',
          '順番さえ決めれば、比較はぐっと楽になる。',
        ].join('\n'),
      };
    },
  });
};

export const getRegistryOptions = (): {
  strategies: string[];
  sources: string[];
  channels: string[];
} => {
  return {
    strategies: listStrategies(),
    sources: listSources(),
    channels: listChannels(),
  };
};
