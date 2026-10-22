/**
 * DOM glue for the positioning engine: measures the anchor, the floating element and the
 * boundary, asks `computePosition` where the box goes, writes the result as inline styles and
 * data attributes, and keeps it up to date while the page scrolls and resizes.
 * @packageDocumentation
 */
import type { Accessor } from "@shadow-js/core";
import { untrack, useEffect, useSignal } from "@shadow-js/core";
import type { ComputedPosition, PositionOptions, Rect, VirtualElement } from "./position";
import { computePosition, intersectRects } from "./position";

/**
 * What {@link usePosition} needs; every accessor is tracked unless noted. The config sets no ARIA
 * attributes and handles no keys.
 * @since 1.0.0
 * @see {@link usePosition}
 */
export interface UsePositionOptions {
  /** The element (or virtual element) the floating box is placed against. */
  anchor: () => Element | VirtualElement | null | undefined;
  /** The element that gets positioned. */
  floating: () => HTMLElement | null | undefined;
  /** The arrow element inside the floating box, if any. */
  arrow?: () => HTMLElement | null | undefined;
  /** Placement options; a change re-positions. */
  options: () => PositionOptions;
  /**
   * When it returns false nothing is observed, measured or written.
   * @default `true`
   */
  enabled?: () => boolean;
}

/**
 * What {@link usePosition} returns.
 * @since 1.0.0
 * @see {@link usePosition}
 */
export interface UsePositionResult {
  /**
   * The latest computed placement. `undefined` until the first measurement and while `enabled` is
   * false or an anchor or floating element is missing. After unmount it keeps the last value.
   */
  placement: Accessor<ComputedPosition | undefined>;
  /** Re-measures and re-positions synchronously (use after the content size changed). */
  update(): void;
}

interface Runtime {
  measure(): void;
  stop(): void;
}

const LISTENER = { capture: true, passive: true } as const;

/** Whether the anchor is a real element rather than a virtual one. */
function isElement(value: Element | VirtualElement): value is Element {
  return "nodeType" in value && value.nodeType === 1;
}

/** The element that contains `node`, stepping out of shadow roots through their host. */
function parentElementOf(node: Node): Element | null {
  const parent = node.parentNode;
  if (parent === null) return null;
  if (parent.nodeType === 1) return parent as Element;
  return "host" in parent ? (parent.host as Element) : null;
}

/**
 * Elements that scroll or clip (non-visible overflow), nearest first, from `first` upwards; the
 * viewport is separate.
 */
function clippingAncestors(first: Element | null, view: Window): Element[] {
  const found: Element[] = [];
  if (first === null) return found;
  const root = first.ownerDocument.documentElement;
  const body = first.ownerDocument.body;
  for (let node: Element | null = first; node !== null; node = parentElementOf(node)) {
    // The root and body overflow propagate to the viewport, which is handled on its own.
    if (node === root || node === body) continue;
    const style = view.getComputedStyle(node);
    if (
      /auto|scroll|overlay|hidden|clip/.test(
        `${style.overflow}${style.overflowX}${style.overflowY}`,
      )
    ) {
      found.push(node);
    }
  }
  return found;
}

/** The padding-box rectangle of an element (what its content can be seen in). */
function clientBox(element: Element): Rect {
  const box = element.getBoundingClientRect();
  const width = element.clientWidth;
  const height = element.clientHeight;
  // Inline boxes and engines without layout report 0: fall back to the border box then.
  if (width === 0 && height === 0) {
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }
  return {
    x: box.x + element.clientLeft,
    y: box.y + element.clientTop,
    width,
    height,
  };
}

function viewportBox(doc: Document, view: Window): Rect {
  const root = doc.documentElement;
  return {
    x: 0,
    y: 0,
    width: root.clientWidth > 0 ? root.clientWidth : view.innerWidth,
    height: root.clientHeight > 0 ? root.clientHeight : view.innerHeight,
  };
}

function isElementList(value: unknown): value is readonly Element[] {
  return Array.isArray(value);
}

/** The viewport narrowed by the application's `collisionBoundary`. */
function collisionBox(options: PositionOptions, doc: Document, view: Window): Rect {
  const rects: Rect[] = [viewportBox(doc, view)];
  const boundary = options.collisionBoundary;
  if (boundary !== null && boundary !== undefined) {
    if (isElementList(boundary)) {
      for (const element of boundary) rects.push(clientBox(element));
    } else if ("nodeType" in boundary) rects.push(clientBox(boundary));
    else rects.push(boundary);
  }
  return intersectRects(rects);
}

