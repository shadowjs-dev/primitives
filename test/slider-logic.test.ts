import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  clamp,
  getClosestThumbIndex,
  getDecimalCount,
  getKeyAction,
  getKeyValue,
  getNextSortedValues,
  getSlideDirection,
  getSlideEdges,
  getThumbInBoundsOffset,
  getThumbLabel,
  getValueFromPointer,
  roundToDecimals,
  type SlideDirection,
  snapToStep,
  valueToPercent,
} from "../src/slider/logic";

const SEED = { seed: 42 };
const DIRECTIONS: readonly SlideDirection[] = [
  "from-left",
  "from-right",
  "from-bottom",
  "from-top",
];
const finite = fc.double({ min: -1e6, max: 1e6, noNaN: true });
const steps = fc.constantFrom(1, 2, 5, 10, 0.1, 0.25, 0.5, 0.01, 0.05, 3, 7);

describe("slider math", () => {
  it("[SLD-L01] clamp keeps the value inside the bounds and is idempotent", () => {
    fc.assert(
      fc.property(finite, finite, finite, (value, a, b) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        const result = clamp(value, low, high);
        expect(result).toBeGreaterThanOrEqual(low);
        expect(result).toBeLessThanOrEqual(high);
        expect(clamp(result, low, high)).toBe(result);
        if (value >= low && value <= high) expect(result).toBe(value);
      }),
      SEED,
    );
  });

  it("[SLD-L02] getDecimalCount reads the shortest decimal form, exponents included", () => {
    expect(getDecimalCount(5)).toBe(0);
    expect(getDecimalCount(0.25)).toBe(2);
    expect(getDecimalCount(-0.05)).toBe(2);
    expect(getDecimalCount(1e-7)).toBe(7);
    expect(getDecimalCount(1.5e-7)).toBe(8);
    expect(getDecimalCount(1e21)).toBe(0);
    expect(getDecimalCount(Number.NaN)).toBe(0);
    expect(getDecimalCount(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("[SLD-L03] roundToDecimals removes floating point noise", () => {
    expect(roundToDecimals(0.1 + 0.2, 1)).toBe(0.3);
    expect(roundToDecimals(1.005 * 1000, 0)).toBe(1005);
    expect(roundToDecimals(2.5, 0)).toBe(3);
    expect(roundToDecimals(5, -3)).toBe(5);
  });

  it("[SLD-L04] snapToStep lands on the grid inside the bounds and is idempotent", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -50, max: 50 }),
        fc.integer({ min: 1, max: 500 }),
        steps,
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        (minimum, span, step, raw) => {
          const min = minimum;
          const max = min + span;
          const snapped = snapToStep(raw, min, max, step);
          expect(snapped).toBeGreaterThanOrEqual(min);
          expect(snapped).toBeLessThanOrEqual(max);
          expect(snapToStep(snapped, min, max, step)).toBe(snapped);
          const decimals = Math.max(getDecimalCount(step), getDecimalCount(min));
          expect(getDecimalCount(snapped)).toBeLessThanOrEqual(
            Math.max(decimals, getDecimalCount(max)),
          );
          // Always on the grid, even when max is not.
          const gridSteps = (snapped - min) / step;
          const onGrid = Math.abs(gridSteps - Math.round(gridSteps)) < 1e-9;
          expect(onGrid).toBe(true);
        },
      ),
      SEED,
    );
  });

  it("[SLD-L05] a 0.1 step never produces 0.30000000000000004", () => {
    expect(snapToStep(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(0.7000000001, 0, 1, 0.1)).toBe(0.7);
    expect(snapToStep(0.34, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(0.36, 0, 1, 0.1)).toBe(0.4);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (n) => {
        const snapped = snapToStep(n * 0.1 + 1e-12, 0, 100, 0.1);
        expect(String(snapped)).toBe(String(Number((n / 10).toFixed(1))));
      }),
      SEED,
    );
  });

  it("[SLD-L06] snapToStep counts steps from a fractional minimum", () => {
    expect(snapToStep(0.17, 0.05, 1, 0.1)).toBe(0.15);
    expect(snapToStep(0.29, 0.05, 1, 0.1)).toBe(0.25);
  });

  it("[SLD-L06b] a maximum off the grid snaps to the last grid point below it", () => {
    expect(snapToStep(100, 0, 10, 3)).toBe(9);
    expect(snapToStep(11, 0, 11, 3)).toBe(9);
    expect(snapToStep(-4, 2, 10, 3)).toBe(2);
    expect(snapToStep(1, 0, 0.3, 0.1)).toBe(0.3);
  });

  it("[SLD-L07] degenerate input: bad step only clamps, NaN becomes the minimum", () => {
    expect(snapToStep(7.3, 0, 10, 0)).toBe(7.3);
    expect(snapToStep(7.3, 0, 10, -1)).toBe(7.3);
    expect(snapToStep(70, 0, 10, Number.NaN)).toBe(10);
    expect(snapToStep(Number.NaN, 3, 10, 1)).toBe(3);
    expect(snapToStep(20, 0, 10, Number.POSITIVE_INFINITY)).toBe(10);
  });

  it("[SLD-L08] valueToPercent is monotone, bounded and hits 0 and 100 at the ends", () => {
    expect(valueToPercent(0, 0, 100)).toBe(0);
    expect(valueToPercent(100, 0, 100)).toBe(100);
    expect(valueToPercent(25, 0, 200)).toBe(12.5);
    expect(valueToPercent(5, 5, 5)).toBe(0);
    expect(valueToPercent(-10, 0, 100)).toBe(0);
    expect(valueToPercent(110, 0, 100)).toBe(100);
    fc.assert(
      fc.property(finite, finite, fc.double({ min: 1, max: 1e5, noNaN: true }), (a, b, span) => {
        const min = -1e3;
        const max = min + span;
        const [low, high] = a <= b ? [a, b] : [b, a];
        const p = valueToPercent(low, min, max);
        const q = valueToPercent(high, min, max);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(q).toBeLessThanOrEqual(100);
        expect(p).toBeLessThanOrEqual(q);
      }),
      SEED,
    );
  });
});

