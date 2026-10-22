import { describe, expect, it } from "vitest";
import { trackListeners } from "./support/dom";

describe("test support", () => {
  it("[SUP-01] the listener ledger sees document, window and element registrations", () => {
    const ledger = trackListeners();
    const button = document.createElement("button");
    const handler = (): void => undefined;
    document.addEventListener("pointerdown", handler, true);
    window.addEventListener("resize", handler);
    button.addEventListener("click", handler);
    expect(ledger.describe()).toEqual(["click@button", "pointerdown@document", "resize@window"]);
    document.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("resize", handler);
    button.removeEventListener("click", handler);
    expect(ledger.active()).toBe(0);
    ledger.restore();
  });
  it("[SUP-02] happy-dom provides the events and APIs the primitives rely on", () => {
    expect(typeof PointerEvent).toBe("function");
    expect(typeof ResizeObserver).toBe("function");
    expect(typeof MutationObserver).toBe("function");
    expect(typeof IntersectionObserver).toBe("function");
    expect(typeof requestAnimationFrame).toBe("function");
    const el = document.createElement("div");
    el.innerHTML = "<button>a</button>";
    document.body.append(el);
    const path = (el.firstElementChild as HTMLElement).dispatchEvent(new Event("x"));
    expect(path).toBe(true);
    expect(typeof el.getBoundingClientRect().width).toBe("number");
    expect(typeof el.checkVisibility).toBe("function");
    el.remove();
  });
});
