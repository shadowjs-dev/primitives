import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import { createToaster, type ToastItem } from "../src/toast/queue";
import {
  getSwipeDelta,
  getSwipeMoveBuffer,
  hasLeftDeadZone,
  isDeltaInDirection,
  isHorizontalSwipe,
  type SwipeDirection,
} from "../src/toast/swipe";

const SEED = { seed: 42 };
const DIRECTIONS: readonly SwipeDirection[] = ["right", "left", "up", "down"];
const OPPOSITE: Readonly<Record<SwipeDirection, SwipeDirection>> = {
  right: "left",
  left: "right",
  up: "down",
  down: "up",
};
const direction = fc.constantFrom(...DIRECTIONS);
const coordinate = fc.double({ min: -5000, max: 5000, noNaN: true });
const point = fc.record({ x: coordinate, y: coordinate });
const distance = fc.double({ min: 0, max: 500, noNaN: true });

describe("toast swipe math", () => {
  it("[TST-L01] the delta stays on the swipe axis and never points away from the direction", () => {
    fc.assert(
      fc.property(point, point, direction, (start, current, dir) => {
        const delta = getSwipeDelta(start, current, dir);
        if (dir === "right") {
          expect(delta.x).toBeGreaterThanOrEqual(0);
          expect(delta.y).toBe(0);
        } else if (dir === "left") {
          expect(delta.x).toBeLessThanOrEqual(0);
          expect(delta.y).toBe(0);
        } else if (dir === "down") {
          expect(delta.y).toBeGreaterThanOrEqual(0);
          expect(delta.x).toBe(0);
        } else {
          expect(delta.y).toBeLessThanOrEqual(0);
          expect(delta.x).toBe(0);
        }
        // A negative zero would render as "-0px" in the CSS variables.
        expect(Object.is(delta.x, -0)).toBe(false);
        expect(Object.is(delta.y, -0)).toBe(false);
      }),
      SEED,
    );
  });

  it("[TST-L02] travel toward the direction is kept exactly, travel away is clamped to zero", () => {
    expect(getSwipeDelta({ x: 100, y: 40 }, { x: 160, y: 90 }, "right")).toEqual({ x: 60, y: 0 });
    expect(getSwipeDelta({ x: 100, y: 40 }, { x: 60, y: 90 }, "right")).toEqual({ x: 0, y: 0 });
    expect(getSwipeDelta({ x: 100, y: 40 }, { x: 60, y: 90 }, "left")).toEqual({ x: -40, y: 0 });
    expect(getSwipeDelta({ x: 100, y: 40 }, { x: 60, y: 90 }, "down")).toEqual({ x: 0, y: 50 });
    expect(getSwipeDelta({ x: 100, y: 40 }, { x: 60, y: 10 }, "up")).toEqual({ x: 0, y: -30 });
  });

  it("[TST-L03] the magnitude never exceeds the raw travel on that axis", () => {
    fc.assert(
      fc.property(point, point, direction, (start, current, dir) => {
        const delta = getSwipeDelta(start, current, dir);
        expect(Math.abs(delta.x)).toBeLessThanOrEqual(Math.abs(current.x - start.x));
        expect(Math.abs(delta.y)).toBeLessThanOrEqual(Math.abs(current.y - start.y));
      }),
      SEED,
    );
  });

  it("[TST-L04] non-finite coordinates are treated as no travel", () => {
    expect(getSwipeDelta({ x: 0, y: 0 }, { x: Number.NaN, y: 3 }, "right")).toEqual({ x: 0, y: 0 });
    expect(getSwipeDelta({ x: 0, y: 0 }, { x: 3, y: Number.POSITIVE_INFINITY }, "down")).toEqual({
      x: 0,
      y: 0,
    });
    expect(isDeltaInDirection({ x: Number.NaN, y: Number.NaN }, "right", 0)).toBe(false);
  });

  it("[TST-L05] a clamped delta only counts in its own direction, never the opposite one", () => {
    fc.assert(
      fc.property(point, point, direction, distance, (a, b, dir, threshold) => {
        const toward = getSwipeDelta(a, b, dir);
        const away = getSwipeDelta(a, b, OPPOSITE[dir]);
        // Both clamps come from the same travel: when one direction swipes, the other sees nothing.
        if (isDeltaInDirection(toward, dir, threshold)) {
          expect(isDeltaInDirection(away, OPPOSITE[dir], threshold)).toBe(false);
        }
      }),
      SEED,
    );
  });

  it("[TST-L06] the threshold is strict: travel equal to it is not a swipe, more is", () => {
    for (const dir of DIRECTIONS) {
      const sign = dir === "left" || dir === "up" ? -1 : 1;
      const make = (amount: number): { x: number; y: number } =>
        isHorizontalSwipe(dir) ? { x: sign * amount, y: 0 } : { x: 0, y: sign * amount };
      expect(isDeltaInDirection(make(50), dir, 50)).toBe(false);
      expect(isDeltaInDirection(make(50.5), dir, 50)).toBe(true);
      expect(isDeltaInDirection(make(0), dir)).toBe(false);
    }
  });

  it("[TST-L07] raising the threshold can only turn a swipe into a non-swipe", () => {
    fc.assert(
      fc.property(point, direction, distance, distance, (delta, dir, a, b) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        if (isDeltaInDirection(delta, dir, high)) {
          expect(isDeltaInDirection(delta, dir, low)).toBe(true);
        }
      }),
      SEED,
    );
  });

  it("[TST-L08] a drag dominated by the other axis is not a swipe however far it goes", () => {
    expect(isDeltaInDirection({ x: 300, y: 400 }, "right", 50)).toBe(false);
    expect(isDeltaInDirection({ x: 300, y: 400 }, "down", 50)).toBe(true);
    expect(isDeltaInDirection({ x: 400, y: 400 }, "right", 50)).toBe(false);
    fc.assert(
      fc.property(point, distance, (delta, threshold) => {
        const horizontal = isDeltaInDirection(delta, "right", threshold);
        const vertical = isDeltaInDirection(delta, "down", threshold);
        // Whatever the gesture, it cannot be a swipe on both axes at once.
        expect(horizontal && vertical).toBe(false);
      }),
      SEED,
    );
  });

  it("[TST-L09] touch gets a larger slack than mouse and pen", () => {
    expect(getSwipeMoveBuffer("touch")).toBe(10);
    expect(getSwipeMoveBuffer("mouse")).toBe(2);
    expect(getSwipeMoveBuffer("pen")).toBe(2);
    expect(getSwipeMoveBuffer("")).toBe(2);
  });

  it("[TST-L10] the dead zone is left by travel beyond the buffer on either axis", () => {
    const origin = { x: 10, y: 10 };
    expect(hasLeftDeadZone(origin, { x: 12, y: 12 }, 2)).toBe(false);
    expect(hasLeftDeadZone(origin, { x: 13, y: 10 }, 2)).toBe(true);
    expect(hasLeftDeadZone(origin, { x: 10, y: 7 }, 2)).toBe(true);
    fc.assert(
      fc.property(point, point, fc.double({ min: 0, max: 50, noNaN: true }), (a, b, buffer) => {
        const left = hasLeftDeadZone(a, b, buffer);
        expect(left).toBe(Math.abs(b.x - a.x) > buffer || Math.abs(b.y - a.y) > buffer);
      }),
      SEED,
    );
  });
});