describe("slider direction", () => {
  it("[SLD-L10] getSlideDirection folds orientation, dir and inverted", () => {
    expect(getSlideDirection("horizontal", "ltr", false)).toBe("from-left");
    expect(getSlideDirection("horizontal", "rtl", false)).toBe("from-right");
    expect(getSlideDirection("horizontal", "ltr", true)).toBe("from-right");
    expect(getSlideDirection("horizontal", "rtl", true)).toBe("from-left");
    expect(getSlideDirection("vertical", "ltr", false)).toBe("from-bottom");
    expect(getSlideDirection("vertical", "rtl", false)).toBe("from-bottom");
    expect(getSlideDirection("vertical", "ltr", true)).toBe("from-top");
  });

  it("[SLD-L11] getSlideEdges names the anchored edge and its opposite", () => {
    for (const direction of DIRECTIONS) {
      const edges = getSlideEdges(direction);
      expect(edges.start).not.toBe(edges.end);
      expect(edges.vertical).toBe(direction === "from-bottom" || direction === "from-top");
    }
    expect(getSlideEdges("from-right")).toMatchObject({ start: "right", end: "left", sign: -1 });
    expect(getSlideEdges("from-bottom")).toMatchObject({ start: "bottom", end: "top", sign: 1 });
  });
});

