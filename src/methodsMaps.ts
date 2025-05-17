export type AdapterType<T extends readonly string[]> = Partial<
  Record<string, T[number]>
> & { default: T[number] };

export const PinoMethodNames = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
] as const;

export const ConsoleMethodNames = [
  "error",
  "warn",
  "log",
  "info",
  "debug",
  "trace",
] as const;

export const pinoToConsole: AdapterType<typeof ConsoleMethodNames> = {
  fatal: "error",
  error: "error",
  warn: "warn",
  info: "log",
  debug: "debug",
  trace: "trace",
  default: "log",
};

export const consoleToPino: AdapterType<typeof PinoMethodNames> = {
  error: "error",
  warn: "warn",
  log: "info",
  info: "info",
  debug: "debug",
  trace: "trace",
  default: "info",
};

export const nextToPino: AdapterType<typeof PinoMethodNames> = {
  default: "info",
  error: "error",
  trace: "trace",
  warn: "warn",
};

/**
 * Gets the mapped method name from the adapter
 * @param adapter The adapter object mapping from one method type to another
 * @param method The method name to map
 * @returns The mapped method name
 */
export const getMappedMethod = <T extends readonly string[]>(
  adapter: AdapterType<T>,
  method: string,
): T[number] => {
  if (method in adapter) {
    return adapter[method] ?? adapter["default"];
  }
  return adapter["default"];
};
