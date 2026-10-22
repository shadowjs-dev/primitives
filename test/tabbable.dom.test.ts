import * as fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";
import {
  focusFirst,
  getDeepActiveElement,
  getFocusables,
  getTabbables,
  isFocusable,
} from "../src/utils/tabbable";

function mount(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  return root;
}
const ids = (elements: readonly Element[]): string[] => elements.map((element) => element.id);

afterEach(() => {
  document.body.replaceChildren();
});

describe("tabbable", () => {
  it("[TAB-01] finds focusable elements in document order", () => {
    const root = mount(`
      <a id="link" href="#">l</a><a id="nolink">x</a><button id="b">b</button>
      <input id="i"><input id="hidden" type="hidden"><select id="s"></select><textarea id="t"></textarea>
      <div id="ce" contenteditable="true"></div><div id="ce-off" contenteditable="false"></div>
      <div id="ti" tabindex="0"></div><summary id="sum">s</summary>`);
    expect(ids(getFocusables(root))).toEqual(["link", "b", "i", "s", "t", "ce", "ti", "sum"]);
  });

  it("[TAB-02] positive tabindex values come first, ascending, then document order", () => {
    const root = mount(`
      <button id="a"></button><button id="b" tabindex="2"></button>
      <button id="c" tabindex="1"></button><button id="d" tabindex="2"></button><button id="e"></button>`);
    expect(ids(getTabbables(root))).toEqual(["c", "b", "d", "a", "e"]);
  });

  it("[TAB-03] a negative tabindex is focusable but not tabbable", () => {
    const root = mount('<button id="a" tabindex="-1"></button><button id="b"></button>');
    expect(ids(getFocusables(root))).toEqual(["a", "b"]);
    expect(ids(getTabbables(root))).toEqual(["b"]);
  });

  it("[TAB-04] skips disabled, hidden, inert and display:none content", () => {
    const root = mount(`
      <button id="ok"></button>
      <button id="disabled" disabled></button>
      <button id="hidden" hidden></button>
      <div inert><button id="inert"></button></div>
      <div style="display:none"><button id="none"></button></div>
      <button id="invisible" style="visibility:hidden"></button>
      <fieldset disabled><legend><button id="legend"></button></legend><button id="fs"></button></fieldset>`);
    expect(ids(getTabbables(root))).toEqual(["ok", "legend"]);
  });

  it("[TAB-05] a radio group is one tab stop: the checked radio, or the first when none is checked", () => {
    const root = mount(`
      <input id="a1" type="radio" name="a"><input id="a2" type="radio" name="a" checked><input id="a3" type="radio" name="a">
      <input id="b1" type="radio" name="b"><input id="b2" type="radio" name="b">
      <input id="free" type="radio">`);
    expect(ids(getTabbables(root))).toEqual(["a2", "b1", "free"]);
  });

  it("[TAB-06] includeContainer adds the root when it is focusable", () => {
    const root = mount('<button id="b"></button>');
    root.id = "root";
    root.tabIndex = 0;
    expect(ids(getTabbables(root))).toEqual(["b"]);
    expect(ids(getTabbables(root, { includeContainer: true }))).toEqual(["root", "b"]);
  });

  it("[TAB-07] looks into open shadow roots, and ignores them when asked to", () => {
    const root = mount('<div id="host"></div><button id="after"></button>');
    const host = root.querySelector("#host") as HTMLElement;
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = '<button id="inner"></button>';
    expect(ids(getTabbables(root))).toEqual(["inner", "after"]);
    expect(ids(getTabbables(root, { shadow: false }))).toEqual(["after"]);
  });

  it("[TAB-08] isFocusable applies the same rules to a single element", () => {
    const root = mount(
      '<button id="a"></button><button id="b" disabled></button><div id="c"></div><div hidden><button id="d"></button></div>',
    );
    const get = (id: string): Element => root.querySelector(`#${id}`) as Element;
    expect(isFocusable(get("a"))).toBe(true);
    expect(isFocusable(get("b"))).toBe(false);
    expect(isFocusable(get("c"))).toBe(false);
    expect(isFocusable(get("d"))).toBe(false);
  });

  it("[TAB-09] focusFirst focuses the first candidate that takes focus and reports it", () => {
    const root = mount(
      '<button id="a" disabled></button><button id="b"></button><button id="c"></button>',
    );
    const candidates = [...root.querySelectorAll("button")];
    const focused = focusFirst(candidates);
    expect(focused?.id).toBe("b");
    expect(document.activeElement?.id).toBe("b");
  });

  it("[TAB-10] focusFirst with select selects the text of an input", () => {
    const root = mount('<input id="i" value="hello">');
    const input = root.querySelector("input") as HTMLInputElement;
    focusFirst([input], { select: true });
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(5);
  });

  it("[TAB-11] getDeepActiveElement looks through open shadow roots", () => {
    const root = mount('<div id="host"></div>');
    const host = root.querySelector("#host") as HTMLElement;
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = '<button id="inner"></button>';
    (shadow.querySelector("button") as HTMLElement).focus();
    expect(getDeepActiveElement()?.id).toBe("inner");
  });

  it("[TAB-12] property: tabbables are a subsequence of focusables, in the same relative order for tabindex <= 0", () => {
    const itemArb = fc.constantFrom(
      "button",
      "button tabindex=-1",
      "button disabled",
      "input",
      "a href=#",
      "div",
    );
    fc.assert(
      fc.property(fc.array(itemArb, { maxLength: 12 }), (items) => {
        const root = mount(
          items
            .map(
              (item, index) =>
                `<${item.split(" ")[0]} id="e${index}" ${item.split(" ").slice(1).join(" ")}></${item.split(" ")[0]}>`,
            )
            .join(""),
        );
        const focusables = ids(getFocusables(root));
        const tabbables = ids(getTabbables(root));
        let cursor = 0;
        for (const id of tabbables) {
          cursor = focusables.indexOf(id, cursor);
          expect(cursor).toBeGreaterThanOrEqual(0);
          cursor += 1;
        }
        root.remove();
      }),
      { seed: 42, numRuns: 100 },
    );
  });

  it("[TAB-13] deeply nested content does not overflow the stack", () => {
    // happy-dom's own selector engine recurses, so the depth stays below its limit; our walk is iterative.
    const depth = 1500;
    const root = document.createElement("div");
    document.body.append(root);
    let parent: HTMLElement = root;
    for (let level = 0; level < depth; level += 1) {
      const child = document.createElement("div");
      parent.append(child);
      parent = child;
    }
    const button = document.createElement("button");
    button.id = "deep";
    parent.append(button);
    expect(ids(getTabbables(root))).toEqual(["deep"]);
    expect(isFocusable(button)).toBe(true);
  });
});
