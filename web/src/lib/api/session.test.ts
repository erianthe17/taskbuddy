import { beforeEach, describe, expect, it } from "vitest";
import { clearStoredSession, getStoredSession, setStoredSession } from "./session";

// Polyfill localStorage if not fully available
if (typeof window !== "undefined" && typeof window.localStorage?.clear !== "function") {
  const storage: { [key: string]: string } = {};
  (window as any).localStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => {
        delete storage[key];
      });
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    },
  };
}

describe("session storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(getStoredSession()).toBeNull();
  });

  it("round-trips a stored session", () => {
    setStoredSession({
      accessToken: "tok-123",
      adminProfile: { name: "admin@taskbuddy.io", email: "admin@taskbuddy.io" },
    });
    expect(getStoredSession()).toEqual({
      accessToken: "tok-123",
      adminProfile: { name: "admin@taskbuddy.io", email: "admin@taskbuddy.io" },
    });
  });

  it("clears the stored session", () => {
    setStoredSession({ accessToken: "tok", adminProfile: { name: "a", email: "a" } });
    clearStoredSession();
    expect(getStoredSession()).toBeNull();
  });

  it("returns null instead of throwing on corrupted storage", () => {
    localStorage.setItem("tb-admin-session", "{not-json");
    expect(getStoredSession()).toBeNull();
  });
});
