import { describe, expect, it } from "vitest";
import {
  alwaysRun,
  callHandler,
  composeEventHandlers,
  composeRefs,
  toCallable,
} from "../src/utils/compose";

const click = (): Event => new Event("click", { cancelable: true });

describe("compose", () => {
  it("[CMP-01] toCallable turns every handler form into a function", () => {
    const seen: unknown[] = [];
    toCallable((event: unknown) => seen.push(["fn", event]))?.(1 as never);
    toCallable([(data: unknown, event: unknown) => seen.push(["tuple", data, event]), "d"])?.(
      2 as never,
    );
    toCallable({ handleEvent: (event: unknown) => seen.push(["object", event]) })?.(3 as never);
    expect(seen).toEqual([
      ["fn", 1],
      ["tuple", "d", 2],
      ["object", 3],
    ]);
    expect(toCallable(undefined)).toBeUndefined();
    expect(toCallable(null)).toBeUndefined();
    expect(toCallable("nope")).toBeUndefined();
    expect(toCallable([])).toBeUndefined();
  });

  it("[CMP-02] callHandler is a no-op without a handler and passes the event", () => {
    const event = click();
    let received: unknown;
    callHandler(undefined, event);
    callHandler((e: unknown) => {
      received = e;
    }, event);
    expect(received).toBe(event);
  });

  it("[CMP-03] composeEventHandlers runs the application first and the library only if not prevented", () => {
    const order: string[] = [];
    const normal = composeEventHandlers(
      () => () => order.push("app"),
      () => order.push("lib"),
    );
    normal(click());
    expect(order).toEqual(["app", "lib"]);
    order.length = 0;
    const veto = composeEventHandlers(
      () => (event: Event) => {
        order.push("app");
        event.preventDefault();
      },
      () => order.push("lib"),
    );
    veto(click());
    expect(order).toEqual(["app"]);
    order.length = 0;
    const always = composeEventHandlers(
      () => (event: Event) => {
        order.push("app");
        event.preventDefault();
      },
      () => order.push("lib"),
      false,
    );
    always(click());
    expect(order).toEqual(["app", "lib"]);
  });

  it("[CMP-04] composeEventHandlers reads the application's handler at event time", () => {
    let current: (() => void) | undefined;
    const order: string[] = [];
    const handler = composeEventHandlers(
      () => current,
      () => order.push("lib"),
    );
    handler(click());
    current = () => order.push("late");
    handler(click());
    expect(order).toEqual(["lib", "late", "lib"]);
  });

  it("[CMP-05] composeRefs calls every ref and skips undefined ones", () => {
    const seen: string[] = [];
    composeRefs<string>(
      (element) => seen.push(`a:${element}`),
      undefined,
      (element) => seen.push(`b:${element}`),
    )("el");
    expect(seen).toEqual(["a:el", "b:el"]);
  });

  it("[CMP-06] alwaysRun marks a function without changing it", () => {
    const handler = (): void => undefined;
    expect(alwaysRun(handler)).toBe(handler);
  });
});
