import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { getRovingTarget, type RovingTargetInput } from "../src/utils/roving-focus";

const base = (over: Partial<RovingTargetInput>): RovingTargetInput => ({
  key: "ArrowRight",
  dir: "ltr",
  loop: true,
  disabled: [false, false, false],
  current: 0,
  ...over,
});

describe("getRovingTarget", () => {
  it.each([
    ["ArrowRight", 0, 1],
    ["ArrowRight", 2, 0],
    ["ArrowLeft", 0, 2],
    ["ArrowLeft", 2, 1],
    ["ArrowDown", 1, 2],
    ["ArrowUp", 1, 0],
    ["Home", 2, 0],
    ["End", 0, 2],
    ["PageUp", 2, 0],
    ["PageDown", 0, 2],
  ])("[ROV-01] %s from %i goes to %i with both axes and looping", (keyName, current, expected) => {
    expect(getRovingTarget(base({ key: keyName, current }))).toBe(expected);
  });

  it("[ROV-02] a horizontal group ignores vertical arrows and a vertical group ignores horizontal ones", () => {
    expect(getRovingTarget(base({ key: "ArrowDown", orientation: "horizontal" }))).toBeUndefined();
    expect(getRovingTarget(base({ key: "ArrowUp", orientation: "horizontal" }))).toBeUndefined();
    expect(getRovingTarget(base({ key: "ArrowRight", orientation: "vertical" }))).toBeUndefined();
    expect(getRovingTarget(base({ key: "ArrowLeft", orientation: "vertical" }))).toBeUndefined();
    expect(getRovingTarget(base({ key: "ArrowRight", orientation: "horizontal" }))).toBe(1);
    expect(getRovingTarget(base({ key: "ArrowDown", orientation: "vertical" }))).toBe(1);
  });

  it("[ROV-03] RTL swaps ArrowLeft and ArrowRight but not the vertical arrows", () => {
    expect(getRovingTarget(base({ key: "ArrowRight", dir: "rtl", current: 1 }))).toBe(0);
    expect(getRovingTarget(base({ key: "ArrowLeft", dir: "rtl", current: 1 }))).toBe(2);
    expect(getRovingTarget(base({ key: "ArrowDown", dir: "rtl", current: 1 }))).toBe(2);
  });

  it("[ROV-04] without loop the ends stay put", () => {
    expect(getRovingTarget(base({ key: "ArrowRight", loop: false, current: 2 }))).toBeUndefined();
    expect(getRovingTarget(base({ key: "ArrowLeft", loop: false, current: 0 }))).toBeUndefined();
  });

  it("[ROV-05] disabled items are skipped, also across the wrap", () => {
    expect(getRovingTarget(base({ disabled: [false, true, false], current: 0 }))).toBe(2);
    expect(getRovingTarget(base({ disabled: [false, true, true], current: 0 }))).toBeUndefined();
    expect(
      getRovingTarget(base({ key: "ArrowLeft", disabled: [true, false, false], current: 1 })),
    ).toBe(2);
    expect(getRovingTarget(base({ key: "Home", disabled: [true, false, false] }))).toBe(1);
    expect(getRovingTarget(base({ key: "End", disabled: [false, false, true] }))).toBe(1);
  });

  it("[ROV-06] an unknown current index starts at the first or last enabled item", () => {
    expect(getRovingTarget(base({ current: -1 }))).toBe(0);
    expect(getRovingTarget(base({ key: "ArrowLeft", current: -1 }))).toBe(2);
  });

  it("[ROV-07] other keys and empty groups do nothing", () => {
    expect(getRovingTarget(base({ key: "a" }))).toBeUndefined();
    expect(getRovingTarget(base({ key: "Enter" }))).toBeUndefined();
    expect(getRovingTarget(base({ disabled: [], current: -1 }))).toBeUndefined();
    expect(getRovingTarget(base({ key: "Home", disabled: [] }))).toBeUndefined();
  });

  const inputArb = fc.record({
    key: fc.constantFrom(
      "ArrowRight",
      "ArrowLeft",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "x",
    ),
    orientation: fc.constantFrom(undefined, "horizontal" as const, "vertical" as const),
    dir: fc.constantFrom("ltr" as const, "rtl" as const),
    loop: fc.boolean(),
    disabled: fc.array(fc.boolean(), { maxLength: 8 }),
    current: fc.integer({ min: -2, max: 9 }),
  });

  it("[ROV-08] property: the result is always the index of an enabled item", () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const target = getRovingTarget(input);
        if (target !== undefined) {
          expect(Number.isInteger(target)).toBe(true);
          expect(input.disabled[target]).toBe(false);
        }
      }),
      { seed: 42, numRuns: 1000 },
    );
  });

  it("[ROV-09] property: with loop and an enabled item elsewhere, an arrow always moves somewhere", () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const arrow = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(input.key);
        const allowed =
          input.orientation === undefined ||
          (input.orientation === "horizontal" && input.key.endsWith("t")) ||
          (input.orientation === "vertical" &&
            (input.key === "ArrowUp" || input.key === "ArrowDown"));
        const others = input.disabled.filter(
          (flag, index) => index !== input.current && !flag,
        ).length;
        if (
          !arrow ||
          !allowed ||
          !input.loop ||
          input.current < 0 ||
          input.current >= input.disabled.length
        )
          return;
        const target = getRovingTarget(input);
        if (others > 0) expect(target).toBeDefined();
        if (target !== undefined) expect(target).not.toBe(input.current);
      }),
      { seed: 42, numRuns: 1000 },
    );
  });

  it("[ROV-10] property: in RTL, ArrowLeft and ArrowRight swap exactly", () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const left = getRovingTarget({ ...input, key: "ArrowLeft", dir: "ltr" });
        const right = getRovingTarget({ ...input, key: "ArrowRight", dir: "ltr" });
        expect(getRovingTarget({ ...input, key: "ArrowLeft", dir: "rtl" })).toBe(right);
        expect(getRovingTarget({ ...input, key: "ArrowRight", dir: "rtl" })).toBe(left);
      }),
      { seed: 42, numRuns: 500 },
    );
  });

  it("[ROV-11] property: vertical arrows are unaffected by direction", () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        for (const keyName of ["ArrowUp", "ArrowDown"]) {
          expect(getRovingTarget({ ...input, key: keyName, dir: "ltr" })).toBe(
            getRovingTarget({ ...input, key: keyName, dir: "rtl" }),
          );
        }
      }),
      { seed: 42, numRuns: 300 },
    );
  });
});
