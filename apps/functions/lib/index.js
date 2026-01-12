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
  runDue: () => runDue,
  tick: () => tick
});
module.exports = __toCommonJS(index_exports);

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
var getSource = (sourceId) => {
  const s = sources.get(sourceId);
  if (!s) {
    const available = [...sources.keys()].join(", ");
    throw new Error(`Source not found: "${sourceId}". Available: ${available || "(none)"}`);
  }
  return s;
};
var listSources = () => {
  return [...sources.keys()];
};

// ../../packages/content-engine/dist/registry/channels.js
var channels = /* @__PURE__ */ new Map();
var registerChannel = (channel) => {
  channels.set(channel.channelId, channel);
};
var getChannel = (channelId) => {
  const c = channels.get(channelId);
  if (!c) {
    const available = [...channels.keys()].join(", ");
    throw new Error(`Channel not found: "${channelId}". Available: ${available || "(none)"}`);
  }
  return c;
};
var listChannels = () => {
  return [...channels.keys()];
};

// ../../packages/content-engine/dist/engine/run.js
var runContentEngine = async (input, opts) => {
  const strategy = "strategy" in opts ? opts.strategy : getStrategy(opts.strategyId);
  const source = getSource(input.sourceId);
  const channel = getChannel(input.channelId);
  const nowIso3 = (/* @__PURE__ */ new Date()).toISOString();
  const payload = input.topic ? { topic: input.topic } : source.prepare({ strategyId: strategy.strategyId, channelId: input.channelId, nowIso: nowIso3 });
  const generateInput = {
    topic: payload.topic,
    sourceId: input.sourceId,
    channelId: input.channelId,
    draft: input.draft ?? payload.draft,
    product: payload.product
  };
  const raw = await strategy.generate(generateInput);
  const optimized = channel.optimize(raw);
  return optimized;
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

// ../../packages/content-engine/dist/engine/runResolved.js
var hasResolvedConfig = (input) => {
  return "config" in input;
};
var runResolvedContentEngine = async (input) => {
  const config = hasResolvedConfig(input) ? input.config : resolveEngineConfig({
    presetId: input.presetId,
    strategyId: input.strategyId,
    sourceId: input.sourceId,
    channelId: input.channelId
  });
  const runInput = {
    sourceId: config.sourceId,
    channelId: config.channelId,
    topic: input.topic,
    draft: input.draft
  };
  const opts = { strategyId: config.strategyId };
  const article = await runContentEngine(runInput, opts);
  return { config, article };
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

// ../../packages/strategy-seo-basic/dist/seoBasic.js
var buildTitle2 = (topic) => {
  return `\u3010\u7D50\u8AD6\u3011${topic}`;
};
var buildContent2 = (topic, draft) => {
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
      title: buildTitle2(input.topic),
      content: buildContent2(input.topic, input.draft),
      ids: {
        strategyId: "seo-basic",
        sourceId: input.sourceId,
        channelId: input.channelId
      },
      createdAt: now
    };
  }
};

// ../../packages/strategy-rewrite-basic/dist/rewriteBasic.js
var nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
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
    const createdAt = nowIso();
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

// ../../packages/strategy-quiet-rewrite/dist/quietRewrite.js
var nowIso2 = () => (/* @__PURE__ */ new Date()).toISOString();
var buildTitle4 = (topic) => {
  return `\u9759\u304B\u306A\u30EA\u30E9\u30A4\u30C8\uFF1A${topic}`;
};
var buildContent3 = (topic, draft) => {
  const excerpt = draft ? draft.slice(0, 500) : "";
  return [
    `# ${buildTitle4(topic)}`,
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
    const createdAt = nowIso2();
    return {
      topic: input.topic,
      title: buildTitle4(input.topic),
      content: buildContent3(input.topic, input.draft),
      ids: {
        strategyId: "quiet-rewrite",
        sourceId: input.sourceId,
        channelId: input.channelId
      },
      createdAt
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
  registerStrategy(quietSpreadStrategy);
  registerStrategy(seoBasicStrategy);
  registerStrategy(rewriteBasicStrategy);
  registerStrategy(quietRewriteStrategy);
  registerStrategy(openaiBasicStrategy);
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

// src/schedules/tick.ts
var import_scheduler = require("firebase-functions/v2/scheduler");
var import_firebase_functions = require("firebase-functions");
var import_params = require("firebase-functions/params");
var import_firestore4 = require("firebase-admin/firestore");

// src/lib/firebaseAdmin.ts
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var getAdminDb = () => {
  if ((0, import_app.getApps)().length === 0) {
    (0, import_app.initializeApp)();
  }
  return (0, import_firestore.getFirestore)();
};

// src/lib/jobStore.ts
var import_firestore2 = require("firebase-admin/firestore");
var scheduledJobsCol = (db) => db.collection("scheduledJobs");
var runsCol = (db) => db.collection("runs");
var blogsCol = (db) => db.collection("blogs");
var toTs = (d) => import_firestore2.Timestamp.fromDate(d);
var listDueJobs = async (db, now) => {
  const snap = await scheduledJobsCol(db).where("enabled", "==", true).where("nextRunAt", "<=", now).limit(50).get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data()
  }));
};

// src/lib/runners/runJob.ts
var import_firestore3 = require("firebase-admin/firestore");
var import_crypto = require("crypto");

// src/lib/cron.ts
var import_cron_parser = __toESM(require("cron-parser"));
var getNextRunDate = (cron, baseDate) => {
  const interval = import_cron_parser.default.parseExpression(cron, {
    currentDate: baseDate
  });
  return interval.next().toDate();
};

