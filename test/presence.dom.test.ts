import { createRoot, flushSync, useSignal } from "@shadow-js/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePresence } from "../src/utils/presence";
import { trackListeners } from "./support/dom";

interface Style {
  animationName: string;
  animationDuration: string;
  animationDelay: string;
  transitionProperty: string;
  transitionDuration: string;
  transitionDelay: string;
}

const none: Style = {
  animationName: "none",
  animationDuration: "0s",
  animationDelay: "0s",
  transitionProperty: "none",
  transitionDuration: "0s",
  transitionDelay: "0s",
};

const disposers: Array<() => void> = [];
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.replaceChildren();
});

function setup(style: Style, running: () => boolean = () => true) {
  vi.spyOn(window, "getComputedStyle").mockImplementation(
    () => ({ ...style, display: "block", visibility: "visible" }) as unknown as CSSStyleDeclaration,
  );
  vi.spyOn(Element.prototype, "getAnimations").mockImplementation(() =>
    running() ? [{} as Animation] : [],
  );
  const node = document.createElement("div");
  document.body.append(node);
  const [present, setPresent] = useSignal(true);
  const presence = usePresence(present);
  presence.ref(node);
  return { node, present, setPresent, presence };
}

function within<T>(run: () => T): T {
  return createRoot((dispose) => {
    disposers.push(dispose);
    return run();
  });
}

describe("usePresence", () => {
  it("[PRS-01] starts mounted when present and unmounted when not", () => {
    within(() => {
      expect(usePresence(() => true).mounted()).toBe(true);
      expect(usePresence(() => false).mounted()).toBe(false);
    });
  });

  it("[PRS-02] mounting is immediate", () => {
    within(() => {
      const [present, setPresent] = useSignal(false);
      const presence = usePresence(present);
      setPresent(true);
      flushSync();
      expect(presence.mounted()).toBe(true);
    });
  });

  it("[PRS-03] unmounts at once when the element has no animation or transition", () => {
    within(() => {
      const { setPresent, presence } = setup(none);
      flushSync();
      setPresent(false);
      flushSync();
      expect(presence.mounted()).toBe(false);
    });
  });

  it("[PRS-04] unmounts at once when styles declare a duration but nothing is running", () => {
    within(() => {
      const { setPresent, presence } = setup(
        { ...none, animationName: "fade", animationDuration: "300ms" },
        () => false,
      );
      flushSync();
      setPresent(false);
      flushSync();
      expect(presence.mounted()).toBe(false);
    });
  });

  it("[PRS-05] waits for animationend on the element itself", () => {
    within(() => {
      let running = true;
      const { node, setPresent, presence } = setup(
        { ...none, animationName: "fade", animationDuration: "300ms" },
        () => running,
      );
      flushSync();
      setPresent(false);
      flushSync();
      expect(presence.mounted()).toBe(true);
      const child = document.createElement("span");
      node.append(child);
      child.dispatchEvent(new Event("animationend", { bubbles: true }));
      flushSync();
      expect(presence.mounted()).toBe(true);
      running = false;
      node.dispatchEvent(new Event("animationend"));
      flushSync();
      expect(presence.mounted()).toBe(false);
    });
  });

  it.each(["animationcancel", "transitionend", "transitioncancel"])(
    "[PRS-06] %s also ends the exit",
    (name) => {
      within(() => {
        let running = true;
        const { node, setPresent, presence } = setup(
          { ...none, transitionProperty: "opacity", transitionDuration: "200ms" },
          () => running,
        );
        flushSync();
        setPresent(false);
        flushSync();
        expect(presence.mounted()).toBe(true);
        running = false;
        node.dispatchEvent(new Event(name));
        flushSync();
        expect(presence.mounted()).toBe(false);
      });
    },
  );

  it("[PRS-07] with several transitioning properties it waits until none is left running", () => {
    within(() => {
      let remaining = 2;
      const { node, setPresent, presence } = setup(
        { ...none, transitionProperty: "opacity, transform", transitionDuration: "200ms, 200ms" },
        () => remaining > 0,
      );
      flushSync();
      setPresent(false);
      flushSync();
      remaining = 1;
      node.dispatchEvent(new Event("transitionend"));
      flushSync();
      expect(presence.mounted()).toBe(true);
      remaining = 0;
      node.dispatchEvent(new Event("transitionend"));
      flushSync();
      expect(presence.mounted()).toBe(false);
    });
  });

  it("[PRS-08] present again during the exit keeps it mounted and ignores the stale end event", () => {
    within(() => {
      const { node, setPresent, presence } = setup({
        ...none,
        animationName: "fade",
        animationDuration: "300ms",
      });
      flushSync();
      setPresent(false);
      flushSync();
      setPresent(true);
      flushSync();
      node.dispatchEvent(new Event("animationend"));
      flushSync();
      expect(presence.mounted()).toBe(true);
    });
  });

  it("[PRS-09] a safety timer unmounts when no end event ever arrives", () => {
    vi.useFakeTimers();
    try {
      within(() => {
        const { setPresent, presence } = setup({
          ...none,
          animationName: "fade",
          animationDuration: "300ms",
        });
        flushSync();
        setPresent(false);
        flushSync();
        expect(presence.mounted()).toBe(true);
        vi.advanceTimersByTime(349);
        flushSync();
        expect(presence.mounted()).toBe(true);
        vi.advanceTimersByTime(2);
        flushSync();
        expect(presence.mounted()).toBe(false);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("[PRS-10] a disconnected element unmounts at once", () => {
    within(() => {
      const { node, setPresent, presence } = setup({
        ...none,
        animationName: "fade",
        animationDuration: "300ms",
      });
      flushSync();
      node.remove();
      setPresent(false);
      flushSync();
      expect(presence.mounted()).toBe(false);
    });
  });

  it("[PRS-11] disposal removes the listeners and the timer", () => {
    vi.useFakeTimers();
    const ledger = trackListeners();
    try {
      const dispose = createRoot((stop) => {
        const { setPresent } = setup({
          ...none,
          animationName: "fade",
          animationDuration: "300ms",
        });
        flushSync();
        const before = ledger.active();
        setPresent(false);
        flushSync();
        expect(ledger.active()).toBeGreaterThan(before);
        return stop;
      });
      expect(vi.getTimerCount()).toBe(1);
      dispose();
      expect(vi.getTimerCount()).toBe(0);
      expect(ledger.describe().filter((entry) => entry.startsWith("animation"))).toEqual([]);
    } finally {
      ledger.restore();
      vi.useRealTimers();
    }
  });
});
