import { createLogger, processLogArgs } from "../src/logger";

describe("logger", () => {
  describe("createLogger", () => {
    it("should create a logger instance", () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });

    it("should create a logger with custom config", () => {
      const logger = createLogger({ level: "debug", isProduction: true });
      expect(logger).toBeDefined();
    });
  });

  describe("processLogArgs", () => {
    it("should process string arguments", () => {
      const result = processLogArgs(["Hello world"]);
      expect(result).toEqual(["Hello world"]);
    });

    it("should process object arguments", () => {
      const obj = { userId: 123 };
      const result = processLogArgs([obj]);
      expect(result).toEqual([obj]);
    });

    it("should process error objects", () => {
      const error = new Error("Test error");
      const result = processLogArgs([error]);
      expect(result[0]).toHaveProperty("err", error);
      expect(result[0]).toHaveProperty("stack", error.stack);
      expect(result[0]).toHaveProperty("message", "Test error");
    });

    it("should process mixed arguments", () => {
      const obj = { userId: 123 };
      const result = processLogArgs([obj, "User %s logged in", "John"]);
      expect(result[0]).toEqual(obj);
      expect(result[1]).toBe("User John logged in");
    });
  });
});
