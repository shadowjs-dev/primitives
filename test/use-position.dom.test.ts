import { createRoot, flushSync, useSignal } from "@shadow-js/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PositionOptions, Rect, Side } from "../src/utils/position";
import type { UsePositionOptions, UsePositionResult } from "../src/utils/use-position";
import { usePosition } from "../src/utils/use-position";
import { trackListeners } from "./support/dom";

/** A recording stand-in for ResizeObserver / IntersectionObserver. */
class RecordingObserver {
  readonly observed = new Set<Element>();
  disconnected = false;
  readonly callback: () => void;
  constructor(callback: () => void, registry: RecordingObserver[]) {
    this.callback = callback;
    registry.push(this);
  }
  observe(element: Element): void {
    this.observed.add(element);
  }
  unobserve(element: Element): void {
    this.observed.delete(element);
  }
  disconnect(): void {
    this.observed.clear();
    this.disconnected = true;
  }
  fire(): void {
    this.callback();
  }
}

interface Frames {
  readonly queue: Map<number, () => void>;
  /** Runs every scheduled frame callback once. */
  run(): void;
  requested: number;
  canceled: number;
}

let resizeObservers: RecordingObserver[] = [];
let intersectionObservers: RecordingObserver[] = [];
let frames: Frames;
let disposers: Array<() => void> = [];

function installFrames(): Frames {
  const queue = new Map<number, () => void>();
  let next = 1;
  const state: Frames = {
    queue,
    requested: 0,
    canceled: 0,
    run() {
      const callbacks = [...queue.values()];
      queue.clear();
      for (const callback of callbacks) callback();
      flushSync();
    },
  };
  vi.stubGlobal("requestAnimationFrame", (callback: () => void): number => {
    const id = next++;
    queue.set(id, callback);
    state.requested++;
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number): void => {
    state.canceled++;
    queue.delete(id);
  });
  return state;
}

function defineConstant(target: object, name: string, value: number): void {
  Object.defineProperty(target, name, { configurable: true, get: () => value });
}

/** Gives an element a layout: the rect it reports and (optionally) its layout box size. */
function lay(element: Element, rect: Rect, client?: { width: number; height: number }): void {
  element.getBoundingClientRect = (): DOMRect =>
    new DOMRect(rect.x, rect.y, rect.width, rect.height);
  if (element instanceof HTMLElement) {
    defineConstant(element, "offsetWidth", rect.width);
    defineConstant(element, "offsetHeight", rect.height);
  }
  if (client !== undefined) {
    defineConstant(element, "clientWidth", client.width);
    defineConstant(element, "clientHeight", client.height);
  }
}

/** Changes what an element reports without replacing the stubs' structure. */
function move(element: Element, rect: Rect): void {
  lay(element, rect);
}

function make(tag = "div"): HTMLElement {
  const element = document.createElement(tag);
  document.body.append(element);
  return element;
}

const viewport = { width: 1000, height: 800 };

beforeEach(() => {
  resizeObservers = [];
  intersectionObservers = [];
  class Resize extends RecordingObserver {
    constructor(callback: () => void) {
      super(callback, resizeObservers);
    }
  }
  class Intersection extends RecordingObserver {
    constructor(callback: () => void) {
      super(callback, intersectionObservers);
    }
  }
  vi.stubGlobal("ResizeObserver", Resize);
  vi.stubGlobal("IntersectionObserver", Intersection);
  frames = installFrames();
  defineConstant(document.documentElement, "clientWidth", viewport.width);
  defineConstant(document.documentElement, "clientHeight", viewport.height);
});

afterEach(() => {
  for (const dispose of disposers) dispose();
  disposers = [];
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document.documentElement, "clientWidth");
  Reflect.deleteProperty(document.documentElement, "clientHeight");
  document.body.replaceChildren();
});

function mount(config: UsePositionOptions): UsePositionResult & { dispose(): void } {
  const result = createRoot((dispose) => {
    disposers.push(dispose);
    return { ...usePosition(config), dispose };
  });
  flushSync();
  return result;
}

function fixture() {
  const anchor = make("button");
  const floating = make();
  lay(anchor, { x: 100, y: 100, width: 40, height: 20 });
  lay(floating, { x: 0, y: 0, width: 60, height: 30 });
  return { anchor, floating };
}

