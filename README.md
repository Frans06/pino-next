# pino-next

A opinionated, powerful and flexible logging solution for Next.js applications using Pino under the hood.
Highly inspired by [next-logger](https://github.com/sainsburys-tech/next-logger)

## Features

- 📊 Built on top of the powerful [Pino](https://github.com/pinojs/pino) logger
- 🌈 Pretty logging for development, efficient JSON logging for production
- 🔄 Seamless Console API compatibility
- 🛡️ Graceful fallback to console if initialization fails
- 🚀 Optimized for Next.js applications
- 📝 Full TypeScript support

## Installation

```bash
npm install pino-next
# or
yarn add pino-next
# or
pnpm add pino-next
```

Patch global on instrumentation.ts file on the project root

- Global patcher:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const patcher = await import("pino-next");
    patcher.patchAllConsoleLogger({ forceArgs: true });
  }
}
```

- Next Only patcher:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const patcher = await import("pino-next");
    patcher.patchAllConsoleLogger(forceArgs: true);
  }
}
```

- Custom logger patcher:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const patcher = await import("pino-next");
    patcher.patchWithLogger(
      "customLoggerName",
      customeAdapter,
      customLogger,
      loggerOptions,
    );
  }
}
```

## Basic Usage

```typescript
import { createLogger } from "nextjs-pino-logger";

// Create a logger with default settings
const logger = createLogger();

// Log messages with different levels
logger.info("Application started");
logger.debug({ userId: 123 }, "User logged in");
logger.warn("Resource is running low");
logger.error(new Error("Something went wrong"), "Operation failed");

// Create a child logger with additional context
const userLogger = logger.child({ component: "UserService" });
userLogger.info({ userId: 456 }, "User profile updated");
```

## Advanced Usage

### Patching Console API

You can patch the global `console` object to use your logger:

```typescript
import { patchConsoleWithLogger } from "nextjs-pino-logger";

// Patch console with your logger
patchConsoleWithLogger("MyApp");

// Now console methods will use pino under the hood
console.log("This will use pino logger");
console.error(new Error("Error will be properly formatted"));
```

### Configuration Options

```typescript
import { createLogger } from "nextjs-pino-logger";

const logger = createLogger(
  {
    level: "debug", // Set the log level
    isProduction: false, // Force production mode (disables pretty printing)
    prettify: true, // Force pretty printing
  },
  true,
); // Enable instrumentation
```

## Next.js Integration

Add to your `app.tsx` or `_app.js`:

```typescript
// pages/_app.tsx or app/layout.tsx
import { patchConsoleWithLogger } from "nextjs-pino-logger";

// Initialize once at the app level
if (typeof window !== "undefined") {
  patchConsoleWithLogger("client");
} else {
  patchConsoleWithLogger("server");
}

// Your Next.js app component
export default function App({ Component, pageProps }) {
  return;
}
```

## API Reference

### createLogger(config?)

Creates a new logger instance.

- `config` - Optional configuration object:
  - `level` - Log level (default: 'info' in development, 'warn' in production)
  - `isProduction` - Force production mode
  - `prettify` - Enable pretty printing
  - `forceArgs` - Add hook args
- `isInstrumented` - Whether to add instrumentation hooks (default: false)

### patchWithLogger(childName, mapper, patched?, config?)

Patches a console object with logger methods.

- `childName` - Name for the child logger
- `patched` - Console object to patch (default: global console)
- `mapper` - Method mapping (default: consoleToPino)
- `config` - Same as create logger

### logger

A pre-configured default logger instance.

### Development

Please let me know if you have any requirement or issues. PRs are also welcome.

## License

MIT
