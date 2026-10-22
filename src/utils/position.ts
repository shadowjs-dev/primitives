/**
 * The positioning engine: pure geometry that places a floating box next to an anchor box. It is
 * the Radix `Popper` / floating-ui behavior (side, align, offsets, flip, shift, arrow, available
 * size, transform origin) rewritten as one function with no DOM access, so it runs in node and
 * is covered by property tests. `usePosition` (in `use-position.ts`) feeds it with measurements.
 * @packageDocumentation
 */

/**
 * The four sides of the anchor a floating box can be placed on. Requested through
 * {@link PositionOptions.side}; the side actually used is reported in {@link ComputedPosition.side}.
 * @since 1.0.0
 * @see {@link PositionOptions}
 */
export type Side = "top" | "right" | "bottom" | "left";

/**
 * How the floating box lines up with the anchor along the side's cross axis.
 * @since 1.0.0
 * @see {@link PositionOptions}
 */
export type Align = "start" | "center" | "end";

/**
 * A rectangle in client (viewport) coordinates; a `DOMRect` satisfies it.
 * @since 1.0.0
 * @see {@link ComputeInput}
 */
export interface Rect {
  /** The left edge, in client coordinates. */
  readonly x: number;
  /** The top edge, in client coordinates. */
  readonly y: number;
  /** The width, in px. */
  readonly width: number;
  /** The height, in px. */
  readonly height: number;
}

/**
 * Anything that can stand in for an anchor element: a context-menu point, a text caret, a
 * selection. `contextElement` tells the DOM glue which element's scroll ancestors move it.
 * @since 1.0.0
 * @see {@link usePosition}
 */
export interface VirtualElement {
  /** Returns the rectangle the virtual element occupies, in client coordinates. */
  getBoundingClientRect(): Rect | DOMRect;
  /** The element whose scroll ancestors move the virtual element, or `undefined` when there is none. */
  readonly contextElement?: Element;
}

/**
 * A distance for all four edges, or per edge (missing edges are 0).
 * @since 1.0.0
 * @see {@link normalizePadding}
 */
export type Padding = number | Partial<Record<Side, number>>;

/**
 * Placement options shared by the pure engine ({@link computePosition}) and {@link usePosition}.
 * They set no ARIA attributes and handle no keys. `usePosition` writes the result on the floating
 * element as `data-side` (the side used), `data-align` (the alignment) and `data-hidden` (value `""`
 * while the anchor is hidden), and on the arrow as `data-arrow-offset` (`"centered"` or `"clamped"`).
 * @since 1.0.0
 * @see {@link computePosition}
 */