describe("slider pointer math", () => {
  const rect = { left: 100, top: 40, width: 200, height: 100 };

  it("[SLD-L20] maps a pointer to a value for each direction", () => {
    expect(getValueFromPointer(100, rect, 0, 100, 1, "from-left")).toBe(0);
    expect(getValueFromPointer(200, rect, 0, 100, 1, "from-left")).toBe(50);
    expect(getValueFromPointer(300, rect, 0, 100, 1, "from-left")).toBe(100);
    expect(getValueFromPointer(300, rect, 0, 100, 1, "from-right")).toBe(0);
    expect(getValueFromPointer(250, rect, 0, 100, 1, "from-right")).toBe(25);
    expect(getValueFromPointer(140, rect, 0, 100, 1, "from-bottom")).toBe(0);
    expect(getValueFromPointer(90, rect, 0, 100, 1, "from-bottom")).toBe(50);
    expect(getValueFromPointer(40, rect, 0, 100, 1, "from-top")).toBe(0);
    expect(getValueFromPointer(65, rect, 0, 100, 1, "from-top")).toBe(25);
  });

  it("[SLD-L21] clamps outside the rectangle and snaps to the step", () => {
    expect(getValueFromPointer(-500, rect, 0, 100, 1, "from-left")).toBe(0);
    expect(getValueFromPointer(900, rect, 0, 100, 1, "from-left")).toBe(100);
    expect(getValueFromPointer(213, rect, 0, 100, 10, "from-left")).toBe(60);
    expect(getValueFromPointer(220, rect, 0, 1, 0.1, "from-left")).toBe(0.6);
    expect(getValueFromPointer(150, rect, 10, 20, 1, "from-left")).toBe(13);
  });

  it("[SLD-L22] an empty rectangle yields the minimum", () => {
    expect(
      getValueFromPointer(5, { left: 0, top: 0, width: 0, height: 0 }, 3, 9, 1, "from-left"),
    ).toBe(3);
  });

  it("[SLD-L23] mirrored directions give mirrored values and stay inside the range", () => {
    fc.assert(
      fc.property(fc.double({ min: -100, max: 500, noNaN: true }), steps, (x, step) => {
        const forward = getValueFromPointer(x, rect, 0, 100, step, "from-left");
        const backward = getValueFromPointer(x, rect, 0, 100, step, "from-right");
        expect(forward).toBeGreaterThanOrEqual(0);
        expect(forward).toBeLessThanOrEqual(100);
        // Mirrored pointer: x' = left + (left + width - x). Allow one step for snapping at the rounding edge.
        const mirrored = getValueFromPointer(
          2 * rect.left + rect.width - x,
          rect,
          0,
          100,
          step,
          "from-left",
        );
        expect(Math.abs(mirrored - backward)).toBeLessThanOrEqual(step + 1e-9);
      }),
      SEED,
    );
  });
});

describe("closest thumb", () => {
  it("[SLD-L30] picks a thumb at the minimum distance", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 6 }),
        fc.integer({ min: -20, max: 120 }),
        (list, target) => {
          const values = [...list].sort((a, b) => a - b);
          const index = getClosestThumbIndex(values, target);
          const distance = Math.abs((values[index] ?? Number.NaN) - target);
          for (const value of values)
            expect(distance).toBeLessThanOrEqual(Math.abs(value - target));
        },
      ),
      SEED,
    );
  });

  it("[SLD-L31] stacked thumbs: the one in the pointer's direction is picked", () => {
    expect(getClosestThumbIndex([50, 50], 80)).toBe(1);
    expect(getClosestThumbIndex([50, 50], 20)).toBe(0);
    expect(getClosestThumbIndex([50, 50, 50], 51)).toBe(2);
    expect(getClosestThumbIndex([50, 50], 50)).toBe(0);
    expect(getClosestThumbIndex([10, 30], 20)).toBe(0);
    expect(getClosestThumbIndex([10, 30, 90], 80)).toBe(2);
    expect(getClosestThumbIndex([], 5)).toBe(0);
    expect(getClosestThumbIndex([42], 5)).toBe(0);
  });
});

