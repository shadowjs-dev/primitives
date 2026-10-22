import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Align, ComputeInput, PositionOptions, Rect, Side } from "../src/utils/position";
import { computePosition, intersectRects, normalizePadding } from "../src/utils/position";

const PROPERTY = { seed: 42, numRuns: 500 } as const;
const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];
const ALIGNS: readonly Align[] = ["start", "center", "end"];

const boundary: Rect = { x: 0, y: 0, width: 1000, height: 800 };
const anchor: Rect = { x: 100, y: 100, width: 40, height: 20 };
const floating = { width: 60, height: 30 };

function run(options: PositionOptions, overrides: Partial<ComputeInput> = {}) {
  return computePosition({ anchor, floating, boundary, options, ...overrides });
}

describe("position: placement table", () => {
  // anchor 100,100 40x20; floating 60x30; sideOffset 5; nothing collides.
  const rows: Array<[Side, Align, "ltr" | "rtl", number, number]> = [
    ["bottom", "start", "ltr", 100, 125],
    ["bottom", "center", "ltr", 90, 125],
    ["bottom", "end", "ltr", 80, 125],
    ["bottom", "start", "rtl", 80, 125],
    ["bottom", "center", "rtl", 90, 125],
    ["bottom", "end", "rtl", 100, 125],
    ["top", "start", "ltr", 100, 65],
    ["top", "center", "ltr", 90, 65],
    ["top", "end", "ltr", 80, 65],
    ["top", "start", "rtl", 80, 65],
    ["top", "center", "rtl", 90, 65],
    ["top", "end", "rtl", 100, 65],
    ["right", "start", "ltr", 145, 100],
    ["right", "center", "ltr", 145, 95],
    ["right", "end", "ltr", 145, 90],
    ["right", "start", "rtl", 145, 100],
    ["right", "center", "rtl", 145, 95],
    ["right", "end", "rtl", 145, 90],
    ["left", "start", "ltr", 35, 100],
    ["left", "center", "ltr", 35, 95],
    ["left", "end", "ltr", 35, 90],
    ["left", "start", "rtl", 35, 100],
    ["left", "center", "rtl", 35, 95],
    ["left", "end", "rtl", 35, 90],
  ];
  it.each(rows)("[POS-01] %s %s %s -> x %d, y %d", (side, align, dir, x, y) => {
    const result = run({ side, align, dir, sideOffset: 5 });
    expect([result.x, result.y, result.side, result.align]).toEqual([x, y, side, align]);
  });

  it("[POS-02] defaults are side bottom, align center, ltr, no offset", () => {
    const result = run({});
    expect([result.x, result.y, result.side, result.align]).toEqual([90, 120, "bottom", "center"]);
  });

  it("[POS-03] alignOffset moves inward from the aligned edge and flips with end and rtl", () => {
    const at = (options: PositionOptions) => {
      const { x, y } = run({ alignOffset: 7, ...options });
      return [x, y];
    };
    expect(at({ side: "bottom", align: "start" })).toEqual([107, 120]);
    expect(at({ side: "bottom", align: "end" })).toEqual([73, 120]);
    expect(at({ side: "bottom", align: "start", dir: "rtl" })).toEqual([73, 120]);
    expect(at({ side: "bottom", align: "end", dir: "rtl" })).toEqual([107, 120]);
    expect(at({ side: "right", align: "start" })).toEqual([140, 107]);
    expect(at({ side: "right", align: "end" })).toEqual([140, 83]);
    expect(at({ side: "left", align: "start", dir: "rtl" })).toEqual([40, 107]);
    // Radix ignores alignOffset for a centered box.
    expect(at({ side: "bottom", align: "center" })).toEqual([90, 120]);
  });

  it("[POS-04] reports the anchor size", () => {
    const result = run({});
    expect([result.anchorWidth, result.anchorHeight]).toEqual([40, 20]);
  });
});

