import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRESS_MAX,
  defaultValueLabel,
  isValidMax,
  isValidValue,
  progressState,
  resolveMax,
  resolveValue,
} from "../src/progress/value";

const SEED = { seed: 42 };

describe("progress rules", () => {
  it("[PRG-40] max is valid exactly when it is a finite number above zero", () => {
    fc.assert(
      fc.property(fc.double(), (max) => {
        expect(isValidMax(max)).toBe(Number.isFinite(max) && max > 0);
        expect(resolveMax(max)).toBe(isValidMax(max) ? max : DEFAULT_PROGRESS_MAX);
      }),
      SEED,
    );
    for (const bad of [undefined, null, "10", {}, [], true]) {
      expect(isValidMax(bad)).toBe(false);
      expect(resolveMax(bad)).toBe(100);
    }
  });

  it("[PRG-41] a resolved value is always inside [0, max] or null", () => {
    fc.assert(
      fc.property(fc.double(), fc.double({ min: 0.001, max: 1e6, noNaN: true }), (value, max) => {
        const resolved = resolveValue(value, max);
        if (resolved !== null) {
          expect(resolved).toBeGreaterThanOrEqual(0);
          expect(resolved).toBeLessThanOrEqual(max);
          expect(resolved).toBe(value);
        } else {
          expect(isValidValue(value, max)).toBe(false);
        }
      }),
      SEED,
    );
  });

  it("[PRG-42] state: null is indeterminate, max is complete, anything else is loading", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (max, raw) => {
          const value = Math.min(raw, max);
          const state = progressState(value, max);
          expect(state).toBe(value === max ? "complete" : "loading");
          expect(progressState(null, max)).toBe("indeterminate");
        },
      ),
      SEED,
    );
  });

  it("[PRG-44] a locale with its own digits writes the percentage with them, else ASCII", () => {
    expect(defaultValueLabel(40, 100, "ar")).toMatch(/^[\u0660-\u0669]+/);
    expect(defaultValueLabel(40, 100, "ar")).not.toMatch(/\d/);
    expect(defaultValueLabel(40, 100)).toBe("40%");
    expect(defaultValueLabel(40, 100, "en-US")).toBe("40%");
  });

  it("[PRG-43] the default label is a rounded percentage between 0% and 100%", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (max, raw) => {
          const value = Math.min(raw, max);
          const label = defaultValueLabel(value, max);
          expect(label).toMatch(/^\d{1,3}%$/);
          const percent = Number.parseInt(label, 10);
          expect(percent).toBeGreaterThanOrEqual(0);
          expect(percent).toBeLessThanOrEqual(100);
        },
      ),
      SEED,
    );
    expect(defaultValueLabel(1, 3)).toBe("33%");
    expect(defaultValueLabel(2, 3)).toBe("67%");
  });
});
