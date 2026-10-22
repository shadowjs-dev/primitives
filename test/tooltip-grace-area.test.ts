import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  createGraceArea,
  type GracePoint,
  type GraceRect,
  getExitSide,
  getHull,
  getPaddedExitPoints,
  getRectCorners,
  isPointInPolygon,
} from "../src/tooltip/grace-area";

const PROPERTY = { seed: 42, numRuns: 400 } as const;

const coordinate = fc.integer({ min: -500, max: 500 });
const point = fc.record({ x: coordinate, y: coordinate });
const points = fc.array(point, { minLength: 0, maxLength: 24 });
const rect = fc
  .record({
    left: coordinate,
    top: coordinate,
    width: fc.integer({ min: 1, max: 300 }),
    height: fc.integer({ min: 1, max: 300 }),
  })
  .map(
    ({ left, top, width, height }): GraceRect => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
    }),
  );

/** Twice the signed area of the triangle o, a, b: the oracle for every orientation question. */
function cross(o: GracePoint, a: GracePoint, b: GracePoint): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** Whether `p` is inside or on the boundary of a convex polygon given in hull order. */
function insideOrOn(p: GracePoint, hull: readonly GracePoint[]): boolean {
  if (hull.length < 3) return true;
  const signs = hull.map((vertex, index) => {
    const next = hull[(index + 1) % hull.length] as GracePoint;
    return Math.sign(cross(vertex, next, p));
  });
  return signs.every((sign) => sign >= 0) || signs.every((sign) => sign <= 0);
}

describe("grace area: exit side", () => {
  it("[TTG-01] names the nearest edge", () => {
    const box: GraceRect = { top: 100, right: 200, bottom: 120, left: 0 };
    expect(getExitSide({ x: 100, y: 99 }, box)).toBe("top");
    expect(getExitSide({ x: 100, y: 121 }, box)).toBe("bottom");
    expect(getExitSide({ x: 201, y: 110 }, box)).toBe("right");
    expect(getExitSide({ x: -1, y: 110 }, box)).toBe("left");
  });

  it("[TTG-02] the named side is never farther than another one", () => {
    fc.assert(
      fc.property(rect, point, (box, exit) => {
        const distance = {
          top: Math.abs(box.top - exit.y),
          bottom: Math.abs(box.bottom - exit.y),
          left: Math.abs(box.left - exit.x),
          right: Math.abs(box.right - exit.x),
        };
        const side = getExitSide(exit, box);
        expect(distance[side]).toBe(Math.min(...Object.values(distance)));
      }),
      PROPERTY,
    );
  });
});

describe("grace area: padded exit points", () => {
  it("[TTG-03] sit padding px inside the element, spread along the edge it left through", () => {
    expect(getPaddedExitPoints({ x: 50, y: 10 }, "top")).toEqual([
      { x: 45, y: 15 },
      { x: 55, y: 15 },
    ]);
    expect(getPaddedExitPoints({ x: 50, y: 10 }, "bottom")).toEqual([
      { x: 45, y: 5 },
      { x: 55, y: 5 },
    ]);
    expect(getPaddedExitPoints({ x: 50, y: 10 }, "left")).toEqual([
      { x: 55, y: 5 },
      { x: 55, y: 15 },
    ]);
    expect(getPaddedExitPoints({ x: 50, y: 10 }, "right")).toEqual([
      { x: 45, y: 5 },
      { x: 45, y: 15 },
    ]);
  });

  it("[TTG-04] both points are exactly padding away from the exit point on each axis", () => {
    fc.assert(
      fc.property(
        point,
        fc.constantFrom("top", "right", "bottom", "left"),
        fc.integer({ min: 1, max: 20 }),
        (exit, side, padding) => {
          for (const padded of getPaddedExitPoints(exit, side, padding)) {
            expect(Math.abs(padded.x - exit.x)).toBe(padding);
            expect(Math.abs(padded.y - exit.y)).toBe(padding);
          }
        },
      ),
      PROPERTY,
    );
  });
});

describe("grace area: convex hull", () => {
  it("[TTG-05] drops interior, duplicate and collinear points", () => {
    const hull = getHull([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
      { x: 2, y: 2 },
      { x: 2, y: 0 },
      { x: 0, y: 0 },
    ]);
    expect(hull).toHaveLength(4);
    expect(getHull([])).toEqual([]);
    expect(getHull([{ x: 1, y: 1 }])).toEqual([{ x: 1, y: 1 }]);
  });

  it("[TTG-06] every hull vertex is one of the input points", () => {
    fc.assert(
      fc.property(points, (input) => {
        for (const vertex of getHull(input)) {
          expect(
            input.some((candidate) => candidate.x === vertex.x && candidate.y === vertex.y),
          ).toBe(true);
        }
      }),
      PROPERTY,
    );
  });

  it("[TTG-07] every input point is inside or on the hull", () => {
    fc.assert(
      fc.property(points, (input) => {
        const hull = getHull(input);
        for (const candidate of input) expect(insideOrOn(candidate, hull)).toBe(true);
      }),
      PROPERTY,
    );
  });

  it("[TTG-08] the hull is strictly convex: every turn goes the same way", () => {
    fc.assert(
      fc.property(points, (input) => {
        const hull = getHull(input);
        if (hull.length < 3) return;
        for (let index = 0; index < hull.length; index += 1) {
          const a = hull[index] as GracePoint;
          const b = hull[(index + 1) % hull.length] as GracePoint;
          const c = hull[(index + 2) % hull.length] as GracePoint;
          expect(cross(a, b, c)).toBeGreaterThan(0);
        }
      }),
      PROPERTY,
    );
  });

  it("[TTG-09] taking the hull of a hull changes nothing, whatever the input order", () => {
    fc.assert(
      fc.property(points, (input) => {
        const hull = getHull(input);
        const again = getHull([...hull].reverse());
        expect(new Set(again.map((p) => `${p.x},${p.y}`))).toEqual(
          new Set(hull.map((p) => `${p.x},${p.y}`)),
        );
      }),
      PROPERTY,
    );
  });
});

