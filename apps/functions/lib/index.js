"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  monthlyInsight: () => monthlyInsight,
  monthlyInsightDebug: () => monthlyInsightDebug,
  runDue: () => runDue,
  runJob: () => runJob,
  tick: () => tick
});
module.exports = __toCommonJS(index_exports);
var import_v2 = require("firebase-functions/v2");

// ../../packages/content-engine/dist/registry/strategies.js
var strategies = /* @__PURE__ */ new Map();
var registerStrategy = (strategy) => {
  strategies.set(strategy.strategyId, strategy);
};
var getStrategy = (strategyId) => {
  const s = strategies.get(strategyId);
  if (!s) {
    const available = [...strategies.keys()].join(", ");
    throw new Error(`Strategy not found: "${strategyId}". Available: ${available || "(none)"}`);
  }
  return s;
};
var listStrategies = () => {
  return [...strategies.keys()];
};

// ../../packages/content-engine/dist/registry/sources.js
var sources = /* @__PURE__ */ new Map();
var registerSource = (source) => {
  sources.set(source.sourceId, source);
};
var listSources = () => {
  return [...sources.keys()];
};

// ../../packages/content-engine/dist/registry/channels.js
var channels = /* @__PURE__ */ new Map();
var registerChannel = (channel) => {
  channels.set(channel.channelId, channel);
};
var listChannels = () => {
  return [...channels.keys()];
};

// ../../packages/content-engine/dist/registry/presets.js
var ENGINE_PRESETS = [
  {
    presetId: "default",
    label: "default",
    description: "\u8FF7\u3063\u305F\u3089\u3053\u308C\uFF08\u9759\u304B\u306A\u5E83\u304C\u308A\uFF09",
    strategyId: "quiet-spread",
    sourceId: "keywords",
    channelId: "discover"
  },
  {
    presetId: "gentle-rewrite",
    label: "gentle-rewrite",
    description: "\u6574\u3048\u308B\uFF08\u9759\u304B\u306A\u30EA\u30E9\u30A4\u30C8\uFF09",
    strategyId: "quiet-rewrite",
    sourceId: "rewrite",
    channelId: "discover"
  },
  {
    presetId: "seo-push",
    label: "seo-push",
    description: "SEO\u5BC4\u308A\uFF08seo channel\u3067\u6574\u3048\u308B\uFF09",
    strategyId: "seo-basic",
    sourceId: "keywords",
    channelId: "seo"
  },
  {
    presetId: "openai-default",
    label: "openai-default",
    description: "ChatGPT\u3067\u751F\u6210\uFF08topic/title/content\uFF09",
    strategyId: "openai-basic",
    sourceId: "keywords",
    channelId: "discover"
  }
];
var presets = /* @__PURE__ */ new Map();
var registerPreset = (preset) => {
  presets.set(preset.presetId, preset);
};
var getPresetById = (presetId) => {
  if (!presetId)
    return null;
  return presets.get(presetId) ?? ENGINE_PRESETS.find((p) => p.presetId === presetId) ?? null;
};

// ../../packages/content-engine/dist/registry/resolve.js
var pickValid = (value, candidates) => {
  if (!value)
    return null;
  return candidates.includes(value) ? value : null;
};
var resolveEngineConfig = (input) => {
  const warnings = [];
  const strategies2 = listStrategies();
  const sources2 = listSources();
  const channels2 = listChannels();
  const preset = getPresetById(input.presetId);
  const rawStrategy = input.strategyId ?? preset?.strategyId;
  const rawSource = input.sourceId ?? preset?.sourceId;
  const rawChannel = input.channelId ?? preset?.channelId;
  const strategyId = pickValid(rawStrategy, strategies2) ?? strategies2[0] ?? "quiet-spread";
  const sourceId = pickValid(rawSource, sources2) ?? sources2[0] ?? "keywords";
  const channelId = pickValid(rawChannel, channels2) ?? channels2[0] ?? "discover";
  if (rawStrategy && rawStrategy !== strategyId)
    warnings.push(`Unknown strategyId: ${rawStrategy}`);
  if (rawSource && rawSource !== sourceId)
    warnings.push(`Unknown sourceId: ${rawSource}`);
  if (rawChannel && rawChannel !== channelId)
    warnings.push(`Unknown channelId: ${rawChannel}`);
  if (input.presetId && !preset)
    warnings.push(`Unknown presetId: ${input.presetId}`);
  return {
    presetId: preset?.presetId,
    strategyId,
    sourceId,
    channelId,
    warnings
  };
};