// src/lib/runners/runJob.ts
var buildEngineInput = (job) => {
  return {
    presetId: job.engine.presetId,
    strategyId: job.engine.strategyId,
    sourceId: job.engine.sourceId,
    channelId: job.engine.channelId,
    topic: job.input?.topic,
    draft: job.input?.draft
  };
};
var getStrategyMetrics = (article) => {
  const a = article;
  return a.meta?.strategyMetrics;
};
var saveBlog = async (db, jobId, runId, article) => {
  const docRef = blogsCol(db).doc();
  await docRef.set({
    ...article,
    strategyId: article.ids.strategyId ?? "unknown",
    sourceId: article.ids.sourceId ?? "unknown",
    channelId: article.ids.channelId ?? "unknown",
    jobId,
    runId,
    createdAt: article.createdAt
  });
  return docRef.id;
};
var runJobOnce = async (db, jobId, job) => {
  const runId = (0, import_crypto.randomUUID)();
  const startedAt = import_firestore3.Timestamp.now();
  try {
    const engineInput = buildEngineInput(job);
    const { config, article } = await runResolvedContentEngine(engineInput);
    const blogId = await saveBlog(db, jobId, runId, article);
    const endedAt = import_firestore3.Timestamp.now();
    const nextRunDate = getNextRunDate(job.cron, /* @__PURE__ */ new Date());
    const runLog = {
      jobId,
      runId,
      presetId: config.presetId ?? "unknown",
      strategyId: config.strategyId ?? "unknown",
      sourceId: config.sourceId ?? "unknown",
      channelId: config.channelId ?? "unknown",
      startedAt,
      endedAt,
      status: "success",
      createdBlogIds: [blogId],
      metrics: getStrategyMetrics(article),
      warnings: config.warnings
    };
    await runsCol(db).doc(runId).set(runLog);
    return {
      runId,
      createdBlogIds: [blogId],
      nextRunAt: toTs(nextRunDate)
    };
  } catch (e) {
    const endedAt = import_firestore3.Timestamp.now();
    const nextRunDate = getNextRunDate(job.cron, /* @__PURE__ */ new Date());
    const err = e instanceof Error ? e : new Error("Unknown error");
    const runLog = {
      jobId,
      runId,
      presetId: job.engine.presetId,
      strategyId: job.engine.strategyId ?? "unknown",
      sourceId: job.engine.sourceId ?? "unknown",
      channelId: job.engine.channelId ?? "unknown",
      startedAt,
      endedAt,
      status: "error",
      createdBlogIds: [],
      error: {
        message: err.message,
        stack: err.stack
      }
    };
    await runsCol(db).doc(runId).set(runLog);
    return {
      runId,
      createdBlogIds: [],
      nextRunAt: toTs(nextRunDate)
    };
  }
};

// src/schedules/tick.ts
var REGION = "asia-northeast1";
var TIME_ZONE = "Asia/Tokyo";
var OPENAI_API_KEY = (0, import_params.defineSecret)("OPENAI_API_KEY");
var tick = (0, import_scheduler.onSchedule)(
  {
    schedule: "every 5 minutes",
    timeZone: TIME_ZONE,
    region: REGION,
    // ✅ これがないと Secret は関数に渡らない
    secrets: [OPENAI_API_KEY]
  },
  async () => {
    process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();
    const db = getAdminDb();
    const now = /* @__PURE__ */ new Date();
    const due = await listDueJobs(db, import_firestore4.Timestamp.fromDate(now));
    if (due.length === 0) {
      import_firebase_functions.logger.info("[tick] no due jobs");
      return;
    }
    import_firebase_functions.logger.info(`[tick] due jobs: ${due.length}`);
    for (const { id: jobId, data: job } of due) {
      const result = await runJobOnce(db, jobId, job);
      await scheduledJobsCol(db).doc(jobId).update({
        lastRunAt: import_firestore4.Timestamp.fromDate(/* @__PURE__ */ new Date()),
        nextRunAt: result.nextRunAt
      });
      import_firebase_functions.logger.info(
        `[tick] ran job=${jobId} runId=${result.runId} blogs=${result.createdBlogIds.length}`
      );
    }
  }
);

// src/http/runDue.ts
var import_https = require("firebase-functions/v2/https");
var import_firebase_functions2 = require("firebase-functions");
var import_params2 = require("firebase-functions/params");
var import_firestore5 = require("firebase-admin/firestore");
var REGION2 = "asia-northeast1";
var OPENAI_API_KEY2 = (0, import_params2.defineSecret)("OPENAI_API_KEY");
var runDue = (0, import_https.onRequest)(
  { region: REGION2, secrets: [OPENAI_API_KEY2], invoker: "public" },
  async (_req, res) => {
    try {
      process.env.OPENAI_API_KEY ||= OPENAI_API_KEY2.value();
      const db = getAdminDb();
      const now = import_firestore5.Timestamp.now();
      const due = await listDueJobs(db, now);
      for (const { id: jobId, data: job } of due) {
        const result = await runJobOnce(db, jobId, job);
        await scheduledJobsCol(db).doc(jobId).update({
          lastRunAt: import_firestore5.Timestamp.now(),
          nextRunAt: result.nextRunAt
        });
      }
      res.json({ ok: true, due: due.length });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error");
      import_firebase_functions2.logger.error("[runDue] fatal", { message: err.message, stack: err.stack });
      res.status(500).json({ ok: false, error: { message: err.message } });
    }
  }
);

// src/index.ts
bootstrapContentEngine();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runDue,
  tick
});
//# sourceMappingURL=index.js.map