describe("position: flip", () => {
  const tight: Rect = { x: 0, y: 0, width: 1000, height: 100 };
  it("[POS-05] flips to the opposite side when the preferred one overflows and the other fits", () => {
    const low = { x: 100, y: 760, width: 40, height: 20 };
    const result = run({ side: "bottom", sideOffset: 10 }, { anchor: low });
    expect([result.side, result.y]).toEqual(["top", 720]);
    const high = { x: 100, y: 10, width: 40, height: 20 };
    expect(run({ side: "top" }, { anchor: high }).side).toBe("bottom");
    expect(run({ side: "left" }, { anchor: { ...anchor, x: 10 } }).side).toBe("right");
    expect(run({ side: "right" }, { anchor: { ...anchor, x: 950 } }).side).toBe("left");
  });

  it("[POS-06] the offset counts toward the overflow", () => {
    const edge = { x: 100, y: 740, width: 40, height: 20 }; // bottom edge at 760, floating 30
    expect(run({ side: "bottom", sideOffset: 0 }, { anchor: edge }).side).toBe("bottom");
    expect(run({ side: "bottom", sideOffset: 20 }, { anchor: edge }).side).toBe("top");
  });

  it("[POS-07] keeps the preferred side when neither fits and the opposite is not roomier", () => {
    const box = { width: 60, height: 90 };
    const tie = { x: 100, y: 40, width: 40, height: 20 };
    expect(run({ side: "top" }, { anchor: tie, boundary: tight, floating: box }).side).toBe("top");
    expect(run({ side: "bottom" }, { anchor: tie, boundary: tight, floating: box }).side).toBe(
      "bottom",
    );
  });

  it("[POS-08] falls back to the side with the most room when neither fits", () => {
    const box = { width: 60, height: 90 };
    const high = { x: 100, y: 30, width: 40, height: 20 }; // above: 30, below: 50
    const result = run({ side: "top" }, { anchor: high, boundary: tight, floating: box });
    expect(result.side).toBe("bottom");
  });

  it("[POS-09] collision padding shrinks the room before flipping", () => {
    const edge = { x: 100, y: 740, width: 40, height: 20 };
    expect(run({ side: "bottom" }, { anchor: edge }).side).toBe("bottom");
    expect(run({ side: "bottom", collisionPadding: 20 }, { anchor: edge }).side).toBe("top");
    expect(run({ side: "bottom", collisionPadding: { top: 500 } }, { anchor: edge }).side).toBe(
      "bottom",
    );
  });

  it("[POS-10] avoidCollisions false never flips or shifts", () => {
    const low = { x: -20, y: 790, width: 40, height: 20 };
    const result = run({ side: "bottom", avoidCollisions: false }, { anchor: low });
    expect([result.side, result.x, result.y]).toEqual(["bottom", -30, 810]);
  });
});

