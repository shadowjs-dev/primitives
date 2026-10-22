import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  getSafeArea,
  type IntentBox,
  type IntentPoint,
  isPointerHeadingToSubmenu,
  isPointInSafePolygon,
} from "../src/menu/intent";
import { getRovingTarget } from "../src/utils/roving-focus";
import { createTypeahead } from "../src/utils/typeahead";

const PROPERTY = { seed: 42, numRuns: 300 } as const;

const coordinate = fc.integer({ min: -400, max: 400 });
/** A submenu box strictly to the right of an exit point (at least 10px away). */
const rightBox = fc
  .record({
    exitX: coordinate,
    exitY: coordinate,
    gap: fc.integer({ min: 10, max: 200 }),
    width: fc.integer({ min: 20, max: 300 }),
    top: fc.integer({ min: -300, max: 300 }),
    height: fc.integer({ min: 20, max: 300 }),
  })
  .map(({ exitX, exitY, gap, width, top, height }) => {
    const exit: IntentPoint = { x: exitX, y: exitY };
    const box: IntentBox = {
      left: exitX + gap,
      right: exitX + gap + width,
      top,
      bottom: top + height,
    };
    return { exit, box };
  });

/** Sign of the cross product: which side of a-b the point is on. */
function cross(a: IntentPoint, b: IntentPoint, p: IntentPoint): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

/** Reference implementation: barycentric sign test; `undefined` on an edge. */
function inTriangle(
  p: IntentPoint,
  a: IntentPoint,
  b: IntentPoint,
  c: IntentPoint,
): boolean | undefined {
  const signs = [cross(a, b, p), cross(b, c, p), cross(c, a, p)];
  if (signs.some((sign) => sign === 0)) return undefined;
  return signs.every((sign) => sign > 0) || signs.every((sign) => sign < 0);
}

