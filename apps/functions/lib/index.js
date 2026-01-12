"use strict";
// apps/functions/src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDue = exports.tick = void 0;
const content_engine_1 = require("@tw20th/content-engine");
(0, content_engine_1.bootstrapContentEngine)();
var tick_1 = require("./schedules/tick");
Object.defineProperty(exports, "tick", { enumerable: true, get: function () { return tick_1.tick; } });
var runDue_1 = require("./http/runDue");
Object.defineProperty(exports, "runDue", { enumerable: true, get: function () { return runDue_1.runDue; } });
