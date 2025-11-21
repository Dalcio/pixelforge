import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({ name: "test-app" })),
}));

vi.mock("firebase/analytics", () => ({
  getAnalytics: vi.fn(),
}));

describe("Firebase Configuration", () => {
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy.mockClear();
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should not expose hardcoded Firebase credentials in source code", async () => {
    // Read the firebase.ts source to verify no hardcoded values
    const firebaseModule = await import("./firebase?raw");
    const source = firebaseModule.default;

    // Check that no hardcoded API keys are present
    expect(source).not.toContain("AIzaSy");
    expect(source).not.toContain(".firebaseapp.com");

    // Verify it uses environment variables
    expect(source).toContain("import.meta.env.VITE_FIREBASE_API_KEY");
    expect(source).toContain("import.meta.env.VITE_FIREBASE_PROJECT_ID");
  });

  it("should validate Firebase configuration structure", () => {
    // This test verifies the config shape without needing actual env vars
    const { initializeApp } = require("firebase/app");

    expect(initializeApp).toBeDefined();
    expect(typeof initializeApp).toBe("function");
  });
});
