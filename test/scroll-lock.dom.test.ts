import { afterEach, describe, expect, it } from "vitest";
import { lockScroll } from "../src/utils/scroll-lock";

/** Stubs a layout where the page has a vertical scrollbar of `bar` pixels. */
function stubScrollbar(bar: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: 1024 - bar,
  });
}

afterEach(() => {
  document.body.removeAttribute("style");
  Reflect.deleteProperty(document.documentElement, "clientWidth");
});

describe("scroll-lock", () => {
  it("[SCL-01] locks overflow and restores the empty inline values", () => {
    stubScrollbar(0);
    const unlock = lockScroll();
    expect(document.body.style.overflow).toBe("hidden");
    unlock();
    expect(document.body.style.overflow).toBe("");
    expect(document.body.getAttribute("style") ?? "").toBe("");
  });

  it("[SCL-02] nested locks release only on the last unlock, in any order", () => {
    stubScrollbar(0);
    const first = lockScroll();
    const second = lockScroll();
    first();
    expect(document.body.style.overflow).toBe("hidden");
    second();
    expect(document.body.style.overflow).toBe("");

    const a = lockScroll();
    const b = lockScroll();
    b();
    expect(document.body.style.overflow).toBe("hidden");
    a();
    expect(document.body.style.overflow).toBe("");
  });

  it("[SCL-03] compensates the scrollbar width on top of the existing padding", () => {
    stubScrollbar(15);
    document.body.style.paddingRight = "10px";
    const unlock = lockScroll();
    expect(document.body.style.paddingRight).toBe("25px");
    expect(document.body.style.getPropertyValue("--primitives-scrollbar-size")).toBe("15px");
    unlock();
    expect(document.body.style.paddingRight).toBe("10px");
    expect(document.body.style.getPropertyValue("--primitives-scrollbar-size")).toBe("");
  });

  it("[SCL-04] adds no padding when there is no scrollbar", () => {
    stubScrollbar(0);
    const unlock = lockScroll();
    expect(document.body.style.paddingRight).toBe("");
    expect(document.body.style.getPropertyValue("--primitives-scrollbar-size")).toBe("0px");
    unlock();
  });

  it("[SCL-05] restores the exact previous inline values", () => {
    stubScrollbar(12);
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "3px";
    document.body.style.setProperty("--primitives-scrollbar-size", "7px");
    const unlock = lockScroll();
    expect(document.body.style.overflow).toBe("hidden");
    unlock();
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.paddingRight).toBe("3px");
    expect(document.body.style.getPropertyValue("--primitives-scrollbar-size")).toBe("7px");
  });

  it("[SCL-06] unlock is idempotent and does not release other locks", () => {
    stubScrollbar(0);
    const first = lockScroll();
    const second = lockScroll();
    first();
    first();
    first();
    expect(document.body.style.overflow).toBe("hidden");
    second();
    expect(document.body.style.overflow).toBe("");
  });

  it("[SCL-07] never moves the scroll position or uses position fixed", () => {
    stubScrollbar(15);
    const scrolls: number[] = [];
    const original = window.scrollTo;
    window.scrollTo = (): void => {
      scrolls.push(1);
    };
    try {
      const unlock = lockScroll();
      expect(document.body.style.position).toBe("");
      unlock();
    } finally {
      window.scrollTo = original;
    }
    expect(scrolls).toEqual([]);
  });

  it("[SCL-08] locks are independent per document", () => {
    stubScrollbar(0);
    const other = document.implementation.createHTMLDocument("other");
    const unlockMain = lockScroll();
    const unlockOther = lockScroll({ document: other });
    expect(other.body.style.overflow).toBe("hidden");
    unlockMain();
    expect(document.body.style.overflow).toBe("");
    expect(other.body.style.overflow).toBe("hidden");
    unlockOther();
    expect(other.body.style.overflow).toBe("");
  });

  it("[SCL-09] can lock again after a full release", () => {
    stubScrollbar(0);
    lockScroll()();
    const again = lockScroll();
    expect(document.body.style.overflow).toBe("hidden");
    again();
    expect(document.body.style.overflow).toBe("");
  });
});