describe("position: shift and sticky", () => {
  it("[POS-11] shifts along the cross axis to stay inside the boundary", () => {
    const left = { x: 5, y: 100, width: 20, height: 20 };
    const wide = { width: 100, height: 30 };
    expect(run({}, { anchor: left, floating: wide }).x).toBe(0);
    expect(run({ collisionPadding: 8 }, { anchor: left, floating: wide }).x).toBe(8);
    const right = { x: 980, y: 100, width: 10, height: 20 };
    expect(run({}, { anchor: right, floating: wide }).x).toBe(900);
    expect(run({ collisionPadding: { right: 20 } }, { anchor: right, floating: wide }).x).toBe(880);
    const top = { x: 100, y: 5, width: 20, height: 10 };
    const tall = { width: 30, height: 100 };
    expect(run({ side: "right" }, { anchor: top, floating: tall }).y).toBe(0);
  });

  it("[POS-12] partial sticky keeps the box attached to a departed anchor, always does not", () => {
    const gone = { x: -500, y: 100, width: 20, height: 20 };
    const wide = { width: 100, height: 30 };
    expect(run({ sticky: "partial" }, { anchor: gone, floating: wide }).x).toBe(-480);
    expect(run({}, { anchor: gone, floating: wide }).x).toBe(-480);
    expect(run({ sticky: "always" }, { anchor: gone, floating: wide }).x).toBe(0);
  });

  it("[POS-13] a box larger than the boundary aligns to the start edge", () => {
    const small: Rect = { x: 50, y: 0, width: 200, height: 800 };
    const huge = { width: 300, height: 30 };
    const near = { x: 100, y: 100, width: 40, height: 20 };
    expect(run({ sticky: "always" }, { boundary: small, floating: huge, anchor: near }).x).toBe(50);
    expect(run({}, { boundary: small, floating: huge, anchor: near }).x).toBe(50);
    const tall = { width: 60, height: 900 };
    expect(run({ side: "right" }, { floating: tall }).y).toBe(0);
  });

  it("[POS-14] sizes may be 0 and non-finite inputs count as 0", () => {
    const empty = run({}, { floating: { width: 0, height: 0 } });
    expect([empty.x, empty.y]).toEqual([120, 120]);
    const dirty = run(
      { sideOffset: Number.NaN, alignOffset: Number.POSITIVE_INFINITY },
      {
        anchor: { x: Number.NaN, y: 100, width: Number.POSITIVE_INFINITY, height: 20 },
        floating: { width: Number.NaN, height: -4 },
      },
    );
    expect([dirty.x, dirty.y]).toEqual([0, 120]);
  });
});

describe("position: arrow and transform origin", () => {
  const arrow = { width: 10, height: 5 };
  it("[POS-15] the arrow is centered on the anchor and its height joins the side offset", () => {
    const result = run({ sideOffset: 3 }, { arrow });
    expect([result.x, result.y]).toEqual([90, 128]);
    expect(result.arrow).toEqual({ x: 25, y: undefined });
    expect(result.arrowCannotCenter).toBe(false);
    const side = run({ side: "right" }, { arrow });
    // Along y the arrow's own height (5) is its extent: 110 - 95 - 2.5.
    expect(side.arrow).toEqual({ x: undefined, y: 12.5 });
    expect([side.x, side.y]).toEqual([145, 95]);
  });

  it("[POS-16] a shifted box clamps the arrow and reports that it cannot center", () => {
    const edge = { x: 0, y: 100, width: 20, height: 20 };
    const wide = { width: 100, height: 30 };
    const plain = run({}, { anchor: edge, floating: wide, arrow });
    expect(plain.x).toBe(0);
    expect(plain.arrow.x).toBe(5);
    expect(plain.arrowCannotCenter).toBe(false);
    const padded = run({ arrowPadding: 8 }, { anchor: edge, floating: wide, arrow });
    expect(padded.arrow.x).toBe(8);
    expect(padded.arrowCannotCenter).toBe(true);
    const far = { x: -200, y: 100, width: 20, height: 20 };
    const clamped = run({ sticky: "always" }, { anchor: far, floating: wide, arrow });
    expect([clamped.arrow.x, clamped.arrowCannotCenter]).toEqual([0, true]);
  });

  it("[POS-17] without an arrow nothing is reported", () => {
    const result = run({});
    expect(result.arrow).toEqual({ x: undefined, y: undefined });
    expect(result.arrowCannotCenter).toBe(false);
  });

  it("[POS-18] an arrow wider than the box is centered in it", () => {
    const result = run({}, { floating: { width: 4, height: 30 }, arrow });
    expect(result.arrow.x).toBe(-3);
  });

  it("[POS-19] transform origin without an arrow follows side and align (rtl mirrors)", () => {
    expect(run({}).transformOrigin).toBe("50% 0px");
    expect(run({ side: "top" }).transformOrigin).toBe("50% 30px");
    expect(run({ side: "bottom", align: "start" }).transformOrigin).toBe("0% 0px");
    expect(run({ side: "bottom", align: "end" }).transformOrigin).toBe("100% 0px");
    expect(run({ side: "bottom", align: "start", dir: "rtl" }).transformOrigin).toBe("100% 0px");
    expect(run({ side: "right", align: "start" }).transformOrigin).toBe("0px 0%");
    expect(run({ side: "right", align: "end", dir: "rtl" }).transformOrigin).toBe("0px 100%");
    expect(run({ side: "left", align: "center" }).transformOrigin).toBe("60px 50%");
  });

  it("[POS-20] transform origin points at the arrow tip when it can be centered", () => {
    const arrow = { width: 10, height: 5 };
    expect(run({}, { arrow }).transformOrigin).toBe("30px -5px");
    expect(run({ side: "top" }, { arrow }).transformOrigin).toBe("30px 35px");
    expect(run({ side: "right" }, { arrow }).transformOrigin).toBe("-5px 15px");
    expect(run({ side: "left" }, { arrow }).transformOrigin).toBe("65px 15px");
    const edge = { x: 0, y: 100, width: 20, height: 20 };
    const clamped = run(
      { arrowPadding: 8, align: "start" },
      { anchor: edge, floating: { width: 100, height: 30 }, arrow },
    );
    expect(clamped.transformOrigin).toBe("0% -5px");
  });
});