describe("submenu safe area geometry", () => {
  it("[MENU-L01] the area faces the side the submenu is on and starts behind the exit point", () => {
    const right = getSafeArea({ x: 100, y: 20 }, { left: 104, right: 204, top: 0, bottom: 80 });
    expect(right.side).toBe("right");
    expect(right.polygon).toEqual([
      { x: 95, y: 20 },
      { x: 104, y: 0 },
      { x: 204, y: 0 },
      { x: 204, y: 80 },
      { x: 104, y: 80 },
    ]);
    const left = getSafeArea({ x: 100, y: 20 }, { left: -4, right: 96, top: 0, bottom: 80 });
    expect(left.side).toBe("left");
    expect(left.polygon[0]).toEqual({ x: 105, y: 20 });
    expect(left.polygon[1]).toEqual({ x: 96, y: 0 });
  });

  it("[MENU-L02] a custom bleed moves the start of the triangle", () => {
    const area = getSafeArea({ x: 100, y: 20 }, { left: 104, right: 204, top: 0, bottom: 80 }, 12);
    expect(area.polygon[0]).toEqual({ x: 88, y: 20 });
  });

  it("[MENU-L03] ray casting handles a concave polygon and points on neither side", () => {
    const concave: IntentPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 5, y: 4 },
      { x: 0, y: 10 },
    ];
    expect(isPointInSafePolygon({ x: 2, y: 2 }, concave)).toBe(true);
    expect(isPointInSafePolygon({ x: 5, y: 8 }, concave)).toBe(false);
    expect(isPointInSafePolygon({ x: 20, y: 2 }, concave)).toBe(false);
    expect(isPointInSafePolygon({ x: 1, y: 1 }, [])).toBe(false);
  });

  it("[MENU-L04] every point strictly inside the triangle from the exit to the near corners is in the area", () => {
    fc.assert(
      fc.property(
        rightBox,
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 1, max: 9 }),
        ({ exit, box }, a, b, c) => {
          const area = getSafeArea(exit, box);
          const start = area.polygon[0] as IntentPoint;
          const nearTop: IntentPoint = { x: box.left, y: box.top };
          const nearBottom: IntentPoint = { x: box.left, y: box.bottom };
          const total = a + b + c;
          const point: IntentPoint = {
            x: (a * start.x + b * nearTop.x + c * nearBottom.x) / total,
            y: (a * start.y + b * nearTop.y + c * nearBottom.y) / total,
          };
          // The reference agrees that the point is strictly inside (skips degenerate boundary hits).
          fc.pre(inTriangle(point, start, nearTop, nearBottom) === true);
          expect(isPointInSafePolygon(point, area.polygon)).toBe(true);
        },
      ),
      PROPERTY,
    );
  });

  it("[MENU-L05] every point inside the submenu's own box is in the area", () => {
    fc.assert(
      fc.property(
        rightBox,
        fc.double({ min: 0.05, max: 0.95, noNaN: true }),
        fc.double({ min: 0.05, max: 0.95, noNaN: true }),
        ({ exit, box }, u, v) => {
          const area = getSafeArea(exit, box);
          const point: IntentPoint = {
            x: box.left + (box.right - box.left) * u,
            y: box.top + (box.bottom - box.top) * v,
          };
          expect(isPointInSafePolygon(point, area.polygon)).toBe(true);
        },
      ),
      PROPERTY,
    );
  });

  it("[MENU-L06] points behind the exit, above, below or beyond the submenu are outside", () => {
    fc.assert(
      fc.property(rightBox, fc.integer({ min: 1, max: 200 }), ({ exit, box }, away) => {
        const area = getSafeArea(exit, box);
        const top = Math.min(box.top, exit.y);
        const bottom = Math.max(box.bottom, exit.y);
        expect(isPointInSafePolygon({ x: exit.x - 5 - away, y: exit.y }, area.polygon)).toBe(false);
        expect(isPointInSafePolygon({ x: box.left + 1, y: top - away }, area.polygon)).toBe(false);
        expect(isPointInSafePolygon({ x: box.left + 1, y: bottom + away }, area.polygon)).toBe(
          false,
        );
        expect(isPointInSafePolygon({ x: box.right + away, y: box.top + 1 }, area.polygon)).toBe(
          false,
        );
      }),
      PROPERTY,
    );
  });

  it("[MENU-L07] mirroring the layout mirrors the answer (submenus on the left behave like on the right)", () => {
    fc.assert(
      fc.property(rightBox, coordinate, coordinate, ({ exit, box }, px, py) => {
        const mirrorPoint = (p: IntentPoint): IntentPoint => ({ x: -p.x, y: p.y });
        const mirrorBox: IntentBox = {
          left: -box.right,
          right: -box.left,
          top: box.top,
          bottom: box.bottom,
        };
        const right = getSafeArea(exit, box);
        const left = getSafeArea(mirrorPoint(exit), mirrorBox);
        expect(right.side).toBe("right");
        expect(left.side).toBe("left");
        const point = { x: px, y: py };
        expect(isPointInSafePolygon(mirrorPoint(point), left.polygon)).toBe(
          isPointInSafePolygon(point, right.polygon),
        );
      }),
      PROPERTY,
    );
  });

  it("[MENU-L08] ray casting agrees with a barycentric reference on random triangles", () => {
    const vertex = fc.record({
      x: fc.integer({ min: -50, max: 50 }),
      y: fc.integer({ min: -50, max: 50 }),
    });
    fc.assert(
      fc.property(vertex, vertex, vertex, vertex, (a, b, c, p) => {
        fc.pre(cross(a, b, c) !== 0);
        const expected = inTriangle(p, a, b, c);
        fc.pre(expected !== undefined);
        expect(isPointInSafePolygon(p, [a, b, c])).toBe(expected);
      }),
      PROPERTY,
    );
  });

  it("[MENU-L09] heading to the submenu needs an area, the right direction and a point inside", () => {
    const area = getSafeArea({ x: 100, y: 20 }, { left: 104, right: 204, top: 0, bottom: 80 });
    const inside = { x: 150, y: 40 };
    expect(isPointerHeadingToSubmenu(inside, area, "right")).toBe(true);
    expect(isPointerHeadingToSubmenu(inside, area, "left")).toBe(false);
    expect(isPointerHeadingToSubmenu(inside, area, null)).toBe(false);
    expect(isPointerHeadingToSubmenu(inside, null, "right")).toBe(false);
    expect(isPointerHeadingToSubmenu({ x: 0, y: 40 }, area, "right")).toBe(false);
  });

  it("[MENU-L10] the answer is the polygon test whenever the direction matches", () => {
    fc.assert(
      fc.property(rightBox, coordinate, coordinate, ({ exit, box }, px, py) => {
        const area = getSafeArea(exit, box);
        const point = { x: px, y: py };
        expect(isPointerHeadingToSubmenu(point, area, area.side)).toBe(
          isPointInSafePolygon(point, area.polygon),
        );
        expect(
          isPointerHeadingToSubmenu(point, area, area.side === "right" ? "left" : "right"),
        ).toBe(false);
      }),
      PROPERTY,
    );
  });
});

