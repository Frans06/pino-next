export type AdapterType<T extends readonly string[]> = Record<
  string,
  T[number]
>;

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
};

export const consoleToPino: AdapterType<typeof PinoMethodNames> = {
  error: "error",
  warn: "warn",
  log: "info",
  info: "info",
  debug: "debug",
  trace: "trace",
};

/**
 * Gets the mapped method name from the adapter
 * @param adapter The adapter object mapping from one method type to another
 * @param method The method name to map
 * @returns The mapped method name
 */
export function getMappedMethod<T extends readonly string[]>(
  adapter: AdapterType<T>,
  method: string,
): T[number] {
  return (adapter[method] || method) as T[number];
}