describe("position: available size and hiding", () => {
  it("[POS-21] available height is the room from the box's anchor-facing edge to the boundary", () => {
    expect(run({ side: "bottom" }).availableHeight).toBe(680);
    expect(run({ side: "top" }).availableHeight).toBe(100);
    expect(run({ side: "bottom", sideOffset: 10 }).availableHeight).toBe(670);
    expect(run({ side: "bottom", collisionPadding: 20 }).availableHeight).toBe(660);
  });

  it("[POS-22] available width on a horizontal side depends on align", () => {
    expect(run({ side: "bottom", align: "start" }).availableWidth).toBe(900);
    expect(run({ side: "bottom", align: "end" }).availableWidth).toBe(140);
    expect(run({ side: "bottom", align: "start", dir: "rtl" }).availableWidth).toBe(140);
    // centered and shiftable: the whole boundary is usable
    expect(run({ side: "bottom", align: "center" }).availableWidth).toBe(1000);
    expect(run({ side: "bottom", align: "center", avoidCollisions: false }).availableWidth).toBe(
      910,
    );
  });

  it("[POS-23] available size on a vertical side", () => {
    expect(run({ side: "right" }).availableWidth).toBe(860);
    expect(run({ side: "left" }).availableWidth).toBe(100);
    expect(run({ side: "right", align: "start" }).availableHeight).toBe(700);
    expect(run({ side: "right", align: "end" }).availableHeight).toBe(120);
    expect(run({ side: "right", align: "center" }).availableHeight).toBe(800);
  });

  it("[POS-24] available size is never negative", () => {
    const result = run({ side: "bottom", collisionPadding: 5000 });
    expect([result.availableWidth, result.availableHeight]).toEqual([0, 0]);
  });

  it("[POS-25] anchorHidden only with hideWhenDetached and when entirely clipped", () => {
    const gone = { x: 100, y: -50, width: 40, height: 20 };
    expect(run({ hideWhenDetached: true }, { anchor: gone }).anchorHidden).toBe(true);
    expect(run({}, { anchor: gone }).anchorHidden).toBe(false);
    expect(run({ hideWhenDetached: true }).anchorHidden).toBe(false);
    const half = { x: 100, y: -10, width: 40, height: 20 };
    expect(run({ hideWhenDetached: true }, { anchor: half }).anchorHidden).toBe(false);
    const touching = { x: 100, y: -20, width: 40, height: 20 };
    expect(run({ hideWhenDetached: true }, { anchor: touching }).anchorHidden).toBe(true);
    const point = { x: 0, y: 5, width: 0, height: 0 };
    expect(run({ hideWhenDetached: true }, { anchor: point }).anchorHidden).toBe(false);
  });

  it("[POS-26] anchorHidden uses anchorClip when given", () => {
    const clip = { x: 0, y: 300, width: 1000, height: 100 };
    expect(run({ hideWhenDetached: true }, { anchorClip: clip }).anchorHidden).toBe(true);
  });
});

