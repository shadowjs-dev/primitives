import { createRoot, flushSync, useSignal } from "@shadow-js/core";
import { afterEach, describe, expect, it } from "vitest";
import { useFocusScope } from "../src/utils/focus-scope";
import { focus, key, trackListeners } from "./support/dom";

const disposers: Array<() => void> = [];
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.replaceChildren();
});

function region(html: string): HTMLElement {
  const container = document.createElement("div");
  container.tabIndex = -1;
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

function scope(options: Parameters<typeof useFocusScope>[0]): void {
  createRoot((dispose) => {
    disposers.push(dispose);
    useFocusScope(options);
  });
  flushSync();
}

describe("useFocusScope", () => {
  it("[FSC-01] moves focus to the first tabbable and restores it on disposal", () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const container = region('<button id="a"></button><button id="b"></button>');
    scope({ container: () => container });
    expect(document.activeElement?.id).toBe("a");
    for (const dispose of disposers.splice(0)) dispose();
    expect(document.activeElement).toBe(opener);
  });

  it("[FSC-02] focuses the container when nothing inside is tabbable", () => {
    const container = region("<p>text</p>");
    scope({ container: () => container });
    expect(document.activeElement).toBe(container);
  });

  it("[FSC-03] onMountAutoFocus can veto the default and move focus itself", () => {
    const container = region('<button id="a"></button><button id="b"></button>');
    scope({
      container: () => container,
      onMountAutoFocus: () => (event) => {
        event.preventDefault();
        (container.querySelector("#b") as HTMLElement).focus();
      },
    });
    expect(document.activeElement?.id).toBe("b");
  });

  it("[FSC-04] focus is not restored when the user already moved it somewhere else on purpose", () => {
    const opener = document.createElement("button");
    const elsewhere = document.createElement("input");
    document.body.append(opener, elsewhere);
    opener.focus();
    const container = region('<button id="a"></button>');
    scope({ container: () => container });
    elsewhere.focus();
    for (const dispose of disposers.splice(0)) dispose();
    expect(document.activeElement).toBe(elsewhere);
  });

  it("[FSC-05] onUnmountAutoFocus can veto the restore", () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const container = region('<button id="a"></button>');
    scope({
      container: () => container,
      onUnmountAutoFocus: () => (event) => event.preventDefault(),
    });
    for (const dispose of disposers.splice(0)) dispose();
    expect(document.activeElement).not.toBe(opener);
  });

  it("[FSC-06] enabled=false deactivates the scope and restores focus; enabling again re-focuses", () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const container = region('<button id="a"></button>');
    const [enabled, setEnabled] = useSignal(true);
    scope({ container: () => container, enabled });
    expect(document.activeElement?.id).toBe("a");
    setEnabled(false);
    flushSync();
    expect(document.activeElement).toBe(opener);
    setEnabled(true);
    flushSync();
    expect(document.activeElement?.id).toBe("a");
  });

  it("[FSC-07] a trapped scope pulls focus back from outside", () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const container = region('<button id="a"></button><button id="b"></button>');
    scope({ container: () => container, trapped: () => true });
    focus(container.querySelector("#b") as HTMLElement);
    focus(outside);
    expect(document.activeElement?.id).toBe("b");
  });

  it("[FSC-08] an untrapped scope lets focus leave", () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const container = region('<button id="a"></button>');
    scope({ container: () => container });
    focus(outside);
    expect(document.activeElement).toBe(outside);
  });

  it("[FSC-09] Tab on the last element wraps to the first, Shift+Tab on the first to the last", () => {
    const container = region(
      '<button id="a"></button><button id="b"></button><button id="c"></button>',
    );
    scope({ container: () => container, trapped: () => true, loop: () => true });
    focus(container.querySelector("#c") as HTMLElement);
    expect(key(document.activeElement as Element, "Tab")).toBe(false);
    expect(document.activeElement?.id).toBe("a");
    expect(key(document.activeElement as Element, "Tab", { shiftKey: true })).toBe(false);
    expect(document.activeElement?.id).toBe("c");
  });

  it("[FSC-10] Tab in the middle is left to the browser", () => {
    const container = region('<button id="a"></button><button id="b"></button>');
    scope({ container: () => container, trapped: () => true, loop: () => true });
    focus(container.querySelector("#a") as HTMLElement);
    expect(key(document.activeElement as Element, "Tab")).toBe(true);
  });

  it("[FSC-11] a trapped scope without loop stops Tab at the edges without wrapping", () => {
    const container = region('<button id="a"></button><button id="b"></button>');
    scope({ container: () => container, trapped: () => true, loop: () => false });
    focus(container.querySelector("#b") as HTMLElement);
    expect(key(document.activeElement as Element, "Tab")).toBe(false);
    expect(document.activeElement?.id).toBe("b");
  });

  it("[FSC-12] with no tabbable content Tab keeps focus on the container", () => {
    const container = region("<p>x</p>");
    scope({ container: () => container, trapped: () => true, loop: () => true });
    expect(key(container, "Tab")).toBe(false);
    expect(document.activeElement).toBe(container);
  });

  it("[FSC-13] a second scope pauses the first and the first resumes when it ends", () => {
    const first = region('<button id="f1"></button>');
    const second = region('<button id="s1"></button>');
    const outside = document.createElement("button");
    document.body.append(outside);
    scope({ container: () => first, trapped: () => true });
    let stopSecond: (() => void) | undefined;
    createRoot((dispose) => {
      stopSecond = dispose;
      useFocusScope({ container: () => second, trapped: () => true });
    });
    flushSync();
    expect(document.activeElement?.id).toBe("s1");
    // The first scope is paused: it does not fight the second one.
    focus(second.querySelector("#s1") as HTMLElement);
    expect(document.activeElement?.id).toBe("s1");
    stopSecond?.();
    flushSync();
    focus(outside);
    expect(first.contains(document.activeElement)).toBe(true);
  });

  it("[FSC-14] when the focused node is removed, a trapped scope takes focus back", () => {
    const container = region('<button id="a"></button><button id="b"></button>');
    scope({ container: () => container, trapped: () => true });
    focus(container.querySelector("#b") as HTMLElement);
    container.querySelector("#b")?.remove();
    // MutationObserver callbacks are microtasks: deliver them through the observer queue.
    return Promise.resolve().then(() => {
      flushSync();
      expect(container.contains(document.activeElement)).toBe(true);
    });
  });

  it("[FSC-15] disposal removes every listener and observer", () => {
    const ledger = trackListeners();
    const before = ledger.describe();
    const container = region('<button id="a"></button>');
    scope({ container: () => container, trapped: () => true, loop: () => true });
    expect(ledger.active()).toBeGreaterThan(before.length);
    for (const dispose of disposers.splice(0)) dispose();
    expect(ledger.describe()).toEqual(before);
    ledger.restore();
  });
});