describe("usePosition", () => {
  it("[UPOS-01] applies position, transform, custom properties and data attributes", () => {
    const { anchor, floating } = fixture();
    const view = mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ side: "bottom", align: "start", sideOffset: 5 }),
    });
    expect(floating.style.position).toBe("fixed");
    expect(floating.style.left).toBe("0px");
    expect(floating.style.top).toBe("0px");
    expect(floating.style.getPropertyValue("min-width")).toBe("max-content");
    expect(floating.style.transform).toBe("translate3d(100px, 125px, 0)");
    expect(floating.style.getPropertyValue("--primitives-anchor-width")).toBe("40px");
    expect(floating.style.getPropertyValue("--primitives-anchor-height")).toBe("20px");
    expect(floating.style.getPropertyValue("--primitives-available-width")).toBe("900px");
    expect(floating.style.getPropertyValue("--primitives-available-height")).toBe("675px");
    expect(floating.style.getPropertyValue("--primitives-transform-origin")).toBe("0% 0px");
    expect(floating.style.transformOrigin).toBe("0% 0px");
    expect(floating.getAttribute("data-side")).toBe("bottom");
    expect(floating.getAttribute("data-align")).toBe("start");
    expect(floating.hasAttribute("data-hidden")).toBe(false);
    expect(view.placement()?.x).toBe(100);
    expect(view.placement()?.y).toBe(125);
  });

  it("[UPOS-02] nothing is measured or written until the effects run", () => {
    const { anchor, floating } = fixture();
    const rect = vi.spyOn(anchor, "getBoundingClientRect");
    createRoot((dispose) => {
      disposers.push(dispose);
      usePosition({ anchor: () => anchor, floating: () => floating, options: () => ({}) });
      expect(rect).not.toHaveBeenCalled();
      expect(floating.getAttribute("style")).toBeNull();
    });
    flushSync();
    expect(floating.style.position).toBe("fixed");
  });

  it("[UPOS-03] re-positions when the options change", () => {
    const { anchor, floating } = fixture();
    const [side, setSide] = useSignal<Side>("bottom");
    const view = mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ side: side(), align: "start" }),
    });
    expect(floating.style.transform).toBe("translate3d(100px, 120px, 0)");
    setSide("top");
    flushSync();
    expect(floating.style.transform).toBe("translate3d(100px, 70px, 0)");
    expect(floating.getAttribute("data-side")).toBe("top");
    expect(view.placement()?.side).toBe("top");
    setSide("right");
    flushSync();
    expect(floating.style.transform).toBe("translate3d(140px, 100px, 0)");
  });

  it("[UPOS-04] re-positions when the anchor or floating element changes", () => {
    const first = fixture();
    const other = make("button");
    lay(other, { x: 300, y: 200, width: 40, height: 20 });
    const [target, setTarget] = useSignal<HTMLElement>(first.anchor);
    mount({ anchor: target, floating: () => first.floating, options: () => ({ align: "start" }) });
    expect(first.floating.style.transform).toBe("translate3d(100px, 120px, 0)");
    setTarget(other);
    flushSync();
    expect(first.floating.style.transform).toBe("translate3d(300px, 220px, 0)");
    expect(resizeObservers[0]?.disconnected).toBe(true);
  });

  it("[UPOS-05] update() measures again synchronously", () => {
    const { anchor, floating } = fixture();
    const view = mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ align: "start" }),
    });
    lay(floating, { x: 0, y: 0, width: 60, height: 50 });
    move(anchor, { x: 100, y: 300, width: 40, height: 20 });
    view.update();
    expect(floating.style.transform).toBe("translate3d(100px, 320px, 0)");
    expect(view.placement()?.y).toBe(320);
  });

  it("[UPOS-06] the placement accessor only changes when the result does", () => {
    const { anchor, floating } = fixture();
    const view = mount({ anchor: () => anchor, floating: () => floating, options: () => ({}) });
    const first = view.placement();
    view.update();
    expect(view.placement()).toBe(first);
  });

  it("[UPOS-07] scroll and resize events are coalesced into one animation frame", () => {
    const { anchor, floating } = fixture();
    const view = mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ align: "start" }),
    });
    expect(frames.requested).toBe(0);
    move(anchor, { x: 200, y: 100, width: 40, height: 20 });
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
    expect(frames.requested).toBe(1);
    expect(floating.style.transform).toBe("translate3d(100px, 120px, 0)");
    frames.run();
    expect(floating.style.transform).toBe("translate3d(200px, 120px, 0)");
    expect(view.placement()?.x).toBe(200);
    window.dispatchEvent(new Event("scroll"));
    expect(frames.requested).toBe(2);
  });

  it("[UPOS-08] scrolling an ancestor of the anchor re-positions", () => {
    const scroller = make();
    scroller.style.overflow = "auto";
    const anchor = document.createElement("button");
    scroller.append(anchor);
    const floating = make();
    lay(scroller, { x: 0, y: 0, width: 500, height: 500 }, { width: 500, height: 500 });
    lay(anchor, { x: 100, y: 100, width: 40, height: 20 });
    lay(floating, { x: 0, y: 0, width: 60, height: 30 });
    mount({ anchor: () => anchor, floating: () => floating, options: () => ({ align: "start" }) });
    move(anchor, { x: 100, y: 50, width: 40, height: 20 });
    scroller.dispatchEvent(new Event("scroll"));
    frames.run();
    expect(floating.style.transform).toBe("translate3d(100px, 70px, 0)");
  });

  it("[UPOS-09] observes the anchor and the floating element, ignoring unchanged sizes", () => {
    const { anchor, floating } = fixture();
    mount({ anchor: () => anchor, floating: () => floating, options: () => ({}) });
    expect(resizeObservers).toHaveLength(1);
    expect([...(resizeObservers[0]?.observed ?? [])]).toEqual([anchor, floating]);
    // ResizeObserver reports once on observe(); the sizes did not change: no work.
    resizeObservers[0]?.fire();
    expect(frames.requested).toBe(0);
    lay(floating, { x: 0, y: 0, width: 80, height: 30 });
    resizeObservers[0]?.fire();
    expect(frames.requested).toBe(1);
    frames.run();
    expect(floating.style.transform).toBe("translate3d(80px, 120px, 0)");
    // Our own writes do not feed back: a second report of the same sizes schedules nothing.
    resizeObservers[0]?.fire();
    expect(frames.requested).toBe(1);
  });

  it("[UPOS-10] cleanup removes listeners, observers, the pending frame and every style", () => {
    const ledger = trackListeners();
    try {
      const scroller = make();
      scroller.style.overflow = "hidden";
      const anchor = document.createElement("button");
      scroller.append(anchor);
      const floating = make();
      const arrow = document.createElement("i");
      floating.append(arrow);
      lay(scroller, { x: 0, y: 0, width: 500, height: 500 }, { width: 500, height: 500 });
      lay(anchor, { x: 100, y: 100, width: 40, height: 20 });
      lay(floating, { x: 0, y: 0, width: 60, height: 30 });
      lay(arrow, { x: 0, y: 0, width: 10, height: 5 });
      floating.style.color = "red";
      floating.style.left = "5px";
      floating.setAttribute("data-side", "custom");
      const before = floating.getAttribute("style");
      const view = mount({
        anchor: () => anchor,
        floating: () => floating,
        arrow: () => arrow,
        options: () => ({ hideWhenDetached: true }),
      });
      expect(ledger.describe()).toEqual(["resize@window", "scroll@div", "scroll@window"]);
      expect(intersectionObservers).toHaveLength(1);
      window.dispatchEvent(new Event("scroll"));
      expect(frames.queue.size).toBe(1);
      view.dispose();
      expect(ledger.active()).toBe(0);
      expect(frames.canceled).toBe(1);
      expect(frames.queue.size).toBe(0);
      expect(resizeObservers.every((observer) => observer.disconnected)).toBe(true);
      expect(intersectionObservers.every((observer) => observer.disconnected)).toBe(true);
      expect(floating.getAttribute("style")).toBe(before);
      expect(floating.getAttribute("data-side")).toBe("custom");
      expect(floating.hasAttribute("data-align")).toBe(false);
      expect(arrow.hasAttribute("style")).toBe(false);
      expect(arrow.hasAttribute("data-arrow-offset")).toBe(false);
    } finally {
      ledger.restore();
    }
  });

  it("[UPOS-11] disabled: nothing is observed, measured or written; enabling and disabling toggles", () => {
    const ledger = trackListeners();
    try {
      const { anchor, floating } = fixture();
      const rect = vi.spyOn(anchor, "getBoundingClientRect");
      const [on, setOn] = useSignal(false);
      const view = mount({
        anchor: () => anchor,
        floating: () => floating,
        options: () => ({}),
        enabled: on,
      });
      expect(rect).not.toHaveBeenCalled();
      expect(floating.hasAttribute("style")).toBe(false);
      expect(view.placement()).toBeUndefined();
      expect(ledger.active()).toBe(0);
      expect(resizeObservers).toHaveLength(0);
      view.update();
      expect(rect).not.toHaveBeenCalled();
      setOn(true);
      flushSync();
      expect(floating.style.position).toBe("fixed");
      expect(view.placement()).toBeDefined();
      expect(ledger.active()).toBeGreaterThan(0);
      setOn(false);
      flushSync();
      expect(floating.hasAttribute("style")).toBe(false);
      expect(view.placement()).toBeUndefined();
      expect(ledger.active()).toBe(0);
    } finally {
      ledger.restore();
    }
  });

  it("[UPOS-12] missing anchor or floating element means no work", () => {
    const { floating } = fixture();
    const view = mount({ anchor: () => undefined, floating: () => floating, options: () => ({}) });
    expect(floating.hasAttribute("style")).toBe(false);
    expect(view.placement()).toBeUndefined();
    const other = mount({ anchor: () => floating, floating: () => null, options: () => ({}) });
    expect(other.placement()).toBeUndefined();
  });

  it("[UPOS-13] virtual anchors are measured on every update", () => {
    const scroller = make();
    scroller.style.overflow = "auto";
    lay(scroller, { x: 0, y: 0, width: 500, height: 500 }, { width: 500, height: 500 });
    const floating = make();
    lay(floating, { x: 0, y: 0, width: 60, height: 30 });
    let point = { x: 300, y: 200 };
    const reads = vi.fn(() => new DOMRect(point.x, point.y, 0, 0));
    const ledger = trackListeners();
    try {
      const view = mount({
        anchor: () => ({ getBoundingClientRect: reads, contextElement: scroller }),
        floating: () => floating,
        options: () => ({ align: "start" }),
      });
      expect(floating.style.transform).toBe("translate3d(300px, 200px, 0)");
      // Only the floating element is observed; the point has no box to observe.
      expect([...(resizeObservers[0]?.observed ?? [])]).toEqual([floating]);
      expect(ledger.describe()).toContain("scroll@div");
      point = { x: 340, y: 250 };
      view.update();
      expect(floating.style.transform).toBe("translate3d(340px, 250px, 0)");
      point = { x: 10, y: 20 };
      scroller.dispatchEvent(new Event("scroll"));
      frames.run();
      expect(floating.style.transform).toBe("translate3d(10px, 20px, 0)");
    } finally {
      ledger.restore();
    }
  });

  it("[UPOS-14] flips and shifts inside the viewport and reports available size", () => {
    const { anchor, floating } = fixture();
    move(anchor, { x: 990, y: 790, width: 10, height: 10 });
    lay(floating, { x: 0, y: 0, width: 100, height: 50 });
    const view = mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ side: "bottom", align: "center", collisionPadding: 8 }),
    });
    expect(view.placement()?.side).toBe("top");
    expect(floating.getAttribute("data-side")).toBe("top");
    // y: 790 - 50, x: shifted to keep 8px from the right edge (1000 - 8 - 100)
    expect(floating.style.transform).toBe("translate3d(892px, 740px, 0)");
    expect(floating.style.getPropertyValue("--primitives-available-height")).toBe("782px");
  });

  it("[UPOS-15] collisionBoundary narrows the boundary (element client box, rect, list)", () => {
    const { anchor, floating } = fixture();
    const region = make();
    lay(region, { x: 0, y: 0, width: 300, height: 200 }); // clientWidth 0: falls back to the rect
    move(anchor, { x: 280, y: 100, width: 10, height: 10 });
    lay(floating, { x: 0, y: 0, width: 100, height: 30 });
    const [boundary, setBoundary] =
      useSignal<Exclude<PositionOptions["collisionBoundary"], undefined>>(region);
    mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ collisionBoundary: boundary(), sticky: "always" }),
    });
    expect(floating.style.transform).toBe("translate3d(200px, 110px, 0)");
    setBoundary({ x: 0, y: 0, width: 250, height: 200 });
    flushSync();
    expect(floating.style.transform).toBe("translate3d(150px, 110px, 0)");
    const other = make();
    lay(other, { x: 0, y: 0, width: 220, height: 200 }, { width: 200, height: 180 });
    setBoundary([region, other]);
    flushSync();
    expect(floating.style.transform).toBe("translate3d(100px, 110px, 0)");
    setBoundary(null);
    flushSync();
    expect(floating.style.transform).toBe("translate3d(235px, 110px, 0)");
  });

  it("[UPOS-16] the arrow gets left / top and an offset hint; the floating box is pushed by its height", () => {
    const { anchor, floating } = fixture();
    const arrow = document.createElement("span");
    floating.append(arrow);
    lay(arrow, { x: 0, y: 0, width: 10, height: 5 });
    const [padding, setPadding] = useSignal(0);
    mount({
      anchor: () => anchor,
      floating: () => floating,
      arrow: () => arrow,
      options: () => ({ arrowPadding: padding() }),
    });
    expect(floating.style.transform).toBe("translate3d(90px, 125px, 0)");
    expect(arrow.style.left).toBe("25px");
    expect(arrow.style.top).toBe("");
    expect(arrow.getAttribute("data-arrow-offset")).toBe("centered");
    expect(floating.style.getPropertyValue("--primitives-transform-origin")).toBe("30px -5px");
    // Anchor near the left edge forces a shift; the arrow cannot sit in the middle any more.
    move(anchor, { x: 0, y: 100, width: 20, height: 20 });
    lay(floating, { x: 0, y: 0, width: 100, height: 30 });
    setPadding(8);
    flushSync();
    expect(arrow.style.left).toBe("8px");
    expect(arrow.getAttribute("data-arrow-offset")).toBe("clamped");
  });

  it("[UPOS-17] hideWhenDetached hides a scrolled-out anchor and restores visibility", () => {
    const scroller = make();
    scroller.style.overflow = "hidden";
    const anchor = document.createElement("button");
    scroller.append(anchor);
    const floating = make();
    floating.style.visibility = "visible";
    lay(scroller, { x: 0, y: 200, width: 500, height: 100 }, { width: 500, height: 100 });
    lay(anchor, { x: 100, y: 220, width: 40, height: 20 });
    lay(floating, { x: 0, y: 0, width: 60, height: 30 });
    mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ hideWhenDetached: true }),
    });
    expect(floating.hasAttribute("data-hidden")).toBe(false);
    expect(floating.style.visibility).toBe("visible");
    expect(intersectionObservers).toHaveLength(1);
    expect([...(intersectionObservers[0]?.observed ?? [])]).toEqual([anchor]);
    move(anchor, { x: 100, y: 120, width: 40, height: 20 }); // above the scroller's box
    scroller.dispatchEvent(new Event("scroll"));
    frames.run();
    expect(floating.style.visibility).toBe("hidden");
    expect(floating.getAttribute("data-hidden")).toBe("");
    move(anchor, { x: 100, y: 230, width: 40, height: 20 });
    intersectionObservers[0]?.fire();
    frames.run();
    expect(floating.style.visibility).toBe("visible");
    expect(floating.hasAttribute("data-hidden")).toBe(false);
  });

  it("[UPOS-18] no IntersectionObserver is needed unless hideWhenDetached is on", () => {
    const { anchor, floating } = fixture();
    const [hide, setHide] = useSignal(false);
    mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ hideWhenDetached: hide() }),
    });
    expect(intersectionObservers).toHaveLength(0);
    setHide(true);
    flushSync();
    expect(intersectionObservers).toHaveLength(1);
    setHide(false);
    flushSync();
    expect(intersectionObservers[0]?.disconnected).toBe(true);
  });

  it("[UPOS-19] tolerates a missing ResizeObserver, IntersectionObserver and requestAnimationFrame", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.stubGlobal("requestAnimationFrame", undefined);
    const { anchor, floating } = fixture();
    mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ hideWhenDetached: true, align: "start" }),
    });
    expect(floating.style.transform).toBe("translate3d(100px, 120px, 0)");
    // Without rAF an event falls back to measuring right away.
    move(anchor, { x: 150, y: 100, width: 40, height: 20 });
    window.dispatchEvent(new Event("resize"));
    expect(floating.style.transform).toBe("translate3d(150px, 120px, 0)");
  });

  it("[UPOS-20] snaps the translation to device pixels", () => {
    vi.stubGlobal("devicePixelRatio", 2);
    const { anchor, floating } = fixture();
    move(anchor, { x: 100.3, y: 100.6, width: 40, height: 20 });
    mount({ anchor: () => anchor, floating: () => floating, options: () => ({ align: "start" }) });
    expect(floating.style.transform).toBe("translate3d(100.5px, 120.5px, 0)");
  });

  it("[UPOS-21] a value wiped by the application's own style binding is written again", () => {
    const { anchor, floating } = fixture();
    const view = mount({ anchor: () => anchor, floating: () => floating, options: () => ({}) });
    floating.removeAttribute("style");
    view.update();
    expect(floating.style.position).toBe("fixed");
    expect(floating.style.transform).toBe("translate3d(90px, 120px, 0)");
  });

  it("[UPOS-22] rtl mirrors start alignment", () => {
    const { anchor, floating } = fixture();
    mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ align: "start", dir: "rtl" }),
    });
    expect(floating.style.transform).toBe("translate3d(80px, 120px, 0)");
    expect(floating.style.getPropertyValue("--primitives-transform-origin")).toBe("100% 0px");
  });

  it("[UPOS-23] inside a transformed ancestor the coordinates are relative to it, not to the viewport", () => {
    // A submenu lives inside its parent menu, which is placed with a transform: that ancestor is the
    // containing block of `position: fixed`, so viewport coordinates would land off by its position.
    const { anchor, floating } = fixture();
    const parent = document.createElement("div");
    parent.style.transform = "translate3d(30px, 40px, 0)";
    document.body.append(parent);
    parent.append(floating);
    lay(parent, { x: 30, y: 40, width: 300, height: 300 });
    mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ side: "bottom", align: "start" }),
    });
    // Viewport target is (100, 120); the block starts at (30, 40).
    expect(floating.style.transform).toBe("translate3d(70px, 80px, 0)");
  });

  it("[UPOS-24] a scaled containing block (an entrance animation) is divided out, its border is not part of the origin", () => {
    const { anchor, floating } = fixture();
    const parent = document.createElement("div");
    parent.style.transform = "scale(0.5)";
    document.body.append(parent);
    parent.append(floating);
    lay(parent, { x: 20, y: 20, width: 100, height: 100 });
    defineConstant(parent, "offsetWidth", 200);
    defineConstant(parent, "offsetHeight", 200);
    defineConstant(parent, "clientLeft", 2);
    defineConstant(parent, "clientTop", 2);
    mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ side: "bottom", align: "start" }),
    });
    // Origin (20 + 2 * 0.5, 20 + 2 * 0.5) = (21, 21); local = ((100, 120) - origin) / 0.5.
    expect(floating.style.transform).toBe("translate3d(158px, 198px, 0)");
  });

  it("[UPOS-25] ancestors without a containing block for fixed boxes leave the coordinates alone", () => {
    const { anchor, floating } = fixture();
    const parent = document.createElement("div");
    parent.style.position = "relative";
    document.body.append(parent);
    parent.append(floating);
    lay(parent, { x: 30, y: 40, width: 300, height: 300 });
    mount({
      anchor: () => anchor,
      floating: () => floating,
      options: () => ({ side: "bottom", align: "start" }),
    });
    expect(floating.style.transform).toBe("translate3d(100px, 120px, 0)");
  });
});