const ids = (items: readonly ToastItem[]): string[] => items.map((item) => item.id);

describe("createToaster", () => {
  it("[TST-Q01] ids are unique, counter based and start at 1", () => {
    const toaster = createToaster();
    const first = toaster.add({ title: "a" });
    const second = toaster.add({ title: "b" });
    expect(first).toBe("toast-1");
    expect(second).toBe("toast-2");
    expect(new Set(ids(toaster.toasts())).size).toBe(2);
    expect(createToaster().add({})).toBe("toast-1");
    expect(createToaster({ idPrefix: "n" }).add({})).toBe("n-1");
  });

  it("[TST-Q02] toasts keep insertion order, or the reverse with newest-first", () => {
    const oldest = createToaster();
    const newest = createToaster({ order: "newest-first" });
    for (const title of ["a", "b", "c"]) {
      oldest.add({ title });
      newest.add({ title });
    }
    expect(oldest.toasts().map((item) => item.title)).toEqual(["a", "b", "c"]);
    expect(newest.toasts().map((item) => item.title)).toEqual(["c", "b", "a"]);
  });

  it("[TST-Q03] a new toast is open, foreground, and takes the toaster's duration", () => {
    const toaster = createToaster({ duration: 1234 });
    const id = toaster.add({ title: "x" });
    expect(toaster.toasts()[0]).toMatchObject({
      id,
      open: true,
      type: "foreground",
      duration: 1234,
      title: "x",
      key: undefined,
    });
    toaster.add({ title: "own", duration: 10, type: "background", data: { n: 1 } });
    expect(toaster.toasts()[1]).toMatchObject({
      duration: 10,
      type: "background",
      data: { n: 1 },
    });
  });

  it("[TST-Q04] explicit ids are kept and a generated id skips ids in use", () => {
    const toaster = createToaster();
    expect(toaster.add({ id: "toast-1" })).toBe("toast-1");
    expect(toaster.add({})).toBe("toast-2");
    expect(toaster.toasts()).toHaveLength(2);
  });

  it("[TST-Q05] limit: the extra toasts wait and take a slot, oldest first, when one is dismissed", () => {
    const toaster = createToaster({ limit: 2 });
    const a = toaster.add({ title: "a" });
    const b = toaster.add({ title: "b" });
    const c = toaster.add({ title: "c" });
    const d = toaster.add({ title: "d" });
    expect(ids(toaster.toasts())).toEqual([a, b]);
    expect(ids(toaster.pending())).toEqual([c, d]);
    toaster.dismiss(a);
    expect(ids(toaster.toasts())).toEqual([a, b, c]);
    expect(toaster.toasts()[0]?.open).toBe(false);
    expect(ids(toaster.pending())).toEqual([d]);
    toaster.remove(a);
    expect(ids(toaster.toasts())).toEqual([b, c]);
    toaster.dismiss(b);
    expect(ids(toaster.toasts())).toEqual([b, c, d]);
    expect(toaster.pending()).toHaveLength(0);
  });

  it("[TST-Q06] the number of open toasts never exceeds the limit", () => {
    const operation = fc.tuple(
      fc.constantFrom("add", "dismiss", "remove"),
      fc.integer({ min: 0, max: 9 }),
    );
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.array(operation, { maxLength: 60 }),
        (limit, operations) => {
          const toaster = createToaster({ limit });
          for (const [kind, index] of operations) {
            const all = [...toaster.toasts(), ...toaster.pending()];
            const target = all[index % Math.max(1, all.length)];
            if (kind === "add") toaster.add({ title: String(index) });
            else if (target !== undefined && kind === "dismiss") toaster.dismiss(target.id);
            else if (target !== undefined) toaster.remove(target.id);
            const open = toaster.toasts().filter((item) => item.open).length;
            expect(open).toBeLessThanOrEqual(limit);
            // Waiting toasts exist only while every slot is taken.
            if (toaster.pending().length > 0) expect(open).toBe(limit);
            const everything = ids([...toaster.toasts(), ...toaster.pending()]);
            expect(new Set(everything).size).toBe(everything.length);
          }
        },
      ),
      SEED,
    );
  });

  it("[TST-Q07] an invalid limit falls back: NaN means unlimited, below one means one", () => {
    const unlimited = createToaster({ limit: Number.NaN });
    for (let index = 0; index < 20; index += 1) unlimited.add({});
    expect(unlimited.toasts()).toHaveLength(20);
    const one = createToaster({ limit: 0 });
    one.add({});
    one.add({});
    expect(one.toasts()).toHaveLength(1);
    expect(one.pending()).toHaveLength(1);
  });

  it("[TST-Q08] a toast with the same key updates the open one instead of stacking", () => {
    const toaster = createToaster();
    const first = toaster.add({ key: "saved", title: "Saving", duration: 100 });
    const again = toaster.add({ key: "saved", title: "Saved" });
    expect(again).toBe(first);
    expect(toaster.toasts()).toHaveLength(1);
    expect(toaster.toasts()[0]).toMatchObject({ title: "Saved", duration: 100, key: "saved" });
    expect(toaster.add({ key: "other" })).not.toBe(first);
  });

  it("[TST-Q09] de-duplication also merges into a waiting toast, and ignores a dismissed one", () => {
    const toaster = createToaster({ limit: 1 });
    const a = toaster.add({ title: "a" });
    const waiting = toaster.add({ key: "k", title: "one" });
    expect(toaster.add({ key: "k", title: "two" })).toBe(waiting);
    expect(toaster.pending()[0]?.title).toBe("two");
    toaster.dismiss(a);
    expect(ids(toaster.toasts())).toEqual([a, waiting]);
    toaster.dismiss(waiting);
    // The dismissed toast is still exiting; a new one with its key is a new toast.
    const fresh = toaster.add({ key: "k", title: "three" });
    expect(fresh).not.toBe(waiting);
  });

  it("[TST-Q10] adding an id that is open updates it; a dismissed one is replaced", () => {
    const exited: string[] = [];
    const toaster = createToaster({ onExitComplete: (item) => exited.push(item.id) });
    toaster.add({ id: "x", title: "one" });
    expect(toaster.add({ id: "x", title: "two" })).toBe("x");
    expect(toaster.toasts()).toHaveLength(1);
    expect(toaster.toasts()[0]?.title).toBe("two");
    toaster.dismiss("x");
    toaster.add({ id: "x", title: "three" });
    expect(toaster.toasts()).toHaveLength(1);
    expect(toaster.toasts()[0]).toMatchObject({ title: "three", open: true });
    expect(exited).toEqual(["x"]);
  });

  it("[TST-Q11] update replaces the given fields, keeps the rest and reports unknown ids", () => {
    const toaster = createToaster({ duration: 900 });
    const id = toaster.add({ title: "t", description: "d", data: 1 });
    const before = toaster.toasts()[0];
    expect(toaster.update(id, { title: "new", duration: undefined })).toBe(true);
    const after = toaster.toasts()[0];
    expect(after).toMatchObject({ title: "new", description: "d", data: 1, duration: undefined });
    expect(after).not.toBe(before);
    expect(before?.title).toBe("t");
    expect(toaster.update("missing", { title: "x" })).toBe(false);
    expect(toaster.update(id, { type: "background" })).toBe(true);
    expect(toaster.toasts()[0]?.type).toBe("background");
  });

  it("[TST-Q12] update reaches a waiting toast", () => {
    const toaster = createToaster({ limit: 1 });
    toaster.add({});
    const waiting = toaster.add({ title: "w" });
    expect(toaster.update(waiting, { title: "changed" })).toBe(true);
    expect(toaster.pending()[0]?.title).toBe("changed");
  });

  it("[TST-Q13] dismiss keeps the toast in the list, closed, until remove", () => {
    const exited: string[] = [];
    const toaster = createToaster({ onExitComplete: (item) => exited.push(item.id) });
    const a = toaster.add({});
    const b = toaster.add({});
    toaster.dismiss(a);
    expect(toaster.toasts().map((item) => item.open)).toEqual([false, true]);
    expect(exited).toEqual([]);
    toaster.remove(a);
    expect(ids(toaster.toasts())).toEqual([b]);
    expect(exited).toEqual([a]);
    toaster.remove("nope");
    expect(exited).toEqual([a]);
  });

  it("[TST-Q14] dismiss without an id closes every toast and drops the waiting ones", () => {
    const toaster = createToaster({ limit: 1 });
    toaster.add({});
    toaster.add({});
    toaster.dismiss();
    expect(toaster.toasts().every((item) => !item.open)).toBe(true);
    expect(toaster.pending()).toHaveLength(0);
    expect(toaster.toasts()).toHaveLength(1);
  });

  it("[TST-Q15] dismissing a waiting toast removes it without an exit", () => {
    const exited: string[] = [];
    const toaster = createToaster({ limit: 1, onExitComplete: (item) => exited.push(item.id) });
    toaster.add({});
    const waiting = toaster.add({});
    toaster.dismiss(waiting);
    expect(toaster.pending()).toHaveLength(0);
    expect(exited).toEqual([]);
  });

  it("[TST-Q16] snapshots are replaced, never mutated, and the accessor publishes a new array", () => {
    const toaster = createToaster();
    const id = toaster.add({ title: "a" });
    const list = toaster.toasts();
    const item = list[0];
    toaster.update(id, { title: "b" });
    expect(toaster.toasts()).not.toBe(list);
    expect(list[0]).toBe(item);
    expect(item?.title).toBe("a");
  });

  it("[TST-Q17] promise: loading, then success", async () => {
    const toaster = createToaster({ duration: 4000 });
    let resolve: (value: number) => void = () => undefined;
    const pending = new Promise<number>((done) => {
      resolve = done;
    });
    const handle = toaster.promise(pending, {
      loading: "Saving",
      success: (value) => ({ title: "Saved", description: `id ${value}` }),
      error: "Failed",
    });
    expect(toaster.toasts()[0]).toMatchObject({
      id: handle.id,
      title: "Saving",
      duration: Number.POSITIVE_INFINITY,
    });
    resolve(7);
    await expect(handle.result).resolves.toBe(7);
    await Promise.resolve();
    expect(toaster.toasts()[0]).toMatchObject({
      title: "Saved",
      description: "id 7",
      duration: 4000,
    });
  });

  it("[TST-Q18] promise: rejection updates the toast and still rejects for the caller", async () => {
    const toaster = createToaster();
    const handle = toaster.promise(
      () => Promise.reject(new Error("boom")),
      { loading: "Saving", success: "Saved", error: (reason) => `Failed: ${String(reason)}` },
      { duration: 2500, type: "background" },
    );
    await expect(handle.result).rejects.toThrow("boom");
    await Promise.resolve();
    expect(toaster.toasts()[0]).toMatchObject({
      title: "Failed: Error: boom",
      duration: 2500,
      type: "background",
    });
  });

  it("[TST-Q19] promise: a toast dismissed while pending is not brought back", async () => {
    const toaster = createToaster();
    let resolve: () => void = () => undefined;
    const handle = toaster.promise(
      new Promise<void>((done) => {
        resolve = done;
      }),
      { loading: "Working", success: "Done", error: "Failed" },
    );
    toaster.dismiss(handle.id);
    resolve();
    await handle.result;
    await Promise.resolve();
    expect(toaster.toasts()[0]).toMatchObject({ title: "Working", open: false });
    toaster.remove(handle.id);
    expect(toaster.toasts()).toHaveLength(0);
  });

  it("[PRIM-REV-5] promise: a source function that throws at once ends as a failed toast, not a loading one that never closes", async () => {
    const toaster = createToaster({ duration: 3000 });
    const handle = toaster.promise(
      () => {
        throw new Error("sync");
      },
      { loading: "Saving", success: "Saved", error: "Failed" },
    );
    await expect(handle.result).rejects.toThrow("sync");
    await Promise.resolve();
    expect(toaster.toasts()[0]).toMatchObject({ title: "Failed", duration: 3000 });
  });

  it("[TST-Q20] no randomness or clock is read: two toasters produce the same ids", () => {
    const random = vi.spyOn(Math, "random");
    const now = vi.spyOn(Date, "now");
    const a = createToaster();
    const b = createToaster();
    for (let index = 0; index < 5; index += 1) {
      expect(a.add({})).toBe(b.add({}));
    }
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    random.mockRestore();
    now.mockRestore();
  });
});
