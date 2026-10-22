/**
 * The pointer grace area of a hoverable tooltip: the region the pointer may cross while traveling
 * from the trigger to the content (or back) without the tooltip closing. It is the convex hull of
 * the point where the pointer left, widened a little so a slightly diagonal exit still counts, and
 * the corners of the element the pointer is heading for. Pure functions, no DOM.
 * @packageDocumentation
 */

/**
 * A point in client coordinates.
 * @since 1.0.0
 * @see {@link createGraceArea}
 */
export interface GracePoint {
  /** The horizontal position, in client coordinates. */
  readonly x: number;
  /** The vertical position, in client coordinates. */
  readonly y: number;
}

/**
 * A rectangle edge: the side of a rectangle that the pointer left through.
 * @since 1.0.0
 * @see {@link getExitSide}
 */
export type GraceSide = "top" | "right" | "bottom" | "left";

/**
 * The edges of a rectangle in client coordinates (what `getBoundingClientRect` returns).
 * @since 1.0.0
 * @see {@link createGraceArea}
 */
export interface GraceRect {
  /** The top edge, in client coordinates. */
  readonly top: number;
  /** The right edge, in client coordinates. */
  readonly right: number;
  /** The bottom edge, in client coordinates. */
  readonly bottom: number;
  /** The left edge, in client coordinates. */
  readonly left: number;
}

/** How far the exit point is widened on both sides, in px. */
const EXIT_PADDING = 5;

/**
 * The edge of `rect` closest to `point`: the side the pointer left through.
 *
 * @param point Where the pointer left.
 * @param rect The rectangle it left.
 * @returns The closest edge; ties resolve to left, right, top, bottom in that order.
 * @example
 * import { getExitSide } from "@shadow-js/primitives";
 *
 * const side = getExitSide({ x: 50, y: 0 }, { top: 0, right: 100, bottom: 20, left: 0 });
 * console.log(side); // "top"
 * @see {@link GraceSide}
 * @see {@link createGraceArea}
 * @since 1.0.0
 */
export function getExitSide(point: GracePoint, rect: GraceRect): GraceSide {
  const top = Math.abs(rect.top - point.y);
  const bottom = Math.abs(rect.bottom - point.y);
  const right = Math.abs(rect.right - point.x);
  const left = Math.abs(rect.left - point.x);
  const nearest = Math.min(top, bottom, right, left);
  if (nearest === left) return "left";
  if (nearest === right) return "right";
  if (nearest === top) return "top";
  return "bottom";
}

/**
 * Two points on the inner side of the exit point, `padding` px to either side along the edge. Putting
 * them inside the element the pointer left makes the grace area start inside it, so the first
 * pixel of movement toward the target is never already outside.
 *
 * @param exit Where the pointer left.
 * @param side The edge it left through.
 * @param padding Distance in px. Default 5.
 * @returns Two points.
 * @example
 * import { getPaddedExitPoints } from "@shadow-js/primitives";
 *
 * const points = getPaddedExitPoints({ x: 50, y: 0 }, "top");
 * console.log(points); // [{ x: 45, y: 5 }, { x: 55, y: 5 }]
 * @see {@link GracePoint}
 * @see {@link createGraceArea}
 * @since 1.0.0
 */
export function getPaddedExitPoints(
  exit: GracePoint,
  side: GraceSide,
  padding: number = EXIT_PADDING,
): [GracePoint, GracePoint] {
  switch (side) {
    case "top":
      return [
        { x: exit.x - padding, y: exit.y + padding },
        { x: exit.x + padding, y: exit.y + padding },
      ];
    case "bottom":
      return [
        { x: exit.x - padding, y: exit.y - padding },
        { x: exit.x + padding, y: exit.y - padding },
      ];
    case "left":
      return [
        { x: exit.x + padding, y: exit.y - padding },
        { x: exit.x + padding, y: exit.y + padding },
      ];
    case "right":
      return [
        { x: exit.x - padding, y: exit.y - padding },
        { x: exit.x - padding, y: exit.y + padding },
      ];
  }
}

/**
 * The four corners of a rectangle, clockwise from the top left.
 *
 * @param rect The rectangle.
 * @returns Its corners.
 * @example
 * import { getRectCorners } from "@shadow-js/primitives";
 *
 * const corners = getRectCorners({ top: 0, right: 10, bottom: 5, left: 0 });
 * console.log(corners.length); // 4
 * @see {@link GraceRect}
 * @see {@link createGraceArea}
 * @since 1.0.0
 */