export interface PositionOptions {
  /**
   * Preferred side. Flipped to the opposite side when it does not fit (see `avoidCollisions`).
   * @default "bottom"
   */
  side?: Side;
  /**
   * Alignment along the cross axis.
   * @default "center"
   */
  align?: Align;
  /**
   * Gap between the anchor and the floating box along the side axis (an arrow, when measured, is
   * added on top so its tip touches the anchor).
   * @default `0`
   */
  sideOffset?: number;
  /**
   * Shift along the cross axis, inward from the aligned edge: positive moves the box away from the
   * `start` / `end` edge it is aligned to (the sign flips for `end` and, on horizontal axes, in
   * rtl). Like Radix it has no effect with `align: "center"`.
   * @default `0`
   */
  alignOffset?: number;
  /**
   * Flip to the opposite side and shift along the cross axis to stay in view. `false` places the
   * box exactly where it was requested.
   * @default `true`
   */
  avoidCollisions?: boolean;
  /**
   * Distance kept between the floating box and the boundary edges.
   * @default `0`
   */
  collisionPadding?: Padding;
  /**
   * Extra boundary(ies) the floating box must stay inside, intersected with the viewport. An
   * element contributes its client box. Read by `usePosition` only: `computePosition` takes the
   * boundary as {@link ComputeInput.boundary}.
   * @default none (the viewport only)
   */
  collisionBoundary?: Element | readonly Element[] | Rect | null;
  /**
   * Shift behavior: `"partial"` keeps the box attached to the anchor (it may leave the boundary
   * when the anchor leaves), `"always"` keeps it inside the boundary no matter what.
   * @default "partial"
   */
  sticky?: "partial" | "always";
  /**
   * Report `anchorHidden` once the anchor is entirely clipped. `usePosition` then sets
   * `visibility: hidden` and `data-hidden` on the floating element.
   * @default `false`
   */
  hideWhenDetached?: boolean;
  /**
   * Minimum distance between the arrow and the floating box edges.
   * @default `0`
   */
  arrowPadding?: number;
  /**
   * Text direction; mirrors `start` / `end` and `alignOffset` on horizontal axes.
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";
}

/**
 * Everything the pure engine needs; all rectangles are in the same coordinate space.
 * @since 1.0.0
 * @see {@link computePosition}
 */
export interface ComputeInput {
  /** The anchor box. */
  anchor: Rect;
  /** Layout size of the floating box (unaffected by transforms). */
  floating: { width: number; height: number };
  /** The box the floating element must stay inside (before collision padding). */
  boundary: Rect;
  /**
   * The region the anchor must be visible in for `hideWhenDetached` (the viewport intersected
   * with the anchor's clipping ancestors). Defaults to `boundary`.
   */
  anchorClip?: Rect;
  /** Layout size of the arrow element, when there is one. */
  arrow?: { width: number; height: number };
  /** Placement options. */
  options: PositionOptions;
}

/**
 * The engine's answer. Never contains NaN or Infinity.
 * @since 1.0.0
 * @see {@link computePosition}
 */
export interface ComputedPosition {
  /** Left edge of the floating box in client coordinates. */
  x: number;
  /** Top edge of the floating box in client coordinates. */
  y: number;
  /** The side actually used (differs from the requested one after a flip). */
  side: Side;
  /** The requested alignment (flipping never changes it). */
  align: Align;
  /**
   * Arrow offset inside the floating box along the cross axis: `x` for top / bottom, `y` for
   * left / right, `undefined` otherwise or when no arrow was given.
   */
  arrow: { x: number | undefined; y: number | undefined };
  /** The arrow could not be centered on the anchor (it was clamped by the box or the padding). */
  arrowCannotCenter: boolean;
  /** `hideWhenDetached` is on and the anchor is entirely outside its clip region. */
  anchorHidden: boolean;
  /** Room between the box's anchor-facing edge and the padded boundary edge it grows toward. */
  availableWidth: number;
  /** See {@link ComputedPosition.availableWidth}. */
  availableHeight: number;
  /** Width of the anchor. */
  anchorWidth: number;
  /** Height of the anchor. */
  anchorHeight: number;
  /** CSS `transform-origin` pointing at the arrow, or the anchor-facing edge without an arrow. */
  transformOrigin: string;
}

const OPPOSITE: Readonly<Record<Side, Side>> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Inputs are clamped to this magnitude so sums of several of them stay finite; no real layout
 * comes anywhere near it.
 */
const LIMIT = 1e15;

/** Non-finite becomes 0 and huge values are clamped, so arithmetic below can never yield NaN. */
function finite(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value > LIMIT ? LIMIT : value < -LIMIT ? -LIMIT : value;
}

/** A length: finite and never negative. */
function length(value: number): number {
  const clean = finite(value);
  return clean > 0 ? clean : 0;
}

/** `value` limited to `[low, high]`; when the range is inverted the low edge wins (start edge). */
function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(value, high));
}

function cleanRect(rect: Rect): Rect {
  return {
    x: finite(rect.x),
    y: finite(rect.y),
    width: length(rect.width),
    height: length(rect.height),
  };
}

/**
 * Normalizes a {@link Padding} into four non-negative, finite edge values.
 *
 * @param padding A single number for all edges, per-edge values, or nothing.
 * @returns The four edges.
 * @example
 * import { normalizePadding } from "@shadow-js/primitives";
 *
 * normalizePadding({ top: 8 }); // { top: 8, right: 0, bottom: 0, left: 0 }
 * @since 1.0.0
 * @see {@link Padding}
 */
export function normalizePadding(padding: Padding | undefined): Record<Side, number> {
  if (typeof padding === "number") {
    const all = length(padding);
    return { top: all, right: all, bottom: all, left: all };
  }
  return {
    top: length(padding?.top ?? 0),
    right: length(padding?.right ?? 0),
    bottom: length(padding?.bottom ?? 0),
    left: length(padding?.left ?? 0),
  };
}

/**
 * Intersects rectangles. An empty list yields an empty rectangle at the origin and rectangles
 * that do not overlap yield a zero-sized one (never negative sizes).
 *
 * @param rects The rectangles to intersect.
 * @returns The common area.
 * @example
 * import { intersectRects } from "@shadow-js/primitives";
 *
 * intersectRects([{ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }]);
 * // { x: 5, y: 5, width: 5, height: 5 }
 * @since 1.0.0
 * @see {@link Rect}
 */