// ../../packages/content-engine/dist/clients/openai.js
var ENDPOINT = "https://api.openai.com/v1/responses";
var mustGetEnv = (key) => {
  const v = process.env[key];
  if (!v)
    throw new Error(`Missing env: ${key}`);
  return v;
};
var normalizeModel = (m) => m.trim().toLowerCase();
var stripCodeFence = (s) => {
  const t = s.trim();
  if (!t.startsWith("```"))
    return t;
  const lines = t.split("\n");
  if (lines.length < 2)
    return t;
  const last = lines[lines.length - 1]?.trim();
  if (last === "```") {
    return lines.slice(1, -1).join("\n").trim();
  }
  return t;
};
var extractFirstJsonObjectOrArray = (s) => {
  const t = stripCodeFence(s);
  const firstBrace = t.indexOf("{");
  const firstBracket = t.indexOf("[");
  const start = firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start === -1)
    return t;
  const endBrace = t.lastIndexOf("}");
  const endBracket = t.lastIndexOf("]");
  const end = Math.max(endBrace, endBracket);
  if (end <= start)
    return t;
  return t.slice(start, end + 1).trim();
};
var extractText = (data) => {
  if (!data || typeof data !== "object")
    return null;
  const d = data;
  const ot = d.output_text;
  if (typeof ot === "string" && ot.trim())
    return ot;
  const output = d.output;
  if (Array.isArray(output)) {
    const texts = [];
    for (const item of output) {
      if (!item || typeof item !== "object")
        continue;
      const it = item;
      const content = it.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (!c || typeof c !== "object")
            continue;
          const cc = c;
          const type = cc.type;
          const text = cc.text;
          if ((type === "output_text" || type === "text") && typeof text === "string" && text.trim()) {
            texts.push(text);
          }
        }
      }
      const directText = it.text;
      if (typeof directText === "string" && directText.trim()) {
        texts.push(directText);
      }
    }
    const joined = texts.join("\n").trim();
    if (joined)
      return joined;
  }
  const choices = d.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const c0 = choices[0];
    const msg = c0.message;
    if (msg && typeof msg === "object") {
      const m = msg;
      const content = m.content;
      if (typeof content === "string" && content.trim())
        return content;
    }
  }
  return null;
};
var generateJsonWithOpenAI = async (args) => {
  const apiKey = mustGetEnv("OPENAI_API_KEY");
  const modelRaw = args.model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const model = normalizeModel(modelRaw);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      instructions: args.instructions,
      input: args.input
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const text = extractText(data);
  if (!text) {
    const raw = JSON.stringify(data).slice(0, 800);
    throw new Error(`OpenAI response missing text. raw=${raw}`);
  }
  const jsonText = extractFirstJsonObjectOrArray(text);
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error(`Failed to parse JSON from model output: ${text}`);
  }
};

// ../../packages/content-engine/dist/bootstrap.js
var initialized = false;
var clampTitle = (title, max) => {
  if (title.length <= max)
    return title;
  return `${title.slice(0, Math.max(0, max - 1))}\u2026`;
};
var stripSeoPrefix = (title) => {
  return title.replace(/^【結論】\s*/u, "");
};
var limitH2Sections = (md, maxSections) => {
  const parts = md.split("\n## ");
  if (parts.length <= 1)
    return md;
  const head = parts[0];
  const sections = parts.slice(1, 1 + Math.max(0, maxSections));
  return [head, ...sections.map((s) => `## ${s}`)].join("\n");
};
var bootstrapContentEngine = () => {
  if (initialized)
    return;
  initialized = true;
  for (const p of ENGINE_PRESETS)
    registerPreset(p);
  const ymdUtc = (iso) => iso.slice(0, 10);
  const hashToIndex = (seed, modulo) => {
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) {
      h = h * 31 + seed.charCodeAt(i) >>> 0;
    }
    return modulo === 0 ? 0 : h % modulo;
  };
  registerSource({
    sourceId: "keywords",
    prepare: ({ strategyId, channelId, nowIso: nowIso3 }) => {
      const topics = [
        "\u75B2\u308C\u306A\u3044\u30E2\u30D0\u30A4\u30EB\u30D0\u30C3\u30C6\u30EA\u30FC\u306E\u9078\u3073\u65B9",
        "\u6301\u3061\u6B69\u304D\u304C\u697D\u306B\u306A\u308B\u30AC\u30B8\u30A7\u30C3\u30C8\u6574\u7406\u306E\u30B3\u30C4",
        "\u5145\u96FB\u30B9\u30C8\u30EC\u30B9\u3092\u6E1B\u3089\u3059Type-C\u751F\u6D3B\u306E\u59CB\u3081\u65B9",
        "\u5916\u51FA\u5148\u3067\u56F0\u3089\u306A\u3044\u201C\u4E88\u5099\u96FB\u6E90\u201D\u306E\u8003\u3048\u65B9",
        "\u6BD4\u8F03\u3067\u75B2\u308C\u306A\u3044\u305F\u3081\u306E\u201C\u898B\u308B\u9806\u756A\u201D",
        "\u30E2\u30D0\u30A4\u30EB\u30D0\u30C3\u30C6\u30EA\u30FC\u9078\u3073\u3067\u5F8C\u6094\u3057\u306A\u3044\u30C1\u30A7\u30C3\u30AF\u9805\u76EE"
      ];
      const seed = `${ymdUtc(nowIso3)}|${strategyId}|${channelId}`;
      const idx = hashToIndex(seed, topics.length);
      const topic = topics[idx] ?? "\u75B2\u308C\u306A\u3044\u9078\u3073\u65B9";
      return { topic };
    }
  });
  registerSource({
    sourceId: "product",
    prepare: ({ nowIso: nowIso3 }) => {
      return {
        topic: "\u8EFD\u304F\u3066\u6301\u3061\u6B69\u304D\u3084\u3059\u3044\u30E2\u30D0\u30A4\u30EB\u30D0\u30C3\u30C6\u30EA\u30FC\u306E\u9078\u3073\u65B9",
        product: {
          id: `demo-${nowIso3.slice(0, 10)}`,
          name: "\u30C7\u30E2\u5546\u54C1\uFF1A\u8EFD\u91CF\u30E2\u30D0\u30A4\u30EB\u30D0\u30C3\u30C6\u30EA\u30FC",
          affiliateUrl: "https://example.com"
        }
      };
    }
  });
  registerSource({
    sourceId: "rewrite",
    prepare: () => {
      return {
        topic: "\u6BD4\u8F03\u3067\u75B2\u308C\u306A\u3044\u305F\u3081\u306E\u201C\u898B\u308B\u9806\u756A\u201D",
        draft: [
          "\u30E2\u30D0\u30A4\u30EB\u30D0\u30C3\u30C6\u30EA\u30FC\u3063\u3066\u3001\u60C5\u5831\u304C\u591A\u3059\u304E\u3066\u75B2\u308C\u308B\u3002",
          "\u3060\u304B\u3089\u6700\u521D\u306B\u300C\u4F55\u3092\u512A\u5148\u3059\u308B\u304B\u300D\u30921\u3064\u6C7A\u3081\u308B\u306E\u304C\u5927\u4E8B\u3002",
          "\u91CD\u3055\uFF1F \u901F\u5EA6\uFF1F \u305D\u308C\u3068\u3082\u4FA1\u683C\uFF1F",
          "\u9806\u756A\u3055\u3048\u6C7A\u3081\u308C\u3070\u3001\u6BD4\u8F03\u306F\u3050\u3063\u3068\u697D\u306B\u306A\u308B\u3002"
        ].join("\n")
      };
    }
  });
  registerChannel({
    channelId: "discover",
    optimize: (article) => {
      const content = limitH2Sections(article.content, 2);
      return { ...article, content };
    }
  });
  registerChannel({
    channelId: "seo",
    optimize: (article) => {
      const normalized = stripSeoPrefix(article.title);
      const title = clampTitle(normalized, 32);
      return { ...article, title };
    }
  });
};

