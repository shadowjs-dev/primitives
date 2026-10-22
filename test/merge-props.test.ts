import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { alwaysRun } from "../src/utils/compose";
import { mergeElementProps } from "../src/utils/merge-props";

type Props = Record<string, unknown>;

function fakeEvent(prevented = false): Event {
  const event = new Event("click", { cancelable: true });
  if (prevented) event.preventDefault();
  return event;
}

describe("mergeElementProps", () => {
  it("[MRG-01] the right-most defined value wins for plain attributes", () => {
    const merged: Props = mergeElementProps({ a: 1, b: 1 }, { b: 2, c: 3 }, { c: undefined, d: 4 });
    expect(merged["a"]).toBe(1);
    expect(merged["b"]).toBe(2);
    expect(merged["c"]).toBe(3);
    expect(merged["d"]).toBe(4);
  });

  it("[MRG-02] null, undefined and false sources are skipped; function sources are called on every read", () => {
    let calls = 0;
    const merged: Props = mergeElementProps(null, undefined, false, () => {
      calls += 1;
      return { x: calls };
    });
    expect(merged["x"]).toBe(1);
    expect(merged["x"]).toBe(2);
  });

  it("[MRG-03] getters stay lazy and reactive", () => {
    let value = "a";
    const merged: Props = mergeElementProps({
      get title() {
        return value;
      },
    });
    expect(merged["title"]).toBe("a");
    value = "b";
    expect(merged["title"]).toBe("b");
  });

  it("[MRG-04] keys enumerate as the union of the sources, in first-seen order", () => {
    const merged = mergeElementProps({ a: 1, b: 2 }, { c: 3, a: 4 });
    expect(Object.keys(merged)).toEqual(["a", "b", "c"]);
    expect("c" in merged).toBe(true);
    expect("z" in merged).toBe(false);
    expect({ ...merged }).toEqual({ a: 4, b: 2, c: 3 });
  });

  it("[MRG-05] event handlers all run, the highest priority first", () => {
    const order: string[] = [];
    const merged = mergeElementProps(
      { onClick: () => order.push("internal") },
      { onClick: () => order.push("application") },
    );
    (merged["onClick"] as (event: Event) => void)(fakeEvent());
    expect(order).toEqual(["application", "internal"]);
  });

  it("[MRG-06] preventDefault in a higher-priority handler skips the lower ones, except alwaysRun", () => {
    const order: string[] = [];
    const merged = mergeElementProps(
      { onClick: alwaysRun(() => order.push("bookkeeping")) },
      { onClick: () => order.push("behavior") },
      {
        onClick: (event: Event) => {
          order.push("application");
          event.preventDefault();
        },
      },
    );
    (merged["onClick"] as (event: Event) => void)(fakeEvent());
    expect(order).toEqual(["application", "bookkeeping"]);
  });

  it("[MRG-07] a handler that throws does not stop the others; the error is rethrown afterward", () => {
    const order: string[] = [];
    const merged = mergeElementProps(
      { onClick: () => order.push("internal") },
      {
        onClick: () => {
          order.push("application");
          throw new Error("boom");
        },
      },
    );
    expect(() => (merged["onClick"] as (event: Event) => void)(fakeEvent())).toThrow("boom");
    expect(order).toEqual(["application", "internal"]);
  });

  it("[MRG-08] several throwing handlers are reported together", () => {
    const merged = mergeElementProps(
      {
        onClick: () => {
          throw new Error("a");
        },
      },
      {
        onClick: () => {
          throw new Error("b");
        },
      },
    );
    let caught: unknown;
    try {
      (merged["onClick"] as (event: Event) => void)(fakeEvent());
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AggregateError);
    expect((caught as AggregateError).errors).toHaveLength(2);
  });

  it("[MRG-09] tuple and listener-object handlers compose like functions", () => {
    const seen: unknown[] = [];
    const merged = mergeElementProps(
      { onClick: [(data: unknown) => seen.push(["tuple", data]), 7] },
      { onClick: { handleEvent: () => seen.push("object") } },
    );
    (merged["onClick"] as (event: Event) => void)(fakeEvent());
    expect(seen).toEqual(["object", ["tuple", 7]]);
  });

  it("[MRG-10] a single handler passes through untouched (identity)", () => {
    const handler = (): void => undefined;
    const merged = mergeElementProps({ onClick: handler }, { other: 1 });
    expect(merged["onClick"]).toBe(handler);
  });

  it("[MRG-11] class and className values are all kept and the combination is cached", () => {
    const merged = mergeElementProps({ class: "a" }, { class: ["b", { c: true }] });
    const first = merged["class"];
    expect(first).toEqual(["a", ["b", { c: true }]]);
    expect(merged["class"]).toBe(first);
    expect(mergeElementProps({ class: "only" })["class"]).toBe("only");
  });

  it("[MRG-12] style objects merge with the higher priority winning per property", () => {
    const merged = mergeElementProps(
      { style: { color: "red", margin: "0" } },
      { style: { color: "blue" } },
    );
    expect(merged["style"]).toEqual({ color: "blue", margin: "0" });
  });

  it("[MRG-13] a string style turns the combination into CSS text", () => {
    const merged = mergeElementProps(
      { style: { backgroundColor: "red", "--x": 1 } },
      { style: "color: blue" },
    );
    expect(merged["style"]).toBe("background-color:red;--x:1;color: blue");
  });

  it("[MRG-14] classList objects merge", () => {
    const merged = mergeElementProps(
      { classList: { a: true, b: true } },
      { classList: { b: false } },
    );
    expect(merged["classList"]).toEqual({ a: true, b: false });
  });

  it("[MRG-15] every ref is called, and the composed ref keeps its identity across reads", () => {
    const calls: string[] = [];
    const merged = mergeElementProps(
      { ref: () => calls.push("internal") },
      { ref: () => calls.push("application") },
    );
    const first = merged["ref"] as (element: unknown) => void;
    expect(merged["ref"]).toBe(first);
    first({});
    expect(calls).toEqual(["internal", "application"]);
  });

  it("[MRG-16] composed handlers keep their identity while their inputs do (no rebinding)", () => {
    const a = (): void => undefined;
    const b = (): void => undefined;
    const merged = mergeElementProps({ onClick: a }, { onClick: b });
    expect(merged["onClick"]).toBe(merged["onClick"]);
    const swapped = mergeElementProps({ onClick: a }, () => ({ onClick: b }));
    expect(swapped["onClick"]).toBe(swapped["onClick"]);
  });

  it("[MRG-17] prototype-polluting keys are ignored", () => {
    const hostile = JSON.parse(
      '{"__proto__": {"polluted": true}, "constructor": 1, "ok": 2}',
    ) as object;
    const merged: Props = mergeElementProps(hostile);
    expect(merged["ok"]).toBe(2);
    expect(Object.keys(merged)).toEqual(["ok"]);
    expect(({} as Props)["polluted"]).toBeUndefined();
  });

  it("[MRG-18] the result is read-only", () => {
    const merged: Props = mergeElementProps({ a: 1 });
    expect(Reflect.set(merged, "a", 2)).toBe(false);
    expect(Reflect.deleteProperty(merged, "a")).toBe(false);
    expect(merged["a"]).toBe(1);
  });

  it("[MRG-19] property: for plain keys the result equals the right-most defined value of a model", () => {
    const keyArb = fc.constantFrom("a", "b", "c", "d", "data-x", "aria-label");
    const valueArb = fc.oneof(fc.constant(undefined), fc.integer(), fc.string());
    const sourceArb = fc.array(fc.tuple(keyArb, valueArb), { maxLength: 6 }).map((entries) => {
      const source: Props = {};
      for (const [key, value] of entries) source[key] = value;
      return source;
    });
    fc.assert(
      fc.property(fc.array(sourceArb, { maxLength: 5 }), (sources) => {
        const merged: Props = mergeElementProps(...sources);
        for (const key of ["a", "b", "c", "d", "data-x", "aria-label"]) {
          let expected: unknown;
          for (const source of sources) {
            if (key in source && source[key] !== undefined) expected = source[key];
          }
          expect(merged[key]).toEqual(expected);
        }
      }),
      { seed: 42, numRuns: 300 },
    );
  });
});
