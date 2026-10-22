import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { encodeTabValue } from "../src/tabs/encode";

const SEED = { seed: 42 };

describe("encodeTabValue", () => {
  it("[TAB-40] only produces characters that are safe in an id and a CSS selector", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (value) => {
        expect(encodeTabValue(value)).toMatch(/^[A-Za-z0-9_-]*$/);
      }),
      SEED,
    );
  });

  it("[TAB-41] is injective: different values never share an id", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), fc.string({ unit: "binary" }), (a, b) => {
        fc.pre(a !== b);
        expect(encodeTabValue(a)).not.toBe(encodeTabValue(b));
      }),
      SEED,
    );
  });

  it("[TAB-42] is injective on the tricky inputs: underscores, escapes and look-alikes", () => {
    const alphabet = fc.constantFrom("a", "_", "2", "0", "-", " ", "5", "f", "é");
    fc.assert(
      fc.property(
        fc.array(alphabet, { maxLength: 8 }).map((parts) => parts.join("")),
        fc.array(alphabet, { maxLength: 8 }).map((parts) => parts.join("")),
        (a, b) => {
          fc.pre(a !== b);
          expect(encodeTabValue(a)).not.toBe(encodeTabValue(b));
        },
      ),
      { ...SEED, numRuns: 2000 },
    );
  });

  it("[TAB-43] leaves already safe values untouched and is deterministic", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z0-9-]*$/), (value) => {
        expect(encodeTabValue(value)).toBe(value);
        expect(encodeTabValue(value)).toBe(encodeTabValue(value));
      }),
      SEED,
    );
  });

  it("[TAB-44] known values", () => {
    expect(encodeTabValue("")).toBe("");
    expect(encodeTabValue("a b")).toBe("a_20_b");
    expect(encodeTabValue("a_b")).toBe("a_5f_b");
    expect(encodeTabValue("é")).toBe("_e9_");
    expect(encodeTabValue("😀")).toBe("_1f600_");
  });
});
