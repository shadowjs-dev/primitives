/**
 * Pointer intent for submenus: the "safe triangle". When the pointer leaves a submenu trigger on
 * its way to the open submenu it crosses sibling items; without help those would take focus and
 * close the submenu. The geometry here decides whether the pointer is still traveling toward the
 * submenu, and it is a set of pure functions so it can be tested without a DOM.
 * @packageDocumentation
 */

/**
 * A point in viewport coordinates.
 * @since 1.0.0
 * @see {@link isPointInSafePolygon}
 */
export interface IntentPoint {
  /** The horizontal position, in px, growing to the right. */
  readonly x: number;
  /** The vertical position, in px, growing downward. */
  readonly y: number;
}

/**
 * An axis-aligned box in viewport coordinates (the shape of a `DOMRect`'s edges).
 * @since 1.0.0
 * @see {@link getSafeArea}
 */
export interface IntentBox {
  /** The left edge, in px. */
  readonly left: number;
  /** The right edge, in px. */
  readonly right: number;
  /** The top edge, in px. */
  readonly top: number;
  /** The bottom edge, in px. */
  readonly bottom: number;
}

/**
 * Which side of the trigger the submenu is on.
 * @since 1.0.0
 * @see {@link SafeArea}
 */
export type SubmenuSide = "left" | "right";

/**
 * The area the pointer may cross on its way to a submenu, and the horizontal direction it has to
 * be traveling in.
 * @since 1.0.0
 * @see {@link getSafeArea}
 */
export interface SafeArea {
  /** The polygon: the exit point (pulled back into the trigger by the bleed) and the submenu's box. */
  readonly polygon: readonly IntentPoint[];
  /** The side of the exit point the submenu is on; the pointer must be moving this way. */
  readonly side: SubmenuSide;
}

/** How far behind the exit point the triangle starts, so a pointer that leaves at a slant is still inside. */
const DEFAULT_BLEED = 5;

/**
 * Whether `point` lies inside `polygon` (ray casting; points exactly on an edge count as either).
 *
 * @param point The point to test.
 * @param polygon The vertices in order, at least three.
 * @returns `true` when the point is inside.
 * @example
 * import { isPointInSafePolygon } from "@shadow-js/primitives/menu";
 *
 * isPointInSafePolygon({ x: 1, y: 1 }, [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }]); // true
 * @see {@link getSafeArea}
 * @since 1.0.0
 */
export function isPointInSafePolygon(point: IntentPoint, polygon: readonly IntentPoint[]): boolean {
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (a === undefined || b === undefined) continue;
    const crosses = a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

/**
 * The safe area for a pointer that left a submenu trigger at `exit` while the submenu occupies
 * `content`: the triangle from the exit point to the near corners of the submenu, joined with the
 * submenu's own box so skimming along its edge still counts.
 *
 * @param exit Where the pointer left the trigger.
 * @param content The submenu's box.
 * @param bleed How far behind `exit` the triangle starts. Default `5`.
 * @returns The polygon and the side the submenu is on.
 * @example
 * import { getSafeArea } from "@shadow-js/primitives/menu";
 *
 * const area = getSafeArea({ x: 100, y: 20 }, { left: 104, right: 204, top: 0, bottom: 80 });
 * area.side; // "right"
 * @see {@link isPointerHeadingToSubmenu}
 * @since 1.0.0
 */
export function getSafeArea(
  exit: IntentPoint,
  content: IntentBox,
  bleed: number = DEFAULT_BLEED,
): SafeArea {
  const toTheRight = content.left > exit.x;
  const shift = toTheRight ? -bleed : bleed;
  const near = toTheRight ? content.left : content.right;
  const far = toTheRight ? content.right : content.left;
  return {
    side: toTheRight ? "right" : "left",
    polygon: [
      { x: exit.x + shift, y: exit.y },
      { x: near, y: content.top },
      { x: far, y: content.top },
      { x: far, y: content.bottom },
      { x: near, y: content.bottom },
    ],
  };
}

/**
 * Whether the pointer is on its way to the submenu: inside the safe area and moving toward the
 * submenu's side.
 *
 * @param point The pointer position.
 * @param area The safe area, or `null` when no submenu is being approached.
 * @param direction The horizontal direction the pointer has been moving in, if known.
 * @returns `true` when sibling items must not react to the pointer.
 * @example
 * import { getSafeArea, isPointerHeadingToSubmenu } from "@shadow-js/primitives/menu";
 *
 * const area = getSafeArea({ x: 100, y: 20 }, { left: 104, right: 204, top: 0, bottom: 80 });
 * isPointerHeadingToSubmenu({ x: 102, y: 30 }, area, "right"); // true
 * @see {@link getSafeArea}
 * @since 1.0.0
 */
export function isPointerHeadingToSubmenu(
  point: IntentPoint,
  area: SafeArea | null,
  direction: SubmenuSide | null,
): boolean {
  if (area === null || direction !== area.side) return false;
  return isPointInSafePolygon(point, area.polygon);
}