// ../../packages/strategy-quiet-spread/dist/quietSpread.js
var buildTitle = (topic) => {
  return `\u9759\u304B\u306A\u5E83\u304C\u308A\uFF1A${topic}`;
};
var buildContent = (topic) => {
  return [
    `# ${buildTitle(topic)}`,
    ``,
    `## \u3061\u3087\u3063\u3068\u3060\u3051\u3001\u5171\u611F\u304B\u3089`,
    `\u75B2\u308C\u3066\u3044\u308B\u3068\u304D\u3063\u3066\u3001\u3061\u3083\u3093\u3068\u8ABF\u3079\u308B\u306E\u304C\u3044\u3061\u3070\u3093\u5927\u5909\u3060\u3063\u305F\u308A\u3059\u308B\u3088\u306D\u3002`,
    ``,
    `## \u65AD\u7247\u3067\u53D7\u3051\u53D6\u308C\u308B\u3088\u3046\u306B`,
    `- \u300C\u5168\u90E8\u7406\u89E3\u3057\u306A\u304F\u3066\u3044\u3044\u300D`,
    `- \u300C\u4ECA\u65E5\u306F\u3053\u3053\u307E\u3067\u3067\u3082\u3044\u3044\u300D`,
    `- \u300C\u307E\u305F\u601D\u3044\u51FA\u305B\u308B\u5F62\u3067\u6B8B\u3057\u3066\u304A\u304F\u300D`,
    ``,
    `## \u4F59\u767D\u306E\u307E\u307E\u7F6E\u3044\u3066\u304A\u304F`,
    `\u7B54\u3048\u3092\u6025\u304C\u305A\u3001\u8996\u70B9\u3060\u3051\u305D\u3063\u3068\u7F6E\u3044\u3066\u304A\u304F\u3002`,
    `\u5FC5\u8981\u306A\u3068\u304D\u306B\u3001\u307E\u305F\u3053\u3053\u306B\u623B\u3063\u3066\u3053\u308C\u308B\u3088\u3046\u306B\u3002`
  ].join("\n");
};
var quietSpreadStrategy = {
  strategyId: "quiet-spread",
  generate: (input) => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      topic: input.topic,
      // ✅ 追加
      title: buildTitle(input.topic),
      content: buildContent(input.topic),
      ids: {
        strategyId: "quiet-spread",
        sourceId: input.sourceId,
        channelId: input.channelId
      },
      createdAt: now
    };
  }
};

// ../../packages/strategy-quiet-rewrite/dist/quietRewrite.js
var nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
var buildTitle2 = (topic) => {
  return `\u9759\u304B\u306A\u30EA\u30E9\u30A4\u30C8\uFF1A${topic}`;
};
var buildContent2 = (topic, draft) => {
  const excerpt = draft ? draft.slice(0, 500) : "";
  return [
    `# ${buildTitle2(topic)}`,
    ``,
    `## \u3061\u3087\u3063\u3068\u3060\u3051\u3001\u606F\u3092\u6574\u3048\u308B`,
    `\u5168\u90E8\u3092\u7406\u89E3\u3057\u306A\u304F\u3066\u3044\u3044\u3002\u4ECA\u65E5\u306F\u8996\u70B9\u3060\u3051\u6301\u3061\u5E30\u308C\u308C\u3070\u5341\u5206\u3002`,
    ``,
    `## \u7F6E\u3044\u3066\u304A\u304F\u8996\u70B9\uFF081\u3064\u3060\u3051\uFF09`,
    `\u300C\u4F55\u3092\u512A\u5148\u3059\u308B\u304B\u300D\u30921\u3064\u6C7A\u3081\u308B\u3068\u3001\u6BD4\u8F03\u304C\u5C11\u3057\u697D\u306B\u306A\u308A\u307E\u3059\u3002`,
    ``,
    `---`,
    `## \u5143\u306E\u4E0B\u66F8\u304D\uFF08\u629C\u7C8B\uFF09`,
    excerpt || "\uFF08\u4E0B\u66F8\u304D\u304C\u3042\u308A\u307E\u305B\u3093\uFF09",
    `---`,
    ``,
    `## \u4F59\u767D`,
    `\u307E\u305F\u5FC5\u8981\u306B\u306A\u3063\u305F\u3068\u304D\u3001\u3053\u3053\u306B\u623B\u3063\u3066\u3053\u308C\u308B\u3088\u3046\u306B\u3002`
  ].join("\n");
};
var quietRewriteStrategy = {
  strategyId: "quiet-rewrite",
  generate: (input) => {
    const createdAt = nowIso();
    return {
      topic: input.topic,
      title: buildTitle2(input.topic),
      content: buildContent2(input.topic, input.draft),
      ids: {
        strategyId: "quiet-rewrite",
        sourceId: input.sourceId,
        channelId: input.channelId
      },
      createdAt
    };
  }
};