describe("grace area: point in polygon", () => {
  const square: GracePoint[] = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it("[TTG-10] tells inside from outside for a square", () => {
    expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(isPointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
    expect(isPointInPolygon({ x: 5, y: -1 }, square)).toBe(false);
    expect(isPointInPolygon({ x: 5, y: 5 }, [])).toBe(false);
  });

  it("[TTG-11] agrees with the orientation test on a convex hull, off the boundary", () => {
    fc.assert(
      fc.property(
        points,
        fc.double({ min: -520, max: 520, noNaN: true }),
        fc.double({ min: -520, max: 520, noNaN: true }),
        (input, x, y) => {
          const hull = getHull(input);
          if (hull.length < 3) return;
          const probe = { x, y };
          const onBoundary = hull.some((vertex, index) => {
            const next = hull[(index + 1) % hull.length] as GracePoint;
            return Math.abs(cross(vertex, next, probe)) < 1e-9;
          });
          if (onBoundary) return;
          const strictlyInside = hull.every((vertex, index) => {
            const next = hull[(index + 1) % hull.length] as GracePoint;
            return cross(vertex, next, probe) > 0;
          });
          expect(isPointInPolygon(probe, hull)).toBe(strictlyInside);
        },
      ),
      PROPERTY,
    );
  });

  it("[TTG-12] a point beyond the bounding box is outside", () => {
    fc.assert(
      fc.property(
        points.filter((p) => p.length >= 3),
        fc.integer({ min: 1, max: 100 }),
        (input, gap) => {
          const hull = getHull(input);
          const maxX = Math.max(...hull.map((p) => p.x));
          const maxY = Math.max(...hull.map((p) => p.y));
          const minX = Math.min(...hull.map((p) => p.x));
          expect(isPointInPolygon({ x: maxX + gap, y: 0 }, hull)).toBe(false);
          expect(isPointInPolygon({ x: minX - gap, y: 0 }, hull)).toBe(false);
          expect(isPointInPolygon({ x: 0, y: maxY + gap }, hull)).toBe(false);
        },
      ),
      PROPERTY,
    );
  });
});

describe("grace area: the area between a trigger and its content", () => {
  it("[TTG-13] holds the content's corners and the padded exit points", () => {
    const trigger: GraceRect = { top: 100, right: 280, bottom: 120, left: 200 };
    const content: GraceRect = { top: 40, right: 300, bottom: 90, left: 180 };
    const area = createGraceArea({ x: 240, y: 100 }, trigger, content);
    for (const corner of getRectCorners(content)) {
      expect(area.some((vertex) => vertex.x === corner.x && vertex.y === corner.y)).toBe(true);
    }
    expect(isPointInPolygon({ x: 240, y: 95 }, area)).toBe(true);
    expect(isPointInPolygon({ x: 240, y: 103 }, area)).toBe(true);
    expect(isPointInPolygon({ x: 600, y: 95 }, area)).toBe(false);
    expect(isPointInPolygon({ x: 240, y: 300 }, area)).toBe(false);
  });

  it("[TTG-14] leaving the trigger upwards toward content above keeps the exit point and the gap inside", () => {
    fc.assert(
      fc.property(
        rect,
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 1, max: 400 }),
        fc.integer({ min: 1, max: 100 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (trigger, gap, contentWidth, contentHeight, along) => {
          const bottom = trigger.top - gap;
          const content: GraceRect = {
            left: trigger.left - 20,
            right: trigger.left - 20 + contentWidth,
            top: bottom - contentHeight,
            bottom,
          };
          // The pointer leaves through the top edge at a place that lies under the content.
          const exitX = content.left + 1 + along * Math.max(0, contentWidth - 2);
          const area = createGraceArea({ x: exitX, y: trigger.top }, trigger, content);
          expect(isPointInPolygon({ x: exitX, y: trigger.top - gap / 2 }, area)).toBe(true);
          expect(isPointInPolygon({ x: exitX, y: trigger.top }, area)).toBe(true);
        },
      ),
      PROPERTY,
    );
  });

  it("[TTG-15] a point on the far side of the content is outside", () => {
    fc.assert(
      fc.property(rect, rect, point, (trigger, content, exit) => {
        const area = createGraceArea(exit, trigger, content);
        // The padded exit points reach 5px beyond the exit point; nothing lies past the highest of them.
        const farthest = Math.min(content.top, exit.y - 5) - 1;
        expect(isPointInPolygon({ x: exit.x, y: farthest }, area)).toBe(false);
      }),
      PROPERTY,
    );
  });
});