describe("position: helpers", () => {
  it("[POS-27] normalizePadding accepts numbers, partial records and junk", () => {
    expect(normalizePadding(4)).toEqual({ top: 4, right: 4, bottom: 4, left: 4 });
    expect(normalizePadding({ left: 2, top: -3 })).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 2,
    });
    expect(normalizePadding(undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(normalizePadding(Number.NaN)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("[POS-28] intersectRects returns the common area and never a negative size", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    expect(intersectRects([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    expect(intersectRects([a])).toEqual(a);
    expect(intersectRects([a, { x: 5, y: 6, width: 10, height: 10 }])).toEqual({
      x: 5,
      y: 6,
      width: 5,
      height: 4,
    });
    expect(intersectRects([a, { x: 50, y: 50, width: 5, height: 5 }])).toEqual({
      x: 50,
      y: 50,
      width: 0,
      height: 0,
    });
  });
});

const number = fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true });
const size = fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true });
const sideArb = fc.constantFrom(...SIDES);
const alignArb = fc.constantFrom(...ALIGNS);
const rectArb = fc.record({ x: number, y: number, width: size, height: size });
const anyDouble = fc.double({ noNaN: false });

describe("position: properties", () => {
  it("[POS-P1] never returns NaN or Infinity, whatever the inputs", () => {
    fc.assert(
      fc.property(
        fc.record({ x: anyDouble, y: anyDouble, width: anyDouble, height: anyDouble }),
        fc.record({ width: anyDouble, height: anyDouble }),
        fc.record({ x: anyDouble, y: anyDouble, width: anyDouble, height: anyDouble }),
        fc.record({ width: anyDouble, height: anyDouble }),
        sideArb,
        alignArb,
        fc.constantFrom<"ltr" | "rtl">("ltr", "rtl"),
        fc.array(anyDouble, { minLength: 4, maxLength: 4 }),
        fc.boolean(),
        (anchorRect, box, bounds, arrow, side, align, dir, numbers, avoid) => {
          const [sideOffset = 0, alignOffset = 0, pad = 0, arrowPadding = 0] = numbers;
          const result = computePosition({
            anchor: anchorRect,
            floating: box,
            boundary: bounds,
            arrow,
            options: {
              side,
              align,
              dir,
              sideOffset,
              alignOffset,
              collisionPadding: pad,
              arrowPadding,
              avoidCollisions: avoid,
              hideWhenDetached: true,
            },
          });
          const values = [
            result.x,
            result.y,
            result.arrow.x ?? 0,
            result.arrow.y ?? 0,
            result.availableWidth,
            result.availableHeight,
            result.anchorWidth,
            result.anchorHeight,
          ];
          expect(values.every(Number.isFinite)).toBe(true);
          expect(result.transformOrigin).not.toMatch(/NaN|Infinity/);
        },
      ),
      PROPERTY,
    );
  });

  it("[POS-P2] with avoidCollisions false the result is exactly the requested placement", () => {
    fc.assert(
      fc.property(
        rectArb,
        fc.record({ width: size, height: size }),
        rectArb,
        sideArb,
        alignArb,
        fc.constantFrom<"ltr" | "rtl">("ltr", "rtl"),
        number,
        number,
        (anchorRect, box, bounds, side, align, dir, sideOffset, alignOffset) => {
          const result = computePosition({
            anchor: anchorRect,
            floating: box,
            boundary: bounds,
            options: { side, align, dir, sideOffset, alignOffset, avoidCollisions: false },
          });
          // Independent restatement of the placement rules.
          const sign =
            (align === "end" ? -1 : 1) *
            (dir === "rtl" && (side === "top" || side === "bottom") ? -1 : 1);
          const offset = align === "center" ? 0 : alignOffset * sign;
          const cross = (start: number, span: number, boxSpan: number, mirror: boolean): number => {
            if (align === "center") return start + (span - boxSpan) / 2;
            const low = start;
            const high = start + span - boxSpan;
            return (align === "start") !== mirror ? low : high;
          };
          let x: number;
          let y: number;
          if (side === "top" || side === "bottom") {
            x = cross(anchorRect.x, anchorRect.width, box.width, dir === "rtl") + offset;
            y =
              side === "top"
                ? anchorRect.y - box.height - sideOffset
                : anchorRect.y + anchorRect.height + sideOffset;
          } else {
            y = cross(anchorRect.y, anchorRect.height, box.height, false) + offset;
            x =
              side === "left"
                ? anchorRect.x - box.width - sideOffset
                : anchorRect.x + anchorRect.width + sideOffset;
          }
          expect(result.side).toBe(side);
          expect(result.x).toBeCloseTo(x, 6);
          expect(result.y).toBeCloseTo(y, 6);
        },
      ),
      PROPERTY,
    );
  });

  it("[POS-P3] a box that fits ends inside the padded boundary", () => {
    fc.assert(
      fc.property(
        fc.record({
          bx: number,
          by: number,
          bw: fc.double({ min: 200, max: 2000, noNaN: true }),
          bh: fc.double({ min: 200, max: 2000, noNaN: true }),
          pad: fc.double({ min: 0, max: 40, noNaN: true }),
          fw: fc.double({ min: 0, max: 100, noNaN: true }),
          fh: fc.double({ min: 0, max: 100, noNaN: true }),
          aw: fc.double({ min: 0, max: 100, noNaN: true }),
          ah: fc.double({ min: 0, max: 100, noNaN: true }),
          ux: fc.double({ min: 0, max: 1, noNaN: true }),
          uy: fc.double({ min: 0, max: 1, noNaN: true }),
          gap: fc.double({ min: 0, max: 30, noNaN: true }),
          alignOffset: fc.double({ min: -50, max: 50, noNaN: true }),
        }),
        sideArb,
        alignArb,
        fc.constantFrom<"ltr" | "rtl">("ltr", "rtl"),
        fc.constantFrom<"partial" | "always">("partial", "always"),
        (g, side, align, dir, sticky) => {
          const left = g.bx + g.pad;
          const top = g.by + g.pad;
          const right = g.bx + g.bw - g.pad;
          const bottom = g.by + g.bh - g.pad;
          // The anchor lies inside the padded boundary (the partial limiter relies on it).
          const a: Rect = {
            x: left + g.ux * (right - left - g.aw),
            y: top + g.uy * (bottom - top - g.ah),
            width: g.aw,
            height: g.ah,
          };
          // Only boxes with room on the side axis (before or after a flip) can end up inside.
          const roomBefore = (side === "top" || side === "bottom" ? a.y - top : a.x - left) - g.gap;
          const roomAfter =
            (side === "top" || side === "bottom"
              ? bottom - (a.y + a.height)
              : right - (a.x + a.width)) - g.gap;
          const along = side === "top" || side === "bottom" ? g.fh : g.fw;
          fc.pre(roomBefore >= along || roomAfter >= along);
          const result = computePosition({
            anchor: a,
            floating: { width: g.fw, height: g.fh },
            boundary: { x: g.bx, y: g.by, width: g.bw, height: g.bh },
            options: {
              side,
              align,
              dir,
              sticky,
              sideOffset: g.gap,
              alignOffset: g.alignOffset,
              collisionPadding: g.pad,
            },
          });
          const eps = 1e-6;
          expect(result.x).toBeGreaterThanOrEqual(left - eps);
          expect(result.y).toBeGreaterThanOrEqual(top - eps);
          expect(result.x + g.fw).toBeLessThanOrEqual(right + eps);
          expect(result.y + g.fh).toBeLessThanOrEqual(bottom + eps);
        },
      ),
      PROPERTY,
    );
  });

  it("[POS-P4] the side is the requested one or its opposite, and only flips with avoidCollisions", () => {
    fc.assert(
      fc.property(
        rectArb,
        fc.record({ width: size, height: size }),
        rectArb,
        sideArb,
        fc.boolean(),
        (anchorRect, box, bounds, side, avoid) => {
          const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" }[side];
          const result = computePosition({
            anchor: anchorRect,
            floating: box,
            boundary: bounds,
            options: { side, avoidCollisions: avoid },
          });
          expect([side, opposite]).toContain(result.side);
          if (!avoid) expect(result.side).toBe(side);
        },
      ),
      PROPERTY,
    );
  });

  it("[POS-P5] partial sticky never detaches the box from the anchor on the cross axis", () => {
    fc.assert(
      fc.property(
        rectArb,
        fc.record({ width: size, height: size }),
        rectArb,
        sideArb,
        alignArb,
        number,
        (anchorRect, box, bounds, side, align, alignOffset) => {
          const result = computePosition({
            anchor: anchorRect,
            floating: box,
            boundary: bounds,
            options: { side, align, alignOffset, sticky: "partial" },
          });
          const eps = 1e-6;
          if (result.side === "top" || result.side === "bottom") {
            expect(result.x).toBeLessThanOrEqual(anchorRect.x + anchorRect.width + eps);
            expect(result.x + box.width).toBeGreaterThanOrEqual(anchorRect.x - eps);
          } else {
            expect(result.y).toBeLessThanOrEqual(anchorRect.y + anchorRect.height + eps);
            expect(result.y + box.height).toBeGreaterThanOrEqual(anchorRect.y - eps);
          }
        },
      ),
      PROPERTY,
    );
  });

  it("[POS-P6] available sizes are never negative and the arrow stays inside a box that holds it", () => {
    fc.assert(
      fc.property(
        rectArb,
        fc.record({
          width: fc.double({ min: 40, max: 500, noNaN: true }),
          height: fc.double({ min: 40, max: 500, noNaN: true }),
        }),
        rectArb,
        sideArb,
        alignArb,
        fc.double({ min: 0, max: 15, noNaN: true }),
        (anchorRect, box, bounds, side, align, arrowPadding) => {
          const arrow = { width: 10, height: 10 };
          const result = computePosition({
            anchor: anchorRect,
            floating: box,
            boundary: bounds,
            arrow,
            options: { side, align, arrowPadding },
          });
          expect(result.availableWidth).toBeGreaterThanOrEqual(0);
          expect(result.availableHeight).toBeGreaterThanOrEqual(0);
          const offset = result.arrow.x ?? result.arrow.y;
          expect(offset).toBeDefined();
          expect(offset).toBeGreaterThanOrEqual(0);
          const extent = result.side === "top" || result.side === "bottom" ? box.width : box.height;
          expect(offset).toBeLessThanOrEqual(extent - 10 + 1e-9);
        },
      ),
      PROPERTY,
    );
  });

  it("[POS-P7] intersectRects is commutative, contained in each input and never negative", () => {
    fc.assert(
      fc.property(rectArb, rectArb, (a, b) => {
        const ab = intersectRects([a, b]);
        const ba = intersectRects([b, a]);
        expect(ab).toEqual(ba);
        expect(ab.width).toBeGreaterThanOrEqual(0);
        expect(ab.height).toBeGreaterThanOrEqual(0);
        if (ab.width > 0 && ab.height > 0) {
          for (const r of [a, b]) {
            expect(ab.x).toBeGreaterThanOrEqual(r.x);
            expect(ab.x + ab.width).toBeLessThanOrEqual(r.x + r.width + 1e-6);
          }
        }
      }),
      PROPERTY,
    );
  });
});
