import { LoggerConfig, patchWithLogger } from "./logger";
import { consoleToPino, nextToPino } from "./methodsMaps";

export const patchOnlyNextLogger = (loggerConfig?: LoggerConfig) => {
  const cachePath = require.resolve("next/dist/build/output/log");
  const cacheObject = require.cache[cachePath];
  if (cacheObject) {
    cacheObject.exports = { ...(cacheObject ? cacheObject.exports : {}) };
    patchWithLogger("next.js", nextToPino, cacheObject.exports, loggerConfig);
  }
};

export const patchAllConsoleLogger = (loggerConfig?: LoggerConfig) => {
  patchWithLogger("console", consoleToPino, console, loggerConfig);
};
