import { describe, it, expect } from "vitest";
import { generateId } from "./id-generator";

describe("generateId", () => {
  it("should generate a unique ID", () => {
    const id = generateId();
    expect(id).toBeDefined();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate different IDs on subsequent calls", () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it("should contain timestamp and random component separated by hyphen", () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it("should have timestamp as first part", () => {
    const beforeTimestamp = Date.now();
    const id = generateId();
    const afterTimestamp = Date.now();

    const [timestampPart] = id.split("-");
    const timestamp = parseInt(timestampPart, 10);

    expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
    expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
  });

  it("should have random alphanumeric string as second part", () => {
    const id = generateId();
    const [, randomPart] = id.split("-");

    expect(randomPart).toBeDefined();
    expect(randomPart.length).toBeGreaterThan(0);
    expect(randomPart).toMatch(/^[a-z0-9]+$/);
  });

  it("should generate IDs with consistent format", () => {
    const ids = Array.from({ length: 100 }, () => generateId());

    ids.forEach((id) => {
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
      const parts = id.split("-");
      expect(parts).toHaveLength(2);
    });
  });

  it("should be collision-resistant for rapid generation", () => {
    const ids = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      ids.add(generateId());
    }

    expect(ids.size).toBe(count);
  });

  it("should generate sortable IDs by timestamp", () => {
    const id1 = generateId();
    const id2 = generateId();

    const [timestamp1] = id1.split("-");
    const [timestamp2] = id2.split("-");

    expect(parseInt(timestamp2, 10)).toBeGreaterThanOrEqual(
      parseInt(timestamp1, 10)
    );
  });
});