export function getRectCorners(rect: GraceRect): GracePoint[] {
  return [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom },
  ];
}

/** Cross product of (a - o) and (b - o): positive for a counter-clockwise turn. */
function cross(o: GracePoint, a: GracePoint, b: GracePoint): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** One monotone chain half: the points that keep the turn direction strictly consistent. */
function chain(sorted: readonly GracePoint[]): GracePoint[] {
  const half: GracePoint[] = [];
  for (const point of sorted) {
    for (;;) {
      const last = half.at(-1);
      const before = half.at(-2);
      if (last === undefined || before === undefined || cross(before, last, point) > 0) break;
      half.pop();
    }
    half.push(point);
  }
  half.pop();
  return half;
}

/**
 * The convex hull of `points` (Andrew's monotone chain), in counter-clockwise order with y pointing
 * up, which is clockwise on screen. Duplicates and collinear points are dropped. Fewer than three
 * distinct points are returned as they are.
 *
 * @param points Any points.
 * @returns The hull's vertices.
 * @example
 * import { getHull } from "@shadow-js/primitives";
 *
 * // (2, 2) lies inside the square, so the hull has the four corners only.
 * const hull = getHull([
 *   { x: 0, y: 0 },
 *   { x: 4, y: 0 },
 *   { x: 4, y: 4 },
 *   { x: 0, y: 4 },
 *   { x: 2, y: 2 },
 * ]);
 * console.log(hull.length); // 4
 * @see {@link GracePoint}
 * @see {@link createGraceArea}
 * @since 1.0.0
 */
export function getHull(points: readonly GracePoint[]): GracePoint[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const unique = sorted.filter(
    (point, index) =>
      index === 0 || point.x !== sorted[index - 1]?.x || point.y !== sorted[index - 1]?.y,
  );
  if (unique.length < 3) return unique;
  const lower = chain(unique);
  const upper = chain([...unique].reverse());
  return [...lower, ...upper];
}

/**
 * Whether `point` is inside `polygon` (ray casting). A point exactly on an edge may count either
 * way, which is irrelevant for a pointer that moves continuously.
 *
 * @param point The point to test.
 * @param polygon The polygon's vertices in order.
 * @returns `true` when the point is inside.
 * @example
 * import { isPointInPolygon } from "@shadow-js/primitives";
 *
 * const square = [
 *   { x: 0, y: 0 },
 *   { x: 4, y: 0 },
 *   { x: 4, y: 4 },
 *   { x: 0, y: 4 },
 * ];
 * console.log(isPointInPolygon({ x: 1, y: 1 }, square)); // true
 * @see {@link createGraceArea}
 * @since 1.0.0
 */
export function isPointInPolygon(point: GracePoint, polygon: readonly GracePoint[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const prior = polygon[previous];
    if (current === undefined || prior === undefined) continue;
    const crosses =
      current.y > point.y !== prior.y > point.y &&
      point.x < ((prior.x - current.x) * (point.y - current.y)) / (prior.y - current.y) + current.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

/**
 * The grace area for a pointer that just left `from` at `exit` on its way to `to`.
 *
 * @param exit Where the pointer left (the `pointerleave` position).
 * @param from The rectangle it left.
 * @param to The rectangle it is heading for.
 * @returns The polygon the pointer may stay inside.
 * @example
 * import { createGraceArea, isPointInPolygon } from "@shadow-js/primitives";
 *
 * const from = { top: 0, right: 100, bottom: 20, left: 0 };
 * const to = { top: 40, right: 100, bottom: 80, left: 0 };
 * const area = createGraceArea({ x: 50, y: 20 }, from, to);
 * console.log(isPointInPolygon({ x: 50, y: 35 }, area)); // true
 * @see {@link getHull}
 * @see {@link isPointInPolygon}
 * @since 1.0.0
 */
export function createGraceArea(exit: GracePoint, from: GraceRect, to: GraceRect): GracePoint[] {
  const side = getExitSide(exit, from);
  return getHull([...getPaddedExitPoints(exit, side), ...getRectCorners(to)]);
}
