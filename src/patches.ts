import { LoggerOptions } from "pino";
import { patchWithLogger } from "./logger";
import { consoleToPino, nextToPino } from "./methodsMaps";

export const patchOnlyNextLogger = (loggerOptions?: LoggerOptions) => {
  const cachePath = require.resolve("next/dist/build/output/log");
  const cacheObject = require.cache[cachePath];
  if (cacheObject) {
    cacheObject.exports = { ...(cacheObject ? cacheObject.exports : {}) };
    patchWithLogger("next.js", nextToPino, cacheObject.exports, loggerOptions);
  }
};

export const patchAllConsoleLogger = (loggerOptions?: LoggerOptions) => {
  patchWithLogger("console", consoleToPino, console, loggerOptions);
};
