import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  MIN_THUMB_SIZE,
  maxScroll,
  scrollbarVisible,
  scrollForOffset,
  thumbOffset,
  thumbSize,
} from "../src/scroll-area/logic";

const SEED = { seed: 42 };

describe("scroll area arithmetic", () => {
  it("[SCR-L01] the thumb is the track scaled by the visible share, never below the minimum, never above the track", () => {
    expect(thumbSize(200, 100, 400)).toBe(50);
    expect(thumbSize(200, 100, 100_000)).toBe(MIN_THUMB_SIZE);
    expect(thumbSize(200, 100, 100)).toBe(200);
    expect(thumbSize(200, 300, 100)).toBe(200);
    expect(thumbSize(0, 100, 400)).toBe(0);
  });

  it("[SCR-L02] the thumb offset is 0 at the start, the track minus the thumb at the end, and linear between", () => {
    expect(thumbOffset(200, 50, 0, 300)).toBe(0);
    expect(thumbOffset(200, 50, 300, 300)).toBe(150);
    expect(thumbOffset(200, 50, 150, 300)).toBe(75);
    expect(thumbOffset(200, 50, 999, 300)).toBe(150);
    expect(thumbOffset(200, 200, 10, 0)).toBe(0);
  });

  it("[SCR-L03] RTL scroll positions (negative) are read by their magnitude", () => {
    expect(thumbOffset(200, 50, -150, 300)).toBe(thumbOffset(200, 50, 150, 300));
  });

  it("[SCR-L07] in a reversed (RTL horizontal) bar the thumb starts at the far end, and both mappings follow it", () => {
    // Track 200, thumb 50, so travel 150 over 300 of scroll. Scroll 0 is the far (right) end.
    expect(thumbOffset(200, 50, 0, 300, true)).toBe(150);
    expect(thumbOffset(200, 50, 150, 300, true)).toBe(75);
    expect(thumbOffset(200, 50, -300, 300, true)).toBe(0);
    expect(scrollForOffset(150, 200, 50, 300, true)).toBe(0);
    expect(scrollForOffset(75, 200, 50, 300, true)).toBe(150);
    expect(scrollForOffset(0, 200, 50, 300, true)).toBe(300);
    expect(scrollForOffset(-20, 200, 50, 300, true)).toBe(300);
  });

  it("[SCR-L04] a pointer position maps to a scroll position, clamped to the range", () => {
    expect(scrollForOffset(75, 200, 50, 300)).toBe(150);
    expect(scrollForOffset(-20, 200, 50, 300)).toBe(0);
    expect(scrollForOffset(500, 200, 50, 300)).toBe(300);
    expect(scrollForOffset(10, 50, 50, 300)).toBe(0);
    expect(maxScroll(400, 100)).toBe(300);
    expect(maxScroll(50, 100)).toBe(0);
  });

  it("[SCR-L05] property: offset stays inside the track and the scroll position round-trips", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 0, max: 5000 }),
        (track, viewport, scroll) => {
          const content = viewport + Math.floor(scroll / 2) + 1;
          const thumb = thumbSize(track, viewport, content);
          const max = maxScroll(content, viewport);
          expect(thumb).toBeGreaterThan(0);
          expect(thumb).toBeLessThanOrEqual(track);
          // A thumb as long as the track has no travel, so nothing to round-trip.
          if (thumb === track) return;
          const position = Math.min(scroll, max);
          const offset = thumbOffset(track, thumb, position, max);
          expect(offset).toBeGreaterThanOrEqual(0);
          expect(offset).toBeLessThanOrEqual(Math.max(0, track - thumb) + 1e-9);
          const back = scrollForOffset(offset, track, thumb, max);
          expect(Math.abs(back - position)).toBeLessThan(1e-6 * Math.max(1, max));
        },
      ),
      SEED,
    );
  });

  it("[SCR-L06] each scrollbar type decides visibility from the same four facts", () => {
    const base = { overflowing: true, scrolling: false, hovering: false };
    expect(
      scrollbarVisible({ type: "always", overflowing: false, scrolling: false, hovering: false }),
    ).toBe(true);
    expect(scrollbarVisible({ ...base, type: "auto" })).toBe(true);
    expect(scrollbarVisible({ ...base, overflowing: false, type: "auto" })).toBe(false);
    expect(scrollbarVisible({ ...base, type: "hover" })).toBe(false);
    expect(scrollbarVisible({ ...base, hovering: true, type: "hover" })).toBe(true);
    expect(scrollbarVisible({ ...base, scrolling: true, type: "scroll" })).toBe(true);
    expect(scrollbarVisible({ ...base, overflowing: false, scrolling: true, type: "scroll" })).toBe(
      false,
    );
  });
});
