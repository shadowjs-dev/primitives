import { createRoot, flushSync, onCleanup, untrack, useEffect, useSignal } from "@shadow-js/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRevealer, scrollIntoScroller } from "../src/utils/reveal";

afterEach(() => {
  document.body.replaceChildren();
});

/** A scroller of `height` px (`clientHeight`), `content` px tall, drawn at `drawn` px on screen, with one row. */
function fixture(options: {
  height: number;
  content: number;
  drawn: number;
  row: [number, number];
}) {
  const scroller = document.createElement("div");
  const item = document.createElement("div");
  scroller.append(item);
  document.body.append(scroller);
  Object.defineProperty(scroller, "clientHeight", { configurable: true, value: options.height });
  Object.defineProperty(scroller, "offsetHeight", { configurable: true, value: options.height });
  Object.defineProperty(scroller, "scrollHeight", { configurable: true, value: options.content });
  const rect = (top: number, height: number): DOMRect =>
    ({ x: 0, y: top, top, left: 0, width: 50, height, right: 50, bottom: top + height }) as DOMRect;
  scroller.getBoundingClientRect = () => rect(100, options.drawn);
  item.getBoundingClientRect = () => rect(options.row[0], options.row[1] - options.row[0]);
  return { scroller, item };
}

describe("scrollIntoScroller", () => {
  it("[REV-01] scrolls down just enough for an item below the scroller", () => {
    const { scroller, item } = fixture({ height: 200, content: 800, drawn: 200, row: [260, 330] });
    scrollIntoScroller(scroller, item);
    // The row ends 30px below the scroller's bottom (300).
    expect(scroller.scrollTop).toBe(30);
  });

  it("[REV-02] scrolls up for an item above it", () => {
    const { scroller, item } = fixture({ height: 200, content: 800, drawn: 200, row: [60, 90] });
    scroller.scrollTop = 100;
    scrollIntoScroller(scroller, item);
    expect(scroller.scrollTop).toBe(60);
  });

  it("[REV-03] leaves a visible item and a scroller that does not scroll alone", () => {
    const visible = fixture({ height: 200, content: 800, drawn: 200, row: [150, 180] });
    scrollIntoScroller(visible.scroller, visible.item);
    expect(visible.scroller.scrollTop).toBe(0);
    const still = fixture({ height: 200, content: 200, drawn: 200, row: [400, 430] });
    scrollIntoScroller(still.scroller, still.item);
    expect(still.scroller.scrollTop).toBe(0);
  });

  it("[REV-04] converts screen pixels to the scroller's own while it is scaled", () => {
    // Drawn at half size (100px for 200): 30 screen pixels are 60 of its own.
    const { scroller, item } = fixture({ height: 200, content: 800, drawn: 100, row: [160, 230] });
    scrollIntoScroller(scroller, item);
    expect(scroller.scrollTop).toBe(60);
  });
});

describe("createRevealer", () => {
  it("[REV-10] reveals now and again on the next frame, and cancel drops the pending frame", () => {
    const frames: Array<() => void> = [];
    const canceled: number[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => canceled.push(id));
    const { scroller, item } = fixture({ height: 200, content: 800, drawn: 200, row: [260, 330] });
    const revealer = createRevealer(() => ({ scroller, item }));
    revealer.reveal();
    expect(scroller.scrollTop).toBe(30);
    // The layout changes before the next frame (scroll buttons took room): the second pass corrects it.
    item.getBoundingClientRect = () =>
      ({
        top: 290,
        bottom: 320,
        height: 30,
        y: 290,
        x: 0,
        left: 0,
        width: 50,
        right: 50,
      }) as DOMRect;
    frames[0]?.();
    expect(scroller.scrollTop).toBe(50);
    revealer.reveal();
    revealer.cancel();
    expect(canceled).toEqual([1, 2]);
    vi.unstubAllGlobals();
  });

  it("[REV-12] looks up the target once per pass: now and on the next frame, one call each", () => {
    const frames: Array<() => void> = [];
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    const { scroller, item } = fixture({ height: 200, content: 800, drawn: 200, row: [260, 330] });
    const find = vi.fn(() => ({ scroller, item }));
    const revealer = createRevealer(find);
    revealer.reveal();
    expect(find).toHaveBeenCalledTimes(1);
    frames[0]?.();
    expect(find).toHaveBeenCalledTimes(2);
    revealer.cancel();
    vi.unstubAllGlobals();
  });

  it("[REV-13] find's reads are tracked by the effect that calls reveal, so callers untrack them", () => {
    const [value, setValue] = useSignal(0);
    const { scroller, item } = fixture({ height: 200, content: 800, drawn: 200, row: [260, 330] });
    const reads: number[] = [];
    const revealer = createRevealer(() => {
      reads.push(value());
      return { scroller, item };
    });
    createRoot((dispose) => {
      useEffect(() => {
        revealer.reveal();
      });
      onCleanup(dispose);
    });
    flushSync();
    expect(reads.length).toBeGreaterThan(0);
    const before = reads.length;
    setValue(1);
    flushSync();
    // The effect depends on what find read: the write re-runs it.
    expect(reads.length).toBeGreaterThan(before);
    revealer.cancel();
  });

  it("[REV-14] wrapped in untrack, find's reads do not re-run the effect that calls reveal", () => {
    const [value, setValue] = useSignal(0);
    const { scroller, item } = fixture({ height: 200, content: 800, drawn: 200, row: [260, 330] });
    let runs = 0;
    const revealer = createRevealer(() => {
      untrack(value);
      return { scroller, item };
    });
    createRoot((dispose) => {
      useEffect(() => {
        runs += 1;
        untrack(revealer.reveal);
      });
      onCleanup(dispose);
    });
    flushSync();
    expect(runs).toBe(1);
    setValue(1);
    flushSync();
    expect(runs).toBe(1);
    revealer.cancel();
  });

  it("[REV-11] does nothing while there is nothing to reveal", () => {
    const revealer = createRevealer(() => undefined);
    expect(() => {
      revealer.reveal();
      revealer.cancel();
    }).not.toThrow();
  });
});
