import { createRoot, flushSync, useEffect } from "@shadow-js/core";
import { afterEach, describe, expect, it } from "vitest";
import { createCollection } from "../src/utils/collection";

function row(id: string, parent: Node = document.body): HTMLElement {
  const element = document.createElement("div");
  element.id = id;
  parent.appendChild(element);
  return element;
}

const ids = (items: readonly { readonly element: HTMLElement }[]): string[] =>
  items.map((item) => item.element.id);

afterEach(() => {
  document.body.replaceChildren();
});

describe("collection", () => {
  it("[COL-01] returns items in document order after out-of-order registration", () => {
    const collection = createCollection<number>();
    const a = row("a");
    const b = row("b");
    const c = row("c");
    collection.register(c, 3);
    collection.register(a, 1);
    collection.register(b, 2);
    expect(ids(collection.items())).toEqual(["a", "b", "c"]);
    expect(collection.items().map((item) => item.data)).toEqual([1, 2, 3]);
    expect(collection.indexOf(b)).toBe(1);
    expect(collection.indexOf(document.createElement("i"))).toBe(-1);
  });

  it("[COL-02] getItems re-sorts after DOM reordering while items stays cached", () => {
    const collection = createCollection<string>();
    const a = row("a");
    const b = row("b");
    collection.register(a, "a");
    collection.register(b, "b");
    expect(ids(collection.items())).toEqual(["a", "b"]);
    document.body.insertBefore(b, a);
    expect(ids(collection.items())).toEqual(["a", "b"]);
    expect(ids(collection.getItems())).toEqual(["b", "a"]);
    expect(collection.indexOf(a)).toBe(1);
  });

  it("[COL-03] items is cached until the collection changes", () => {
    const collection = createCollection<number>();
    collection.register(row("a"), 1);
    const first = collection.items();
    expect(collection.items()).toBe(first);
    collection.register(row("b"), 2);
    expect(collection.items()).not.toBe(first);
  });

  it("[COL-04] orders across portals by document position", () => {
    const collection = createCollection<number>();
    const host = row("host");
    const portal = row("portal");
    const inner = row("inner", host);
    const late = row("late", portal);
    collection.register(late, 3);
    collection.register(portal, 2);
    collection.register(inner, 1);
    collection.register(host, 0);
    expect(ids(collection.items())).toEqual(["host", "inner", "portal", "late"]);
  });

  it("[COL-05] an effect re-runs on register, update and unregister", () => {
    const collection = createCollection<number>();
    const seen: string[][] = [];
    const dispose = createRoot((stop) => {
      useEffect(() => {
        seen.push(collection.items().map((item) => `${item.element.id}:${item.data}`));
      });
      return stop;
    });
    flushSync();
    const a = row("a");
    const unregister = collection.register(a, 1);
    flushSync();
    collection.update(a, 5);
    flushSync();
    unregister();
    flushSync();
    expect(seen).toEqual([[], ["a:1"], ["a:5"], []]);
    dispose();
  });

  it("[COL-06] getItems, has and indexOf do not track", () => {
    const collection = createCollection<number>();
    let runs = 0;
    const dispose = createRoot((stop) => {
      useEffect(() => {
        runs += 1;
        collection.getItems();
        collection.indexOf(document.body);
        collection.has(document.body);
      });
      return stop;
    });
    flushSync();
    collection.register(row("a"), 1);
    flushSync();
    expect(runs).toBe(1);
    dispose();
  });

  it("[COL-07] unregister is idempotent and a stale one cannot remove a newer registration", () => {
    const collection = createCollection<string>();
    const a = row("a");
    const stale = collection.register(a, "old");
    const fresh = collection.register(a, "new");
    expect(collection.getItems().map((item) => item.data)).toEqual(["new"]);
    stale();
    expect(collection.has(a)).toBe(true);
    fresh();
    fresh();
    expect(collection.has(a)).toBe(false);
    expect(collection.items()).toEqual([]);
  });

  it("[COL-08] registering the same element twice replaces its data without duplicating", () => {
    const collection = createCollection<number>();
    const a = row("a");
    collection.register(a, 1);
    collection.register(a, 2);
    expect(collection.getItems()).toEqual([{ element: a, data: 2 }]);
  });

  it("[COL-09] update ignores unknown elements", () => {
    const collection = createCollection<number>();
    collection.update(row("ghost"), 1);
    expect(collection.items()).toEqual([]);
  });

  it("[COL-10] keeps registration order for elements that cannot be ordered", () => {
    const collection = createCollection<number>();
    const x = document.createElement("div");
    x.id = "x";
    const y = document.createElement("div");
    y.id = "y";
    collection.register(y, 1);
    collection.register(x, 2);
    expect(ids(collection.getItems())).toEqual(["y", "x"]);
  });

  it("[COL-11] orders items inside shadow roots by their host position", () => {
    const collection = createCollection<number>();
    const first = row("h1");
    const second = row("h2");
    const rootA = first.attachShadow({ mode: "open" });
    const rootB = second.attachShadow({ mode: "open" });
    const inB = document.createElement("div");
    inB.id = "inB";
    rootB.append(inB);
    const inA = document.createElement("div");
    inA.id = "inA";
    rootA.append(inA);
    collection.register(inB, 2);
    collection.register(inA, 1);
    expect(ids(collection.getItems())).toEqual(["inA", "inB"]);
  });

  it("[COL-12] 2000 items register, sort and unregister functionally", () => {
    const collection = createCollection<number>();
    const elements = Array.from({ length: 2000 }, (_, index) => row(`n${index}`));
    const unregisters = [...elements]
      .reverse()
      .map((element, index) => collection.register(element, index));
    const ordered = collection.items();
    expect(ordered.length).toBe(2000);
    expect(ordered[0]?.element.id).toBe("n0");
    expect(ordered[1999]?.element.id).toBe("n1999");
    for (const unregister of unregisters) unregister();
    expect(collection.items().length).toBe(0);
  });
});