function samePosition(a: ComputedPosition | undefined, b: ComputedPosition): boolean {
  return (
    a !== undefined &&
    a.x === b.x &&
    a.y === b.y &&
    a.side === b.side &&
    a.align === b.align &&
    a.arrow.x === b.arrow.x &&
    a.arrow.y === b.arrow.y &&
    a.arrowCannotCenter === b.arrowCannotCenter &&
    a.anchorHidden === b.anchorHidden &&
    a.availableWidth === b.availableWidth &&
    a.availableHeight === b.availableHeight &&
    a.anchorWidth === b.anchorWidth &&
    a.anchorHeight === b.anchorHeight &&
    a.transformOrigin === b.transformOrigin
  );
}

/**
 * Writes inline styles and attributes on one element, remembers what each had before the first
 * write and puts it all back on `restore`. Writes compare against the live DOM, so a value the
 * application's own bindings wiped is written again on the next measurement.
 */
function createWriter(element: HTMLElement): {
  style(name: string, value: string): void;
  resetStyle(name: string): void;
  attr(name: string, value: string | null): void;
  restore(): void;
} {
  const styles = new Map<string, { value: string; priority: string }>();
  const attributes = new Map<string, string | null>();
  const hadStyleAttribute = element.hasAttribute("style");
  const remember = (name: string): void => {
    if (styles.has(name)) return;
    styles.set(name, {
      value: element.style.getPropertyValue(name),
      priority: element.style.getPropertyPriority(name),
    });
  };
  const put = (name: string): void => {
    const saved = styles.get(name);
    if (saved === undefined) return;
    if (saved.value === "") element.style.removeProperty(name);
    else element.style.setProperty(name, saved.value, saved.priority);
  };
  return {
    style(name, value) {
      remember(name);
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
    },
    resetStyle(name) {
      put(name);
    },
    attr(name, value) {
      if (!attributes.has(name)) attributes.set(name, element.getAttribute(name));
      if (value === null) {
        if (element.hasAttribute(name)) element.removeAttribute(name);
      } else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
    },
    restore() {
      for (const name of styles.keys()) put(name);
      for (const [name, original] of attributes) {
        if (original === null) element.removeAttribute(name);
        else element.setAttribute(name, original);
      }
      if (!hadStyleAttribute && element.getAttribute("style") === "")
        element.removeAttribute("style");
    },
  };
}

/** Whether a computed value is one that is set (neither empty nor the keyword `none`). */
function isSet(value: string | undefined): boolean {
  return value !== undefined && value !== "" && value !== "none" && value !== "normal";
}

/**
 * The nearest ancestor of `floating` that becomes the containing block of its `position: fixed`
 * box: an element with a transform (the `translate` / `rotate` / `scale` properties count too), a
 * perspective, a filter, layout or paint containment, a size container, or a `will-change` for any
 * of those. A submenu is rendered inside its parent menu, which is itself placed with a transform,
 * so without this its coordinates would be taken from the viewport and land off by the parent's
 * position. `null` means the viewport is the containing block.
 */
function fixedContainingBlock(floating: HTMLElement, view: Window): Element | null {
  for (let node = parentElementOf(floating); node !== null; node = parentElementOf(node)) {
    const style = view.getComputedStyle(node);
    if (
      isSet(style.transform) ||
      isSet(style.translate) ||
      isSet(style.rotate) ||
      isSet(style.scale) ||
      isSet(style.perspective) ||
      isSet(style.filter) ||
      isSet(style.backdropFilter) ||
      /transform|perspective|filter/.test(style.willChange) ||
      /layout|paint|strict|content/.test(style.contain) ||
      /size/.test(style.containerType)
    ) {
      return node;
    }
  }
  return null;
}

/**
 * Where the coordinate system of a fixed box starts, in viewport pixels, and how much it is scaled:
 * the padding box of its containing block, or the viewport itself.
 */
function fixedOrigin(
  floating: HTMLElement,
  view: Window,
): { readonly x: number; readonly y: number; readonly scaleX: number; readonly scaleY: number } {
  const block = fixedContainingBlock(floating, view);
  if (block === null) return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  const box = block.getBoundingClientRect();
  const width = block instanceof HTMLElement ? block.offsetWidth : 0;
  const height = block instanceof HTMLElement ? block.offsetHeight : 0;
  // A transform may scale the block (an entrance animation): its pixels are then not CSS pixels.
  const scaleX = width > 0 && box.width > 0 ? box.width / width : 1;
  const scaleY = height > 0 && box.height > 0 ? box.height / height : 1;
  return {
    x: box.x + block.clientLeft * scaleX,
    y: box.y + block.clientTop * scaleY,
    scaleX,
    scaleY,
  };
}

