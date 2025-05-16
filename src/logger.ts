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
}

/**
 * Creates a logger instance with optional instrumentation
 * @param config Configuration options for the logger
 * @param isInstrumented Whether to add instrumentation hooks
 * @returns A configured pino logger instance
 */
export function createLogger(
  config: LoggerConfig = {},
  isInstrumented = false,
): Logger {
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

    if (isInstrumented) {
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

export function patchConsoleWithLogger(
  childName: string,
  patched: Console = console,
  mapper: AdapterType<typeof PinoMethodNames> = consoleToPino,
): void {
  for (const method of ConsoleMethodNames) {
    const newLogger = createLogger({}, true);
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

export function processLogArgs(
  args: unknown[],
): (object | string | undefined)[] {
  const mergingObject: Record<string, unknown> = {};
  const messageParts: string[] = [];

  for (const arg of args) {
    if (arg instanceof Error) {
      // Handle Error objects appropriately
      Object.assign(mergingObject, {
        err: arg,
        stack: arg.stack,
        message: arg.message,
      });
    } else if (Boolean(arg) && typeof arg === "object") {
      // Handle object arguments
      Object.assign(mergingObject, arg);
    } else {
      // Handle primitive arguments
      messageParts.push(String(arg));
    }
  }

  // Concatenate non-object arguments into a single string message
  const message = messageParts.length > 0 ? format(...messageParts) : undefined;
  if (Object.keys(mergingObject).length)
    return [mergingObject, message ? message : undefined];
  else return [message];
}

const instrumentationOptions = {
  // https://getpino.io/#/docs/api?id=logmethod
  logMethod(args: Parameters<LogFn>, method: LogFn) {
    // Early returns for optimization
    if (args.length === 0) {
      return method.apply(this, [""]);
    }
    if (args.length === 1) {
      return method.apply(this, args);
    }

    // If the arguments can't be changed to match Pino's signature, collapse them into a single merging object.
    const res = processLogArgs(args);
    // Concatenate non-object arguments into a single string message.
    // @ts-ignore: this is an overload typing error
    return method.apply(this, [...res]);
  },
};

// Create a default logger instance
export const logger = createLogger();