describe("getNextSortedValues", () => {
  const options = (minStepsBetweenThumbs: number, step = 1) => ({
    min: 0,
    max: 100,
    step,
    minStepsBetweenThumbs,
  });

  it("[SLD-L40] moves only the given thumb and keeps the list sorted", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }),
        fc.double({ min: -50, max: 150, noNaN: true }),
        fc.nat(4),
        (list, wanted, rawIndex) => {
          const values = [...list].sort((a, b) => a - b);
          const index = rawIndex % values.length;
          const next = getNextSortedValues(values, wanted, index, options(0));
          expect(next).toHaveLength(values.length);
          next.forEach((value, i) => {
            if (i !== index) expect(value).toBe(values[i]);
          });
          expect([...next].sort((a, b) => a - b)).toEqual([...next]);
          for (const value of next) {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(100);
          }
        },
      ),
      SEED,
    );
  });

  it("[SLD-L41] neighbors stay at least minStepsBetweenThumbs steps apart", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        fc.double({ min: -50, max: 150, noNaN: true }),
        fc.boolean(),
        (gapSteps, wanted, upper) => {
          const step = 2;
          const values = [20, 60];
          const index = upper ? 1 : 0;
          const next = getNextSortedValues(values, wanted, index, options(gapSteps, step));
          expect((next[1] ?? 0) - (next[0] ?? 0)).toBeGreaterThanOrEqual(gapSteps * step);
        },
      ),
      SEED,
    );
  });

  it("[SLD-L42] a thumb stops at its neighbor instead of crossing it", () => {
    expect(getNextSortedValues([10, 50], 70, 0, options(0))).toEqual([50, 50]);
    expect(getNextSortedValues([10, 50], 70, 0, options(5))).toEqual([45, 50]);
    expect(getNextSortedValues([10, 50], 5, 1, options(5))).toEqual([10, 15]);
    expect(getNextSortedValues([10, 50, 90], 99, 1, options(10))).toEqual([10, 80, 90]);
  });

  it("[SLD-L43] returns the same array when nothing changes or the index is unknown", () => {
    const values = [10, 50];
    expect(getNextSortedValues(values, 10, 0, options(0))).toBe(values);
    expect(getNextSortedValues(values, 30, 5, options(0))).toBe(values);
    expect(getNextSortedValues(values, 30, -1, options(0))).toBe(values);
    // No room between the neighbors.
    const crowded = [10, 20, 30];
    expect(getNextSortedValues(crowded, 15, 1, options(15))).toBe(crowded);
  });

  it("[SLD-L44] decimal steps stay clean", () => {
    expect(getNextSortedValues([0.1, 0.9], 0.30000000000000004, 0, options(0, 0.1))).toEqual([
      0.3, 0.9,
    ]);
    expect(
      getNextSortedValues([0.2], 0.1 + 0.2, 0, {
        min: 0,
        max: 1,
        step: 0.1,
        minStepsBetweenThumbs: 0,
      }),
    ).toEqual([0.3]);
  });
});

describe("thumb offset and labels", () => {
  it("[SLD-L50] the thumb stays inside the track at every percentage, in both signs", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.integer({ min: 2, max: 60 }),
        fc.integer({ min: 100, max: 2000 }),
        fc.constantFrom<1 | -1>(1, -1),
        (percent, thumb, track, sign) => {
          const offset = getThumbInBoundsOffset(thumb, percent, sign);
          // Distance of the thumb's near edge from the track's anchored edge. The -50% translate moves the
          // thumb toward the left, i.e. toward the anchored edge for `left` and away from it for `right`.
          const anchored = (percent / 100) * track + offset;
          const distance = sign === 1 ? anchored - thumb / 2 : anchored + thumb / 2;
          expect(distance).toBeGreaterThanOrEqual(-1e-9);
          expect(distance).toBeLessThanOrEqual(track - thumb + 1e-9);
        },
      ),
      SEED,
    );
  });

  it("[SLD-L51] the offset is half the thumb at 0%, minus half at 100% and 0 in the middle", () => {
    expect(getThumbInBoundsOffset(20, 0, 1)).toBe(10);
    expect(getThumbInBoundsOffset(20, 50, 1)).toBe(0);
    expect(getThumbInBoundsOffset(20, 100, 1)).toBe(-10);
    expect(getThumbInBoundsOffset(20, 0, -1)).toBe(-10);
    expect(getThumbInBoundsOffset(20, 100, -1)).toBe(-30);
    expect(getThumbInBoundsOffset(0, 37, 1)).toBe(0);
  });

  it("[SLD-L52] default labels: Minimum/Maximum for two thumbs, Value i of n for more, none for one", () => {
    expect(getThumbLabel(0, 1)).toBeUndefined();
    expect(getThumbLabel(0, 2)).toBe("Minimum");
    expect(getThumbLabel(1, 2)).toBe("Maximum");
    expect(getThumbLabel(1, 3)).toBe("Value 2 of 3");
    expect(getThumbLabel(0, 0)).toBeUndefined();
  });
});