// ../../packages/strategy-rewrite-basic/dist/rewriteBasic.js
var nowIso2 = () => (/* @__PURE__ */ new Date()).toISOString();
var buildTitle3 = (topic) => {
  return `\u3010\u7D50\u8AD6\u3011${topic}`;
};
var buildContentFromDraft = (topic, draft) => {
  const excerpt = draft.slice(0, 700);
  return [
    `# ${buildTitle3(topic)}`,
    ``,
    `## \u30EA\u30E9\u30A4\u30C8\uFF08\u8981\u70B9\u3060\u3051\u306B\u5727\u7E2E\uFF09`,
    `\u8AAD\u307F\u624B\u304C\u8FF7\u308F\u306A\u3044\u3088\u3046\u306B\u3001\u5224\u65AD\u8EF8\u30923\u3064\u3060\u3051\u6B8B\u3057\u3066\u6574\u3048\u307E\u3057\u305F\u3002`,
    ``,
    `### \u307E\u305A\u6C7A\u3081\u308B\uFF083\u3064\u3060\u3051\uFF09`,
    `- \u5BB9\u91CF\uFF08\u3069\u308C\u304F\u3089\u3044\u5FC5\u8981\uFF1F\uFF09`,
    `- \u51FA\u529B\uFF08\u6025\u901F\u5145\u96FB\u3057\u305F\u3044\uFF1F\uFF09`,
    `- \u91CD\u3055\uFF08\u6301\u3061\u6B69\u304D\u512A\u5148\uFF1F\uFF09`,
    ``,
    `---`,
    `## \u5143\u306E\u4E0B\u66F8\u304D\uFF08\u629C\u7C8B\uFF09`,
    excerpt,
    `---`,
    ``,
    `## \u307E\u3068\u3081`,
    `\u300C\u5BB9\u91CF\u30FB\u51FA\u529B\u30FB\u91CD\u3055\u300D\u306E\u3046\u3061\u3001\u5148\u306B1\u3064\u3060\u3051\u6C7A\u3081\u308B\u3068\u6BD4\u8F03\u3067\u75B2\u308C\u306B\u304F\u3044\u3067\u3059\u3002`
  ].join("\n");
};
var buildContentNew = (topic) => {
  return [
    `# ${buildTitle3(topic)}`,
    ``,
    `## \u307E\u305A\u7D50\u8AD6`,
    `\u8FF7\u3063\u305F\u3089\u300C\u5BB9\u91CF\u30FB\u51FA\u529B\u30FB\u91CD\u3055\u300D\u306E3\u3064\u3060\u3051\u898B\u308C\u3070OK\u3067\u3059\u3002`,
    ``,
    `## \u5931\u6557\u3057\u306A\u3044\u9806\u756A`,
    `1) \u4F55\u3092\u512A\u5148\u3059\u308B\u304B\u30921\u3064\u6C7A\u3081\u308B`,
    `2) \u6761\u4EF6\u3067\u5019\u88DC\u3092\u7D5E\u308B`,
    `3) \u6700\u5F8C\u306B\u30EC\u30D3\u30E5\u30FC\u3092\u898B\u308B`
  ].join("\n");
};
var rewriteBasicStrategy = {
  strategyId: "rewrite-basic",
  generate: (input) => {
    const createdAt = nowIso2();
    const hasDraft = typeof input.draft === "string" && input.draft.trim().length > 0;
    const content = hasDraft ? buildContentFromDraft(input.topic, input.draft) : buildContentNew(input.topic);
    return {
      topic: input.topic,
      title: hasDraft ? buildTitle3(input.topic).replace(/^【結論】/u, "") : buildTitle3(input.topic),
      content,
      ids: {
        strategyId: "rewrite-basic",
        sourceId: input.sourceId,
        channelId: input.channelId
      },
      createdAt
    };
  }
};

// ../../packages/strategy-seo-basic/dist/seoBasic.js
var buildTitle4 = (topic) => {
  return `\u3010\u7D50\u8AD6\u3011${topic}`;
};
var buildContent3 = (topic, draft) => {
  if (!draft) {
    return `# \u3010\u7D50\u8AD6\u3011${topic}

\uFF08\u5148\u306B\uFF09\u8FF7\u3063\u305F\u3089\u300C\u5BB9\u91CF\u300D\u300C\u51FA\u529B\u300D\u300C\u91CD\u3055\u300D\u306E3\u3064\u3060\u3051\u898B\u308C\u3070OK\u3067\u3059\u3002
`;
  }
  return [
    `# \u3010\u7D50\u8AD6\u3011${topic}`,
    ``,
    `## \u30EA\u30E9\u30A4\u30C8\uFF08\u4E0B\u66F8\u304D\u304B\u3089\u6574\u3048\u307E\u3057\u305F\uFF09`,
    `\u4E0B\u66F8\u304D\u306E\u8981\u70B9\u3092\u5D29\u3055\u305A\u3001\u8AAD\u307F\u3084\u3059\u304F\u6574\u3048\u307E\u3057\u305F\u3002`,
    ``,
    `---`,
    `## \u5143\u306E\u4E0B\u66F8\u304D\uFF08\u629C\u7C8B\uFF09`,
    draft.slice(0, 600),
    // 長すぎ防止
    `---`,
    ``,
    `## \u6574\u7406\u3057\u3066\u8A00\u3044\u76F4\u3059\u3068`,
    `\u307E\u305A\u300C\u4F55\u3092\u512A\u5148\u3059\u308B\u304B\u300D\u30921\u3064\u6C7A\u3081\u3066\u304B\u3089\u6BD4\u8F03\u3059\u308B\u306E\u304C\u3044\u3061\u3070\u3093\u75B2\u308C\u307E\u305B\u3093\u3002`,
    `\uFF08\u5BB9\u91CF/\u51FA\u529B/\u91CD\u3055\u306E\u3046\u3061\u3001\u6700\u521D\u306B1\u3064\u3060\u3051\uFF09`
  ].join("\n");
};
var seoBasicStrategy = {
  strategyId: "seo-basic",
  generate: (input) => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      topic: input.topic,
      // ✅ 追加
      title: buildTitle4(input.topic),
      content: buildContent3(input.topic, input.draft),
      ids: {
        strategyId: "seo-basic",
        sourceId: input.sourceId,
        channelId: input.channelId
      },
      createdAt: now
    };
  }
};