function px(value: number): string {
  return `${value === 0 ? 0 : value}px`;
}

/**
 * Starts positioning `floating` against `anchor`: applies the base styles, measures once, and
 * wires every observer and listener. `stop` undoes all of it.
 */
function startPositioning(
  anchor: Element | VirtualElement,
  floating: HTMLElement,
  arrow: HTMLElement | undefined,
  readOptions: () => PositionOptions,
  publish: (position: ComputedPosition) => void,
): Runtime {
  const doc = floating.ownerDocument;
  const view = doc.defaultView;
  if (view === null) return { measure: () => undefined, stop: () => undefined };

  const box = createWriter(floating);
  const arrowBox = arrow === undefined ? undefined : createWriter(arrow);
  // Written again on every measurement: an application style binding may have replaced them.
  const applyBase = (): void => {
    box.style("position", "fixed");
    box.style("left", "0");
    box.style("top", "0");
    box.style("min-width", "max-content");
  };
  applyBase();

  // An element anchor is clipped by its ancestors; a virtual one by its context element too,
  // since the context element is typically the scrollable region the point lives in.
  const clippers = clippingAncestors(
    isElement(anchor) ? parentElementOf(anchor) : (anchor.contextElement ?? null),
    view,
  );
  let stopped = false;
  let frame: number | undefined;
  let lastSizes = "";
  let intersection: IntersectionObserver | undefined;

  const sizes = (): string => {
    const rect = isElement(anchor) ? anchor.getBoundingClientRect() : undefined;
    return `${rect?.width}x${rect?.height}|${floating.offsetWidth}x${floating.offsetHeight}`;
  };

  const syncIntersection = (wanted: boolean): void => {
    if (!wanted) {
      intersection?.disconnect();
      intersection = undefined;
      return;
    }
    if (intersection !== undefined || !isElement(anchor)) return;
    if (typeof IntersectionObserver === "undefined") return;
    intersection = new IntersectionObserver(() => schedule());
    intersection.observe(anchor);
  };

  const measure = (): void => {
    if (stopped) return;
    const options = untrack(readOptions);
    applyBase();
    const anchorRect = anchor.getBoundingClientRect();
    lastSizes = sizes();
    const viewport = viewportBox(doc, view);
    const clip = intersectRects([viewport, ...clippers.map(clientBox)]);
    const result = computePosition({
      anchor: {
        x: anchorRect.x,
        y: anchorRect.y,
        width: anchorRect.width,
        height: anchorRect.height,
      },
      floating: { width: floating.offsetWidth, height: floating.offsetHeight },
      boundary: collisionBox(options, doc, view),
      anchorClip: clip,
      ...(arrow === undefined
        ? {}
        : { arrow: { width: arrow.offsetWidth, height: arrow.offsetHeight } }),
      options,
    });

    // Snap to device pixels: a fractional translate blurs text on low-density screens.
    const ratio = view.devicePixelRatio > 0 ? view.devicePixelRatio : 1;
    const snap = (value: number): number => Math.round(value * ratio) / ratio;
    // `left: 0; top: 0` are relative to the containing block, which is not always the viewport.
    const origin = fixedOrigin(floating, view);
    const x = (result.x - origin.x) / origin.scaleX;
    const y = (result.y - origin.y) / origin.scaleY;
    box.style("transform", `translate3d(${px(snap(x))}, ${px(snap(y))}, 0)`);
    box.style("transform-origin", result.transformOrigin);
    box.style("--primitives-transform-origin", result.transformOrigin);
    box.style("--primitives-available-width", px(result.availableWidth));
    box.style("--primitives-available-height", px(result.availableHeight));
    box.style("--primitives-anchor-width", px(result.anchorWidth));
    box.style("--primitives-anchor-height", px(result.anchorHeight));
    box.attr("data-side", result.side);
    box.attr("data-align", result.align);
    if (result.anchorHidden) {
      box.style("visibility", "hidden");
      box.attr("data-hidden", "");
    } else {
      box.resetStyle("visibility");
      box.attr("data-hidden", null);
    }
    if (arrowBox !== undefined) {
      if (result.arrow.x === undefined) arrowBox.resetStyle("left");
      else arrowBox.style("left", px(result.arrow.x));
      if (result.arrow.y === undefined) arrowBox.resetStyle("top");
      else arrowBox.style("top", px(result.arrow.y));
      arrowBox.attr("data-arrow-offset", result.arrowCannotCenter ? "clamped" : "centered");
    }
    syncIntersection(options.hideWhenDetached === true);
    publish(result);
  };

  // One animation frame per burst of scroll / resize events.
  const schedule = (): void => {
    if (stopped || frame !== undefined) return;
    if (typeof view.requestAnimationFrame !== "function") {
      measure();
      return;
    }
    frame = view.requestAnimationFrame(() => {
      frame = undefined;
      measure();
    });
  };

  // The observer also fires on observe(); only a real size change is worth a measurement, and
  // this keeps our own style writes from feeding back into themselves.
  const onResize = (): void => {
    if (sizes() !== lastSizes) schedule();
  };
  let resizeObserver: ResizeObserver | undefined;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(onResize);
    if (isElement(anchor)) resizeObserver.observe(anchor);
    resizeObserver.observe(floating);
  }

  const targets: EventTarget[] = [...clippers, view];
  for (const target of targets) target.addEventListener("scroll", schedule, LISTENER);
  view.addEventListener("resize", schedule);

  return {
    measure,
    stop() {
      stopped = true;
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      frame = undefined;
      for (const target of targets) target.removeEventListener("scroll", schedule, LISTENER);
      view.removeEventListener("resize", schedule);
      resizeObserver?.disconnect();
      intersection?.disconnect();
      box.restore();
      arrowBox?.restore();
    },
  };
}

