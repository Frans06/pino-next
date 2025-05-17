import { patchAllConsoleLogger } from "../src/patches";
import { consoleToPino } from "../src/methodsMaps";
import * as logger from "../src/logger";
// Mock the require.resolve and require.cache
beforeEach(() => {
  jest.resetModules();
});

describe("patchers", () => {
  let consoleSpy: jest.SpyInstance;
  let patchConsoleWithLoggerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console.warn
    consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    // Spy on the patchConsoleWithLogger function
    patchConsoleWithLoggerSpy = jest
      .spyOn(logger, "patchWithLogger")
      .mockImplementation(() => {});

    // Reset mocks
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    patchConsoleWithLoggerSpy.mockRestore();
  });

  describe("patchAllConsoleLogger", () => {
    it("should call patchConsoleWithLogger with correct parameters", () => {
      // Call the function
      patchAllConsoleLogger();

      // Check that patchConsoleWithLogger was called correctly
      expect(patchConsoleWithLoggerSpy).toHaveBeenCalledTimes(1);
      expect(patchConsoleWithLoggerSpy).toHaveBeenCalledWith(
        "console",
        consoleToPino,
        console,
        undefined,
      );
    });
  });
});