export function intersectRects(rects: readonly Rect[]): Rect {
  const first = rects[0];
  if (first === undefined) return { x: 0, y: 0, width: 0, height: 0 };
  let left = finite(first.x);
  let top = finite(first.y);
  let right = left + length(first.width);
  let bottom = top + length(first.height);
  for (const rect of rects) {
    const x = finite(rect.x);
    const y = finite(rect.y);
    left = Math.max(left, x);
    top = Math.max(top, y);
    right = Math.min(right, x + length(rect.width));
    bottom = Math.min(bottom, y + length(rect.height));
  }
  return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/** Whether the span `[start, start + size]` lies completely outside `[low, high]`. */
function spanOutside(start: number, size: number, low: number, high: number): boolean {
  const end = start + size;
  // A zero-sized anchor (a point) only counts as outside when strictly beyond the edge, since it
  // has no extent that could touch the clip region from the outside.
  return size > 0 ? end <= low || start >= high : end < low || start > high;
}

/** Places `size` against the anchor span on the cross axis according to `align`. */
function crossStart(
  anchorStart: number,
  anchorSize: number,
  size: number,
  align: Align,
  mirrored: boolean,
): number {
  if (align === "center") return anchorStart + (anchorSize - size) / 2;
  const atStart = anchorStart;
  const atEnd = anchorStart + anchorSize - size;
  return (align === "start") !== mirrored ? atStart : atEnd;
}

/** Shifts a coordinate into `[low, high - size]`, optionally never letting go of the anchor. */
function shiftInto(
  coordinate: number,
  size: number,
  low: number,
  high: number,
  anchorStart: number,
  anchorSize: number,
  attached: boolean,
): number {
  const inside = clamp(coordinate, low, high - size);
  return attached ? clamp(inside, anchorStart - size, anchorStart + anchorSize) : inside;
}

/** A pixel length for a CSS value; avoids printing `-0`. */
function px(value: number): string {
  return `${value === 0 ? 0 : value}px`;
}

/**
 * Computes where a floating box goes relative to an anchor: side / align placement (rtl aware),
 * offsets, flip to the roomier side, cross-axis shift, arrow offset, available size and
 * transform origin. Pure and total: sizes may be 0, non-finite numbers count as 0, a box larger
 * than the boundary aligns to the boundary's start edge, and the result never contains NaN.
 *
 * With `avoidCollisions: false` the result is exactly the requested placement.
 *
 * @param input Anchor, floating size, boundary, optional arrow size and options.
 * @returns The computed position.
 * @example
 * import { computePosition } from "@shadow-js/primitives";
 *
 * const placement = computePosition({
 *   anchor: { x: 100, y: 100, width: 40, height: 20 },
 *   floating: { width: 60, height: 30 },
 *   boundary: { x: 0, y: 0, width: 1000, height: 800 },
 *   options: { side: "bottom", align: "start", sideOffset: 5 },
 * });
 * // placement.x === 100, placement.y === 125, placement.side === "bottom"
 * @since 1.0.0
 * @see {@link ComputeInput}
 * @see {@link usePosition}
 */
export function computePosition(input: ComputeInput): ComputedPosition {
  const { options } = input;
  const anchor = cleanRect(input.anchor);
  const fw = length(input.floating.width);
  const fh = length(input.floating.height);
  const boundary = cleanRect(input.boundary);
  const clip = input.anchorClip === undefined ? boundary : cleanRect(input.anchorClip);
  const padding = normalizePadding(options.collisionPadding);
  const bounds = {
    left: boundary.x + padding.left,
    top: boundary.y + padding.top,
    right: boundary.x + boundary.width - padding.right,
    bottom: boundary.y + boundary.height - padding.bottom,
  };
  const rtl = options.dir === "rtl";
  const align = options.align ?? "center";
  const preferred = options.side ?? "bottom";
  const avoid = options.avoidCollisions !== false;
  const arrowW = input.arrow === undefined ? 0 : length(input.arrow.width);
  const arrowH = input.arrow === undefined ? 0 : length(input.arrow.height);
  // Like Radix, the arrow's height is pushed onto the side offset so its tip touches the anchor.
  const gap = finite(options.sideOffset ?? 0) + arrowH;
  const alignOffset = finite(options.alignOffset ?? 0);

  const place = (side: Side): { x: number; y: number } => {
    const horizontalAxis = side === "top" || side === "bottom";
    // alignOffset has no effect on a centered box (Radix), and flips with `end` and with rtl.
    const shift =
      align === "center"
        ? 0
        : alignOffset * (align === "end" ? -1 : 1) * (rtl && horizontalAxis ? -1 : 1);
    if (horizontalAxis) {
      return {
        x: crossStart(anchor.x, anchor.width, fw, align, rtl) + shift,
        y: side === "top" ? anchor.y - fh - gap : anchor.y + anchor.height + gap,
      };
    }
    return {
      x: side === "left" ? anchor.x - fw - gap : anchor.x + anchor.width + gap,
      y: crossStart(anchor.y, anchor.height, fh, align, false) + shift,
    };
  };

  // How far the box sticks out past the boundary on the side axis (positive = overflowing).
  const sideOverflow = (side: Side): number => {
    const { x, y } = place(side);
    if (side === "bottom") return y + fh - bounds.bottom;
    if (side === "top") return bounds.top - y;
    if (side === "right") return x + fw - bounds.right;
    return bounds.left - x;
  };

  let side = preferred;
  if (avoid) {
    const overflow = sideOverflow(preferred);
    // Flip only when it actually helps: the opposite side must overflow less than the preferred.
    if (overflow > 0 && sideOverflow(OPPOSITE[preferred]) < overflow) side = OPPOSITE[preferred];
  }

  const horizontalAxis = side === "top" || side === "bottom";
  let { x, y } = place(side);
  if (avoid) {
    const attached = options.sticky !== "always";
    if (horizontalAxis) {
      x = shiftInto(x, fw, bounds.left, bounds.right, anchor.x, anchor.width, attached);
    } else {
      y = shiftInto(y, fh, bounds.top, bounds.bottom, anchor.y, anchor.height, attached);
    }
  }

  // Arrow: centered on the anchor along the cross axis, kept inside the box by arrowPadding.
  let arrowX: number | undefined;
  let arrowY: number | undefined;
  let arrowCannotCenter = false;
  if (input.arrow !== undefined) {
    const arrowSize = horizontalAxis ? arrowW : arrowH;
    const boxSize = horizontalAxis ? fw : fh;
    const boxStart = horizontalAxis ? x : y;
    const anchorCenter = horizontalAxis
      ? anchor.x + anchor.width / 2
      : anchor.y + anchor.height / 2;
    const padLow = length(options.arrowPadding ?? 0);
    const padHigh = boxSize - arrowSize - padLow;
    const ideal = anchorCenter - boxStart - arrowSize / 2;
    const actual = padHigh < padLow ? (boxSize - arrowSize) / 2 : clamp(ideal, padLow, padHigh);
    arrowCannotCenter = actual !== ideal;
    if (horizontalAxis) arrowX = actual;
    else arrowY = actual;
  }

  // Available size, floating-ui `size()` / Radix semantics measured from the placed box.
  const over = {
    left: bounds.left - x,
    right: x + fw - bounds.right,
    top: bounds.top - y,
    bottom: y + fh - bounds.bottom,
  };
  const clipWidth = bounds.right - bounds.left;
  const clipHeight = bounds.bottom - bounds.top;
  const widthSide: Side = horizontalAxis
    ? align === (rtl ? "start" : "end")
      ? "left"
      : "right"
    : side;
  const heightSide: Side = horizontalAxis ? side : align === "end" ? "top" : "bottom";
  const limitedWidth = Math.min(fw - over[widthSide], clipWidth);
  const limitedHeight = Math.min(fh - over[heightSide], clipHeight);
  // A centered, shifted box can slide anywhere along the cross axis, so the whole boundary is free.
  const limited = align !== "center" || !avoid;
  const availableWidth = horizontalAxis && !limited ? clipWidth : limitedWidth;
  const availableHeight = !horizontalAxis && !limited ? clipHeight : limitedHeight;

  // Transform origin: the arrow tip when there is a centerable arrow, else the aligned edge.
  const origin = (lowIsStart: boolean): string =>
    align === "center" ? "50%" : (align === "start") === lowIsStart ? "0%" : "100%";
  // In rtl `start` on a horizontal axis is the right edge, so 100% is where the origin goes.
  const alongX = origin(!(rtl && horizontalAxis));
  const alongY = origin(true);
  const arrowCenterX = px((arrowX ?? 0) + arrowW / 2);
  const arrowCenterY = px((arrowY ?? 0) + arrowH / 2);
  const useArrow = input.arrow !== undefined && !arrowCannotCenter;
  let transformOrigin: string;
  if (side === "bottom") transformOrigin = `${useArrow ? arrowCenterX : alongX} ${px(-arrowH)}`;
  else if (side === "top") {
    transformOrigin = `${useArrow ? arrowCenterX : alongX} ${px(fh + arrowH)}`;
  } else if (side === "right") {
    transformOrigin = `${px(-arrowH)} ${useArrow ? arrowCenterY : alongY}`;
  } else transformOrigin = `${px(fw + arrowH)} ${useArrow ? arrowCenterY : alongY}`;

  const anchorHidden =
    options.hideWhenDetached === true &&
    (spanOutside(anchor.x, anchor.width, clip.x, clip.x + clip.width) ||
      spanOutside(anchor.y, anchor.height, clip.y, clip.y + clip.height));

  return {
    x: x + 0,
    y: y + 0,
    side,
    align,
    arrow: { x: arrowX, y: arrowY },
    arrowCannotCenter,
    anchorHidden,
    availableWidth: Math.max(0, availableWidth),
    availableHeight: Math.max(0, availableHeight),
    anchorWidth: anchor.width,
    anchorHeight: anchor.height,
    transformOrigin,
  };
}