/**
 * Positions a floating element against an anchor and keeps it there. Client only: nothing
 * touches the DOM while the component renders, so server rendering is unaffected. It sets no ARIA
 * attributes and handles no keys; the application owns roles and focus.
 *
 * On the floating element it sets `position: fixed; left: 0; top: 0; min-width: max-content`, a
 * `transform: translate3d(x, y, 0)` snapped to device pixels (relative to the viewport, or to the
 * nearest ancestor that is the containing block of fixed boxes, such as a transformed parent
 * menu), `transform-origin` and the custom properties `--primitives-available-width`,
 * `--primitives-available-height`, `--primitives-anchor-width`, `--primitives-anchor-height` and
 * `--primitives-transform-origin`, plus `data-side` and `data-align`. When the anchor is entirely
 * clipped (`hideWhenDetached`) it is `visibility: hidden` with `data-hidden=""`. The arrow gets
 * `left` / `top` and `data-arrow-offset="centered" | "clamped"`. Everything is put back on cleanup.
 *
 * It re-measures when the options, anchor or elements change and, coalesced into one animation
 * frame, on resize of the anchor or the floating element, on scroll of any scrolling ancestor of
 * the anchor or the window, and on window resize. The boundary is the viewport narrowed by
 * `collisionBoundary`; `hideWhenDetached` also looks at the anchor's clipping ancestors.
 *
 * @param config Accessors for the anchor, floating element, arrow, options and enabled state.
 * @returns The latest placement and a synchronous `update()`.
 * @example
 * import { usePosition } from "@shadow-js/primitives";
 * import { useSignal } from "@shadow-js/core";
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 *
 * export function Popover(): JsxChild {
 *   const [anchor, setAnchor] = useSignal<HTMLElement | undefined>(undefined);
 *   const [content, setContent] = useSignal<HTMLElement | undefined>(undefined);
 *   const { placement } = usePosition({
 *     anchor,
 *     floating: content,
 *     options: () => ({ side: "bottom", align: "start", sideOffset: 4 }),
 *   });
 *   return (
 *     <>
 *       <button type="button" ref={setAnchor}>Open</button>
 *       <div ref={setContent}>Placed {placement()?.side ?? "not yet"}</div>
 *     </>
 *   );
 * }
 * @since 1.0.0
 * @see {@link computePosition}
 * @see {@link UsePositionOptions}
 */
export function usePosition(config: UsePositionOptions): UsePositionResult {
  const [placement, setPlacement] = useSignal<ComputedPosition | undefined>(undefined);
  let current: Runtime | undefined;

  const publish = (next: ComputedPosition): void => {
    setPlacement((previous) => (samePosition(previous, next) ? previous : next));
  };

  useEffect(() => {
    const enabled = config.enabled === undefined || config.enabled();
    const anchor = config.anchor();
    const floating = config.floating();
    const arrow = config.arrow?.();
    if (
      !enabled ||
      anchor === null ||
      anchor === undefined ||
      floating === null ||
      floating === undefined
    ) {
      setPlacement(undefined);
      return undefined;
    }
    const runtime = startPositioning(anchor, floating, arrow ?? undefined, config.options, publish);
    current = runtime;
    // Placed before the first paint: effects run in the flush that follows the render.
    untrack(() => runtime.measure());
    return () => {
      runtime.stop();
      if (current === runtime) current = undefined;
    };
  });

  useEffect(
    () => config.options(),
    () => current?.measure(),
    { defer: true },
  );

  return { placement, update: () => current?.measure() };
}