describe("menu item movement", () => {
  const flags = fc.array(fc.boolean(), { minLength: 1, maxLength: 12 });
  const down = (disabled: boolean[], current: number, loop: boolean): number | undefined =>
    getRovingTarget({
      key: "ArrowDown",
      orientation: "vertical",
      dir: "ltr",
      loop,
      disabled,
      current,
    });

  it("[MENU-L20] an arrow key always lands on an enabled item other than the current one", () => {
    fc.assert(
      fc.property(
        flags,
        fc.boolean(),
        fc.constantFrom("ArrowDown", "ArrowUp"),
        fc.nat(11),
        (disabled, loop, keyName, seed) => {
          const current = seed % disabled.length;
          const target = getRovingTarget({
            key: keyName,
            orientation: "vertical",
            dir: "ltr",
            loop,
            disabled,
            current,
          });
          if (target === undefined) return;
          expect(disabled[target]).toBe(false);
          expect(target).not.toBe(current);
          expect(target).toBeGreaterThanOrEqual(0);
          expect(target).toBeLessThan(disabled.length);
        },
      ),
      PROPERTY,
    );
  });

  it("[MENU-L21] without looping, ArrowDown only moves forward and ArrowUp only backward", () => {
    fc.assert(
      fc.property(flags, fc.nat(11), (disabled, seed) => {
        const current = seed % disabled.length;
        const next = getRovingTarget({
          key: "ArrowDown",
          orientation: "vertical",
          dir: "ltr",
          loop: false,
          disabled,
          current,
        });
        const previous = getRovingTarget({
          key: "ArrowUp",
          orientation: "vertical",
          dir: "ltr",
          loop: false,
          disabled,
          current,
        });
        if (next !== undefined) expect(next).toBeGreaterThan(current);
        if (previous !== undefined) expect(previous).toBeLessThan(current);
      }),
      PROPERTY,
    );
  });

  it("[MENU-L22] looping ArrowDown visits every enabled item exactly once per lap", () => {
    fc.assert(
      fc.property(flags, (disabled) => {
        const enabled = disabled.flatMap((off, index) => (off ? [] : [index]));
        // A single enabled item has nowhere to go.
        fc.pre(enabled.length > 1);
        const visited: number[] = [];
        let current = down(disabled, -1, true);
        for (let step = 0; step < enabled.length; step += 1) {
          expect(current).toBeDefined();
          visited.push(current as number);
          current = down(disabled, current as number, true);
        }
        expect([...visited].sort((a, b) => a - b)).toEqual(enabled);
        // After a full lap it is back at the start.
        expect(current).toBe(enabled[0]);
      }),
      PROPERTY,
    );
  });

  it("[MENU-L23] Home and End land on the first and last enabled items", () => {
    fc.assert(
      fc.property(flags, fc.nat(11), (disabled, seed) => {
        const enabled = disabled.flatMap((off, index) => (off ? [] : [index]));
        const input = {
          orientation: "vertical",
          dir: "ltr",
          loop: false,
          disabled,
          current: seed % disabled.length,
        } as const;
        expect(getRovingTarget({ ...input, key: "Home" })).toBe(enabled[0]);
        expect(getRovingTarget({ ...input, key: "End" })).toBe(enabled.at(-1));
      }),
      PROPERTY,
    );
  });

  it("[MENU-L24] horizontal arrows do nothing in a vertical menu", () => {
    fc.assert(
      fc.property(
        flags,
        fc.constantFrom("ArrowLeft", "ArrowRight"),
        fc.constantFrom("ltr", "rtl"),
        (disabled, keyName, dir) => {
          expect(
            getRovingTarget({
              key: keyName,
              orientation: "vertical",
              dir,
              loop: true,
              disabled,
              current: 0,
            }),
          ).toBeUndefined();
        },
      ),
      PROPERTY,
    );
  });

  it("[MENU-L25] typeahead lands on an enabled item whose text starts with the typed character", () => {
    const label = fc.string({ unit: fc.constantFrom(..."abcdef"), minLength: 1, maxLength: 5 });
    fc.assert(
      fc.property(
        fc.array(fc.record({ value: label, disabled: fc.boolean() }), {
          minLength: 1,
          maxLength: 10,
        }),
        fc.constantFrom(..."abcdef"),
        fc.integer({ min: -1, max: 9 }),
        (items, character, current) => {
          const typeahead = createTypeahead({ now: () => 0 });
          const index = typeahead.handleKey(character, items, current);
          if (index === undefined) {
            // Nothing matched: no enabled item starts with the character (other than the current one for a repeat).
            const candidates = items.flatMap((item, at) =>
              !item.disabled && item.value.startsWith(character) && at !== current ? [at] : [],
            );
            expect(candidates).toEqual([]);
            return;
          }
          expect(items[index]?.disabled).toBe(false);
          expect(items[index]?.value.startsWith(character)).toBe(true);
        },
      ),
      PROPERTY,
    );
  });
});