// ../../packages/strategy-openai-basic/dist/openaiBasic.js
var buildPrompt = (input) => {
  return `
\u3042\u306A\u305F\u306F\u8A18\u4E8B\u4F5C\u6210AI\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u6761\u4EF6\u3067\u3001\u5FC5\u305AJSON\u3060\u3051\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\u3002

# \u8FD4\u3059JSON\u5F62\u5F0F\uFF08\u5FC5\u9808\uFF09
{
  "topic": "string",
  "title": "string",
  "content": "string (Markdown)"
}

# \u6761\u4EF6
- topic/title/content \u306F\u65E5\u672C\u8A9E
- content \u306F Markdown \u3067\u3001\u8AAD\u307F\u3084\u3059\u304F\u898B\u51FA\u3057\u3092\u542B\u3081\u308B
- \u8A87\u5F35\u3084\u65AD\u5B9A\u306F\u907F\u3051\u3001\u5177\u4F53\u6027\u3068\u3084\u3055\u3057\u3055\u3092\u91CD\u8996
- \u5165\u529B draft \u304C\u3042\u308B\u5834\u5408\u306F\u3001\u5185\u5BB9\u3092\u6D3B\u304B\u3057\u3066\u6574\u3048\u308B\uFF08\u5F15\u7528\u3057\u3059\u304E\u306A\u3044\uFF09
- \u51FA\u529B\u306F\u5FC5\u305A\u6709\u52B9\u306AJSON\u3002\u4F59\u8A08\u306A\u30C6\u30AD\u30B9\u30C8\u306F\u7981\u6B62\u3002

# \u5165\u529B
topic: ${input.topic}
draft: ${input.draft ?? "(none)"}
channelId: ${input.channelId}
sourceId: ${input.sourceId}
`.trim();
};
var openaiBasicStrategy = {
  strategyId: "openai-basic",
  generate: async (input) => {
    const nowIso3 = (/* @__PURE__ */ new Date()).toISOString();
    const json = await generateJsonWithOpenAI({
      instructions: "You are a helpful writing assistant.",
      input: buildPrompt(input)
    });
    return {
      topic: json.topic || input.topic,
      title: json.title,
      content: json.content,
      ids: {
        strategyId: "openai-basic",
        sourceId: input.sourceId,
        channelId: input.channelId
      },
      createdAt: nowIso3
    };
  }
};

// src/lib/registerStrategies.ts
var registered = false;
var registerStrategies = () => {
  if (registered) return;
  registered = true;
  registerStrategy(quietSpreadStrategy);
  registerStrategy(quietRewriteStrategy);
  registerStrategy(rewriteBasicStrategy);
  registerStrategy(seoBasicStrategy);
  registerStrategy(openaiBasicStrategy);
};

// ../../packages/content-engine/dist/firebase/tick.js
var import_https = require("firebase-functions/v2/https");
var tick = (0, import_https.onRequest)({ region: "asia-northeast1" }, async (_req, res) => {
  res.status(200).json({ ok: true, message: "tick ok", now: Date.now() });
});

// ../../packages/content-engine/dist/firebase/runDue.js
var import_https2 = require("firebase-functions/v2/https");
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var getAdminDb = () => {
  if ((0, import_app.getApps)().length === 0)
    (0, import_app.initializeApp)();
  return (0, import_firestore.getFirestore)();
};
var runDue = (0, import_https2.onRequest)({ region: "asia-northeast1" }, async (_req, res) => {
  const now = Date.now();
  try {
    const db = getAdminDb();
    const snap = await db.collection("scheduledJobs").where("nextRunAt", "<=", now).limit(20).get();
    if (snap.empty) {
      res.status(200).json({ ok: true, processed: 0, now });
      return;
    }
    const batch = db.batch();
    snap.docs.forEach((doc) => {
      const job = doc.data();
      const runRef = db.collection("runs").doc();
      batch.set(runRef, {
        jobId: doc.id,
        createdAt: now,
        status: "queued",
        strategyId: job.strategyId ?? "",
        payload: job.payload ?? {}
      });
      batch.update(doc.ref, {
        nextRunAt: now + 5 * 60 * 1e3,
        updatedAt: now
      });
    });
    await batch.commit();
    res.status(200).json({ ok: true, processed: snap.size, now });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ ok: false, error: msg, now });
  }
});

