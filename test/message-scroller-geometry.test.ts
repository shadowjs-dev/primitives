import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  alignPosition,
  anchorPosition,
  clampPosition,
  edgesOf,
  prependCorrection,
  spacerHeight,
  visibilityOf,
} from "../src/message-scroller/geometry";

const SEED = { seed: 42, numRuns: 200 };

describe("message scroller geometry", () => {
  it("[MSC-G-01] edges: the start edge needs a scroll beyond the threshold, the end edge measures the real bottom without the spacer", () => {
    expect(edgesOf({ scrollTop: 0, clientHeight: 400, scrollHeight: 1000, spacer: 0 }, 8)).toEqual({
      start: false,
      end: true,
    });
    expect(edgesOf({ scrollTop: 9, clientHeight: 400, scrollHeight: 1000, spacer: 0 }, 8)).toEqual({
      start: true,
      end: true,
    });
    expect(
      edgesOf({ scrollTop: 600, clientHeight: 400, scrollHeight: 1000, spacer: 0 }, 8),
    ).toEqual({ start: true, end: false });
    // 300 of the 1000 is room kept under the last turn: with the window at 300 to 700 the reader sees the whole real content.
    expect(
      edgesOf({ scrollTop: 300, clientHeight: 400, scrollHeight: 1000, spacer: 300 }, 8).end,
    ).toBe(false);
    // The threshold counts as being at the edge.
    expect(
      edgesOf({ scrollTop: 592, clientHeight: 400, scrollHeight: 1000, spacer: 0 }, 8).end,
    ).toBe(false);
    expect(
      edgesOf({ scrollTop: 591, clientHeight: 400, scrollHeight: 1000, spacer: 0 }, 8).end,
    ).toBe(true);
  });

  it("[MSC-G-02] an anchored turn is placed at its top minus the margin and the peek, never above the start", () => {
    expect(anchorPosition(900, 0, 64)).toBe(836);
    expect(anchorPosition(900, 10, 64)).toBe(826);
    expect(anchorPosition(30, 0, 64)).toBe(0);
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }),
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 0, max: 200 }),
        (top, margin, peek) => {
          const position = anchorPosition(top, margin, peek);
          expect(position).toBeGreaterThanOrEqual(0);
          expect(position).toBeLessThanOrEqual(top);
        },
      ),
      SEED,
    );
  });

  it("[MSC-G-03] the spacer is the part of the window the turn and its reply do not cover, and is zero once they cover it", () => {
    expect(spacerHeight(600, 900, 1000, 0, 64)).toBe(436);
    expect(spacerHeight(600, 900, 1700, 0, 64)).toBe(0);
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1500 }),
        fc.integer({ min: 0, max: 4000 }),
        fc.integer({ min: 0, max: 3000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (client, anchorTop, extent, margin, peek) => {
          const spacer = spacerHeight(client, anchorTop, anchorTop + extent, margin, peek);
          expect(spacer).toBeGreaterThanOrEqual(0);
          // With the room kept, the turn can be scrolled to the anchor position and still fill the window.
          if (spacer > 0)
            expect(anchorTop + extent + spacer - (anchorTop - margin - peek)).toBe(client);
        },
      ),
      SEED,
    );
  });

  it("[MSC-G-04] alignment: start, end, center and nearest, clamped to the content", () => {
    const metrics = { scrollTop: 200, clientHeight: 400, scrollHeight: 2000 };
    const item = { top: 1000, height: 100 };
    expect(alignPosition("start", item, metrics, 0)).toBe(1000);
    expect(alignPosition("start", item, metrics, 20)).toBe(980);
    expect(alignPosition("end", item, metrics, 0)).toBe(700);
    expect(alignPosition("center", item, metrics, 0)).toBe(850);
    // Nearest: already visible, no move; above, the start edge; below, the end edge.
    expect(alignPosition("nearest", { top: 300, height: 50 }, metrics, 0)).toBe(200);
    expect(alignPosition("nearest", { top: 100, height: 50 }, metrics, 0)).toBe(100);
    expect(alignPosition("nearest", item, metrics, 0)).toBe(700);
    expect(alignPosition("start", { top: 1990, height: 10 }, metrics, 0)).toBe(1600);
    expect(alignPosition("start", { top: 0, height: 10 }, metrics, 40)).toBe(0);
  });

  it("[MSC-G-05] a position is always inside the content, even for a window taller than the content", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -500, max: 6000 }),
        fc.integer({ min: 1, max: 1200 }),
        fc.integer({ min: 0, max: 4000 }),
        (position, client, height) => {
          const result = clampPosition(position, { clientHeight: client, scrollHeight: height });
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(Math.max(0, height - client));
        },
      ),
      SEED,
    );
    expect(clampPosition(50, { clientHeight: 500, scrollHeight: 300 })).toBe(0);
  });

  it("[MSC-G-06] the correction after rows were added above is the shift of the row the reader was looking at, and nothing for a subpixel change", () => {
    expect(prependCorrection(40, 340)).toBe(300);
    expect(prependCorrection(40, 40)).toBe(0);
    expect(prependCorrection(40, 40.3)).toBe(0);
    expect(prependCorrection(40, 10)).toBe(-30);
  });

  it("[MSC-G-07] visibility: the current anchor is the last one at or above the top and stays set after it scrolls away; visible ids are in order", () => {
    const boxes = [
      { id: "q1", anchor: true, top: 0, bottom: 100 },
      { id: "a1", anchor: false, top: 100, bottom: 500 },
      { id: "q2", anchor: true, top: 500, bottom: 600 },
      { id: "a2", anchor: false, top: 600, bottom: 1400 },
    ];
    expect(visibilityOf(boxes, 0, 300)).toEqual({
      currentAnchorId: "q1",
      visibleMessageIds: ["q1", "a1"],
    });
    expect(visibilityOf(boxes, 200, 350)).toEqual({
      currentAnchorId: "q1",
      visibleMessageIds: ["a1", "q2"],
    });
    expect(visibilityOf(boxes, 700, 300)).toEqual({
      currentAnchorId: "q2",
      visibleMessageIds: ["a2"],
    });
    expect(visibilityOf([], 0, 300)).toEqual({ currentAnchorId: null, visibleMessageIds: [] });
    expect(
      visibilityOf([{ id: "x", anchor: false, top: 0, bottom: 10 }], 0, 300).currentAnchorId,
    ).toBeNull();
  });
});