describe("slider keys", () => {
  it("[SLD-L60] Home and End are absolute in every direction", () => {
    for (const direction of DIRECTIONS) {
      expect(getKeyAction("Home", false, direction)).toEqual({ kind: "min" });
      expect(getKeyAction("End", true, direction)).toEqual({ kind: "max" });
    }
  });

  it("[SLD-L61] arrows follow the direction like Radix", () => {
    const up = { kind: "step", direction: 1, large: false };
    const down = { kind: "step", direction: -1, large: false };
    expect(getKeyAction("ArrowRight", false, "from-left")).toEqual(up);
    expect(getKeyAction("ArrowUp", false, "from-left")).toEqual(up);
    expect(getKeyAction("ArrowLeft", false, "from-left")).toEqual(down);
    expect(getKeyAction("ArrowDown", false, "from-left")).toEqual(down);
    expect(getKeyAction("ArrowLeft", false, "from-right")).toEqual(up);
    expect(getKeyAction("ArrowRight", false, "from-right")).toEqual(down);
    expect(getKeyAction("ArrowUp", false, "from-bottom")).toEqual(up);
    expect(getKeyAction("ArrowDown", false, "from-bottom")).toEqual(down);
    expect(getKeyAction("ArrowDown", false, "from-top")).toEqual(up);
    expect(getKeyAction("ArrowUp", false, "from-top")).toEqual(down);
    expect(getKeyAction("a", false, "from-left")).toBeUndefined();
  });

  it("[SLD-L62] Shift+Arrow and PageUp/PageDown are large steps", () => {
    expect(getKeyAction("ArrowRight", true, "from-left")).toEqual({
      kind: "step",
      direction: 1,
      large: true,
    });
    expect(getKeyAction("PageUp", false, "from-right")).toEqual({
      kind: "step",
      direction: 1,
      large: true,
    });
    expect(getKeyAction("PageDown", false, "from-right")).toEqual({
      kind: "step",
      direction: -1,
      large: true,
    });
  });

  it("[SLD-L63] getKeyValue applies one step, ten steps or the ends", () => {
    expect(getKeyValue({ kind: "step", direction: 1, large: false }, 5, 0, 100, 2)).toBe(7);
    expect(getKeyValue({ kind: "step", direction: -1, large: true }, 50, 0, 100, 2)).toBe(30);
    expect(getKeyValue({ kind: "min" }, 50, 10, 90, 2)).toBe(10);
    expect(getKeyValue({ kind: "max" }, 50, 10, 90, 2)).toBe(90);
  });

  it("[SLD-L64] opposite arrows cancel out in every direction", () => {
    fc.assert(
      fc.property(fc.constantFrom(...DIRECTIONS), fc.boolean(), (direction, shift) => {
        const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
        const actions = keys.map((k) => getKeyAction(k, shift, direction));
        const total = actions.reduce((sum, a) => sum + (a?.kind === "step" ? a.direction : 0), 0);
        expect(total).toBe(0);
        expect(actions.every((a) => a !== undefined)).toBe(true);
      }),
      SEED,
    );
  });
});