// ../../packages/content-engine/dist/firebase/runJob.js
var import_https3 = require("firebase-functions/v2/https");
var import_app2 = require("firebase-admin/app");
var import_firestore2 = require("firebase-admin/firestore");
var getAdminDb2 = () => {
  if ((0, import_app2.getApps)().length === 0)
    (0, import_app2.initializeApp)();
  return (0, import_firestore2.getFirestore)();
};
var asGenerateInput = (payload) => {
  if (!payload || typeof payload !== "object")
    return {};
  return payload;
};
var runJob = (0, import_https3.onRequest)({ region: "asia-northeast1" }, async (_req, res) => {
  const db = getAdminDb2();
  const now = Date.now();
  let ref = null;
  let runId = null;
  try {
    const snap = await db.collection("runs").where("status", "==", "queued").orderBy("createdAt", "asc").limit(1).get();
    if (snap.empty) {
      res.status(200).json({ ok: true, processed: 0, now });
      return;
    }
    const doc = snap.docs[0];
    ref = doc.ref;
    runId = doc.id;
    const runData = await db.runTransaction(async (tx) => {
      const cur = await tx.get(doc.ref);
      const data = cur.data() ?? {};
      if (data.status !== "queued")
        return null;
      tx.update(doc.ref, {
        status: "processing",
        startedAt: data.startedAt ?? now,
        updatedAt: now,
        error: ""
      });
      return data;
    });
    if (!runData) {
      res.status(200).json({ ok: true, processed: 0, now, skipped: true });
      return;
    }
    const strategyIdRaw = runData.strategyId ?? "";
    const payloadPartial = asGenerateInput(runData.payload);
    const configSnap = await db.collection("contentEngineConfig").doc("current").get();
    const configData = configSnap.exists ? configSnap.data() : void 0;
    const activePresetId = configData?.activePresetId && configData.activePresetId.trim() ? configData.activePresetId.trim() : null;
    const payloadPresetId = typeof payloadPartial.presetId === "string" ? (payloadPartial.presetId ?? "").trim() : "";
    const presetId = payloadPresetId || activePresetId || void 0;
    const resolved = resolveEngineConfig({
      presetId,
      strategyId: strategyIdRaw || void 0,
      sourceId: payloadPartial.sourceId,
      channelId: payloadPartial.channelId
    });
    const strategy = getStrategy(resolved.strategyId);
    if (!strategy) {
      const msg = `Strategy not found: "${resolved.strategyId}". Available: (${[]})`;
      await doc.ref.update({
        status: "error",
        finishedAt: Date.now(),
        updatedAt: Date.now(),
        error: msg,
        result: null,
        resolved: {
          strategyId: resolved.strategyId,
          sourceId: resolved.sourceId,
          channelId: resolved.channelId,
          presetId: resolved.presetId ?? "",
          warnings: resolved.warnings
        }
      });
      res.status(200).json({ ok: false, processed: 1, runId, error: msg, now: Date.now() });
      return;
    }
    const input = {
      topic: payloadPartial.topic ?? "\u30C6\u30B9\u30C8\u8A18\u4E8B",
      draft: payloadPartial.draft,
      sourceId: resolved.sourceId,
      channelId: resolved.channelId
    };
    const result = await strategy.generate(input);
    await doc.ref.update({
      status: "success",
      finishedAt: Date.now(),
      updatedAt: Date.now(),
      error: "",
      result,
      resolved: {
        strategyId: resolved.strategyId,
        sourceId: resolved.sourceId,
        channelId: resolved.channelId,
        presetId: resolved.presetId ?? "",
        warnings: resolved.warnings
      }
    });
    res.status(200).json({
      ok: true,
      processed: 1,
      runId,
      strategyId: resolved.strategyId,
      resolvedPresetId: resolved.presetId ?? "",
      warnings: resolved.warnings,
      title: result.title,
      now: Date.now()
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (ref) {
      try {
        await ref.update({
          status: "error",
          finishedAt: Date.now(),
          updatedAt: Date.now(),
          error: msg,
          result: null
        });
      } catch {
      }
    }
    res.status(500).json({ ok: false, runId, error: msg, now: Date.now() });
  }
});

// src/schedules/monthlyInsight.ts
var import_scheduler = require("firebase-functions/v2/scheduler");
var import_firebase_functions = require("firebase-functions");
var import_params = require("firebase-functions/params");
var import_https4 = require("firebase-functions/v2/https");

// ../../packages/content-engine/dist/cli/monthly.js
var import_node_fs4 = __toESM(require("node:fs"), 1);
var import_node_child_process = require("node:child_process");

// ../../packages/content-engine/dist/cli/monthlyCheck.js
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);

// ../../packages/content-engine/dist/cli/firebaseAdmin.js
var import_app3 = require("firebase-admin/app");
var import_firestore3 = require("firebase-admin/firestore");
var hasCertEnv = () => !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY;
var getAdminDb3 = () => {
  if ((0, import_app3.getApps)().length === 0) {
    if (hasCertEnv()) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
      (0, import_app3.initializeApp)({
        credential: (0, import_app3.cert)({ projectId, clientEmail, privateKey })
      });
    } else {
      (0, import_app3.initializeApp)();
    }
  }
  return (0, import_firestore3.getFirestore)();
};

