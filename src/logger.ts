import { format } from "util";
import pino, {
  Bindings,
  DestinationStream,
  LogFn,
  Logger,
  LoggerOptions,
} from "pino";
import pinoPretty from "pino-pretty";

import {
  AdapterType,
  ConsoleMethodNames,
  getMappedMethod,
  PinoMethodNames,
  pinoToConsole,
  consoleToPino,
} from "./methodsMaps";

interface LoggerConfig {
  level?: string;
  isProduction?: boolean;
  prettify?: boolean;
  forceArgs?: boolean;
}

/**
 * Creates a logger instance with optional instrumentation
 * @param config Configuration options for the logger
 * @returns A configured pino logger instance
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  try {
    const isProduction =
      config.isProduction ?? process.env.NODE_ENV === "production";
    const level = config.level ?? (isProduction ? "warn" : "info");
    const prettify = config.prettify ?? !isProduction;

    const prettyStream = prettify
      ? (pinoPretty({
          colorize: true,
          translateTime: "SYS:standard",
        }) as DestinationStream)
      : undefined;

    const loggerOptions: LoggerOptions = {
      level,
      timestamp: pino.stdTimeFunctions.isoTime,
      browser: {
        asObject: true,
        write: (o) => {
          console.log(JSON.stringify(o));
        },
      },
    };

    if (config?.forceArgs) {
      loggerOptions.hooks = instrumentationOptions;
    }

    return pino(loggerOptions, prettyStream);
  } catch (e) {
    console.warn(
      "Failed to initialize pino logger:",
      e instanceof Error ? e.message : String(e),
    );
    // Create a safer fallback to console
    return createConsoleLoggerFallback();
  }
}

/**
 * Creates a fallback logger using the console object
 * @returns A Logger-compatible object that wraps console methods
 */
function createConsoleLoggerFallback<CustomLevels extends string = never>(
  bindings: Bindings = {},
): Logger<CustomLevels, false> {
  const fallbackLogger = {} as Logger<CustomLevels, false>;

  PinoMethodNames.forEach((method) => {
    // Cast the method to a LogFn to satisfy TypeScript
    const newMethod = getMappedMethod<typeof ConsoleMethodNames>(
      pinoToConsole,
      method,
    );
    fallbackLogger[method] = console[newMethod].bind(console) as LogFn;
  });
  // Add child method to maintain compatibility with pino Logger interface
  fallbackLogger.child = <ChildCustomLevels extends string = never>(
    extraBindings: Bindings,
  ): Logger<ChildCustomLevels, false> => {
    const newBindings = { ...bindings, ...extraBindings };

    return createConsoleLoggerFallback<ChildCustomLevels>(newBindings);
  };

  return fallbackLogger;
}

export function patchWithLogger(
  childName: string,
  mapper: AdapterType<typeof PinoMethodNames> = consoleToPino,
  patched: Console = console,
  loggerConfig?: LoggerConfig,
): void {
  for (const method of ConsoleMethodNames) {
    const newLogger = createLogger(loggerConfig);
    const childLogger = newLogger.child({ name: childName });
    const newMethod = getMappedMethod(mapper, method);
    const patchedLogFn = childLogger[newMethod];
    if (method in patched)
      Object.defineProperty(patched, method, {
        value: patchedLogFn.bind(childLogger),
        writable: true,
        configurable: true,
        enumerable: true,
      });
  }
}

export function processLogArgs(args: unknown[]): (object | string)[] | null {
  const mergingObject: Record<string, unknown> = {};
  const messageParts: string[] = [];

  for (const arg of args) {
    if (arg instanceof Error) {
      // Handle Error objects
      Object.assign(mergingObject, {
        err: arg,
        stack: arg.stack,
        message: arg.message,
      });
    } else if (Boolean(arg) && typeof arg === "object") {
      // Handle object args
      Object.assign(mergingObject, arg);
    } else {
      // Handle primitive args
      messageParts.push(String(arg));
    }
  }

  // Concatenate non-object args and stringify them into a single string message
  const message = messageParts.length > 0 ? format(...messageParts) : undefined;

  return Object.keys(mergingObject).length
    ? message
      ? [mergingObject, message]
      : [mergingObject]
    : message
      ? [message]
      : null;
}

const instrumentationOptions = {
  logMethod(args: Parameters<LogFn>, method: LogFn) {
    // Early returns for optimization
    if (args.length === 0) {
      return method.apply(this, [""]);
    }
    if (args.length === 1) {
      return method.apply(this, args);
    }

    const mergedArgs = processLogArgs(args) as Parameters<LogFn>;
    return method.apply(this, mergedArgs ? [...mergedArgs] : [""]);
  },
};

// Create a default logger instance
export const logger = createLogger();