// ../../packages/content-engine/dist/cli/monthlyCheck.js
var monthRangeYmd = (month) => {
  const [y, m] = month.split("-").map((v) => Number(v));
  const start = `${month}-01`;
  const endDate = new Date(Date.UTC(y, m, 0));
  const end = `${month}-${String(endDate.getUTCDate()).padStart(2, "0")}`;
  return { start, end };
};
var inc = (map, key) => {
  map[key] = (map[key] ?? 0) + 1;
};
var topEntries = (map) => Object.entries(map).sort((a, b) => b[1] - a[1]);
var fetchRuns = async (startYmd, endYmd) => {
  const db = getAdminDb3();
  const startIso = `${startYmd}T00:00:00.000Z`;
  const endIso = `${endYmd}T23:59:59.999Z`;
  const snap = await db.collection("contentEngineRuns").where("savedAt", ">=", startIso).where("savedAt", "<=", endIso).get();
  return snap.docs.map((d) => d.data());
};
var buildMonthlyReport = async (month) => {
  const { start, end } = monthRangeYmd(month);
  const docs = await fetchRuns(start, end);
  const byStrategy = {};
  const bySource = {};
  const byChannel = {};
  const byTopic = {};
  const combos = {};
  for (const doc of docs) {
    const strategyId = doc.strategyId ?? "unknown";
    const sourceId = doc.sourceId ?? "unknown";
    const channelId = doc.channelId ?? "unknown";
    const topic = doc.topic ?? "(no-topic)";
    inc(byStrategy, strategyId);
    inc(bySource, sourceId);
    inc(byChannel, channelId);
    inc(byTopic, topic);
    const comboKey = `${strategyId} | ${sourceId} | ${channelId}`;
    if (!combos[comboKey])
      combos[comboKey] = { count: 0, samples: [] };
    combos[comboKey].count += 1;
    if (doc.title) {
      const arr = combos[comboKey].samples;
      if (!arr.includes(doc.title) && arr.length < 3)
        arr.push(doc.title);
    }
  }
  const topCombos = Object.entries(combos).map(([key, v]) => ({ key, count: v.count, samples: v.samples })).sort((a, b) => b.count - a.count).slice(0, 12);
  const topTopics = topEntries(byTopic).slice(0, 12).map(([topic, count]) => ({ topic, count }));
  return {
    month,
    range: { startYmd: start, endYmd: end },
    docsCount: docs.length,
    byStrategy: topEntries(byStrategy).map(([id, count]) => ({ id, count })),
    bySource: topEntries(bySource).map(([id, count]) => ({ id, count })),
    byChannel: topEntries(byChannel).map(([id, count]) => ({ id, count })),
    topCombos,
    topTopics,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
};
var printReportText = (report) => {
  console.log(`[content-engine] Monthly check: ${report.month}`);
  console.log(`Range (ymd): ${report.range.startYmd} .. ${report.range.endYmd}`);
  console.log("");
  console.log(`Docs: ${report.docsCount}`);
  console.log("");
  const printBlock = (title, list) => {
    console.log(`== ${title} ==`);
    for (const row of list) {
      console.log(`- ${row.id}: ${row.count}`);
    }
    console.log("");
  };
  printBlock("By Strategy", report.byStrategy);
  printBlock("By Source", report.bySource);
  printBlock("By Channel", report.byChannel);
  console.log("== Top combos (strategy | source | channel) ==");
  for (const c of report.topCombos) {
    console.log(`- ${c.key}: ${c.count}`);
    if (c.samples.length) {
      console.log(`  samples: ${c.samples.join(" / ")}`);
    }
  }
  console.log("");
  console.log("== Top topics ==");
  for (const t of report.topTopics) {
    console.log(`- ${t.topic}: ${t.count}`);
  }
  console.log("");
};
var writeJson = (outPath, obj) => {
  const abs = import_node_path.default.isAbsolute(outPath) ? outPath : import_node_path.default.join(process.cwd(), outPath);
  import_node_fs.default.mkdirSync(import_node_path.default.dirname(abs), { recursive: true });
  import_node_fs.default.writeFileSync(abs, JSON.stringify(obj, null, 2), "utf8");
  return abs;
};

// ../../packages/content-engine/dist/cli/buildInsight.js
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var readJson = (p) => {
  const abs = import_node_path2.default.isAbsolute(p) ? p : import_node_path2.default.join(process.cwd(), p);
  return JSON.parse(import_node_fs2.default.readFileSync(abs, "utf8"));
};
var writeJson2 = (p, obj) => {
  const abs = import_node_path2.default.isAbsolute(p) ? p : import_node_path2.default.join(process.cwd(), p);
  import_node_fs2.default.mkdirSync(import_node_path2.default.dirname(abs), { recursive: true });
  import_node_fs2.default.writeFileSync(abs, JSON.stringify(obj, null, 2), "utf8");
  return abs;
};
var top1 = (list) => list?.[0] ? `${list[0].id} (${list[0].count})` : "-";
var buildInsightFromReport = (report) => {
  const topChannel = top1(report.byChannel);
  const topSource = top1(report.bySource);
  const topStrategy = top1(report.byStrategy);
  const topCombo = report.topCombos?.[0] ? `${report.topCombos[0].key} (${report.topCombos[0].count})` : "-";
  const topTopic = report.topTopics?.[0] ? `${report.topTopics[0].topic} (${report.topTopics[0].count})` : "-";
  return {
    summary: { feeling: "quiet" },
    observations: [
      `\u4E3B\u6226\u5834\u306F ${topChannel}\u3002`,
      `\u7D20\u6750\u306F ${topSource} \u304C\u5F37\u3044\u3002`,
      `\u6226\u7565\u306F ${topStrategy} \u304C\u81EA\u7136\u306B\u6B8B\u3063\u3066\u3044\u308B\u3002`,
      `\u3044\u3061\u3070\u3093\u5F37\u3044\u7D44\u307F\u5408\u308F\u305B\u306F ${topCombo}\u3002`,
      `topic \u306F ${topTopic} \u306B\u53CE\u675F\u3057\u3066\u3044\u305F\u3002`
    ],
    decisions: ["\uFF08\u6765\u6708\u3084\u308B\u3053\u3068\u30921\u3064\u3060\u3051\u66F8\u304F\uFF09"],
    experiments: ["\uFF08\u8A66\u3059\u3053\u3068\u304C\u3042\u308C\u30701\u3064\u3060\u3051\uFF09"],
    stopDoing: ["\uFF08\u3084\u3081\u308B\u3053\u3068\u304C\u3042\u308C\u30701\u3064\u3060\u3051\uFF09"],
    notes: "\u5206\u6790\u306F\u6B63\u89E3\u3092\u6C7A\u3081\u308B\u305F\u3081\u3067\u306F\u306A\u304F\u3001\u6B21\u306B\u4F55\u3092\u8A66\u3059\u304B\u3092\u6C7A\u3081\u308B\u305F\u3081\u3002\u6570\u5B57\u3088\u308A\u3082\u75B2\u308C\u306A\u3055\u3092\u512A\u5148\u3059\u308B\u3002"
  };
};
var readReportFile = (reportPath) => readJson(reportPath);

// ../../packages/content-engine/dist/cli/writeMonthlyInsight.js
var import_node_fs3 = __toESM(require("node:fs"), 1);
var import_node_path3 = __toESM(require("node:path"), 1);
var defaultPayload = (month) => ({
  month,
  summary: { feeling: "quiet" },
  observations: ["\uFF08\u3053\u3053\u306B\u4ECA\u6708\u306E\u89B3\u6E2C\u3092\u66F8\u304F\uFF09"],
  decisions: ["\uFF08\u6765\u6708\u3084\u308B\u3053\u3068\u30921\u3064\u3060\u3051\u66F8\u304F\uFF09"],
  experiments: ["\uFF08\u8A66\u3059\u3053\u3068\u304C\u3042\u308C\u30701\u3064\u3060\u3051\uFF09"],
  stopDoing: ["\uFF08\u3084\u3081\u308B\u3053\u3068\u304C\u3042\u308C\u30701\u3064\u3060\u3051\uFF09"],
  notes: "\u5206\u6790\u306F\u6B63\u89E3\u3092\u6C7A\u3081\u308B\u305F\u3081\u3067\u306F\u306A\u304F\u3001\u6B21\u306B\u4F55\u3092\u8A66\u3059\u304B\u3092\u6C7A\u3081\u308B\u305F\u3081\u3002\u6570\u5B57\u3088\u308A\u3082\u75B2\u308C\u306A\u3055\u3092\u512A\u5148\u3059\u308B\u3002",
  decidedAt: (/* @__PURE__ */ new Date()).toISOString()
});
var loadFromFile = (filePath) => {
  const abs = import_node_path3.default.isAbsolute(filePath) ? filePath : import_node_path3.default.join(process.cwd(), filePath);
  const raw = import_node_fs3.default.readFileSync(abs, "utf8");
  return JSON.parse(raw);
};
var writeMonthlyInsight = async (month, filePath) => {
  const db = getAdminDb3();
  let payload = defaultPayload(month);
  if (filePath) {
    const fromFile = loadFromFile(filePath);
    payload = {
      ...payload,
      ...fromFile,
      month,
      decidedAt: payload.decidedAt
      // 実行時刻で固定
    };
  }
  await db.collection("monthlyInsights").doc(month).set(payload, { merge: true });
};

// ../../packages/content-engine/dist/cli/monthly.js
var run = (cmd) => {
  console.log(`
$ ${cmd}`);
  (0, import_node_child_process.execSync)(cmd, { stdio: "inherit" });
};
var openFile = (filePath) => {
  const platform = process.platform;
  if (platform === "darwin")
    return run(`open ${filePath}`);
  if (platform === "win32")
    return run(`cmd /c start "" "${filePath}"`);
  return run(`xdg-open ${filePath}`);
};
var waitForEnter = (message) => new Promise((resolve) => {
  console.log(message);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.once("data", () => {
    process.stdin.pause();
    resolve();
  });
});
var runMonthlyPipeline = async (args) => {
  const outDir = args.outDir ?? "scripts";
  const reportPath = `${outDir}/reports/${args.month}.json`;
  const insightPath = `${outDir}/insights/${args.month}.json`;
  const report = await buildMonthlyReport(args.month);
  printReportText(report);
  const reportAbs = writeJson(reportPath, report);
  const reportFromFile = readReportFile(reportAbs);
  const insight = buildInsightFromReport(reportFromFile);
  const insightAbs = writeJson2(insightPath, insight);
  if (args.open) {
    if (!import_node_fs4.default.existsSync(insightAbs))
      throw new Error(`insight file not found: ${insightAbs}`);
    openFile(insightAbs);
    await waitForEnter(`
\u{1F4DD} insight \u3092\u7DE8\u96C6\u3057\u305F\u3089 Enter \u3067\u7D9A\u884C\u3057\u307E\u3059\uFF08\u4FDD\u5B58\u3055\u308C\u3066\u3044\u308B\u3053\u3068\u3092\u78BA\u8A8D\u3057\u3066\u306D\uFF09
> `);
  }
  await writeMonthlyInsight(args.month, insightAbs);
  console.log(`
\u2705 Done monthly pipeline for ${args.month}`);
  console.log(`- report:  ${reportPath}`);
  console.log(`- insight: ${insightPath}`);
};

// src/schedules/monthlyInsight.ts
var REGION = "asia-northeast1";
var TIME_ZONE = "Asia/Tokyo";
var OPENAI_API_KEY = (0, import_params.defineSecret)("OPENAI_API_KEY");
var NODE_AUTH_TOKEN = (0, import_params.defineSecret)("NODE_AUTH_TOKEN");
var toPrevMonth = (now) => {
  const y = now.getFullYear();
  const m = now.getMonth();
  const prev = new Date(y, m - 1, 1);
  const yy = prev.getFullYear();
  const mm = String(prev.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
};
var monthlyInsight = (0, import_scheduler.onSchedule)(
  {
    schedule: "0 6 1 * *",
    // 毎月1日 06:00
    timeZone: TIME_ZONE,
    region: REGION,
    secrets: [OPENAI_API_KEY, NODE_AUTH_TOKEN]
  },
  async () => {
    process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();
    process.env.NODE_AUTH_TOKEN ||= NODE_AUTH_TOKEN.value();
    const month = toPrevMonth(/* @__PURE__ */ new Date());
    import_firebase_functions.logger.info(`[monthlyInsight] start month=${month}`);
    await runMonthlyPipeline({ month, open: false });
    import_firebase_functions.logger.info(`[monthlyInsight] done month=${month}`);
  }
);
var monthlyInsightDebug = (0, import_https4.onRequest)(
  {
    region: REGION,
    secrets: [OPENAI_API_KEY, NODE_AUTH_TOKEN]
  },
  async (req, res) => {
    process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();
    process.env.NODE_AUTH_TOKEN ||= NODE_AUTH_TOKEN.value();
    const monthParam = typeof req.query.month === "string" ? req.query.month : null;
    const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : toPrevMonth(/* @__PURE__ */ new Date());
    import_firebase_functions.logger.info(`[monthlyInsightDebug] start month=${month}`);
    await runMonthlyPipeline({ month, open: false });
    import_firebase_functions.logger.info(`[monthlyInsightDebug] done month=${month}`);
    res.status(200).json({ ok: true, month });
  }
);

// src/index.ts
(0, import_v2.setGlobalOptions)({ region: "asia-northeast1" });
bootstrapContentEngine();
registerStrategies();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  monthlyInsight,
  monthlyInsightDebug,
  runDue,
  runJob,
  tick
});
//# sourceMappingURL=index.js.map
