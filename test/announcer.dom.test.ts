import { afterEach, describe, expect, it } from "vitest";
import { announce, clearAnnouncements, disposeAnnouncer } from "../src/utils/announcer";

/** Lets queued microtasks (the announcer's deferred write) run. */
const settle = (): Promise<void> => Promise.resolve();

const polite = (): Element | null => document.querySelector('[role="status"]');
const assertive = (): Element | null => document.querySelector('[role="alert"]');

afterEach(() => {
  disposeAnnouncer();
  document.body.replaceChildren();
});

describe("announcer", () => {
  it("[ANN-01] creates hidden live regions with the right roles and attributes", async () => {
    announce("hello");
    await settle();
    const status = polite();
    const alert = assertive();
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.getAttribute("aria-atomic")).toBe("true");
    expect(status?.hasAttribute("data-primitives-live")).toBe(true);
    expect(alert?.getAttribute("aria-live")).toBe("assertive");
    expect(alert?.getAttribute("aria-atomic")).toBe("true");
    expect(alert?.hasAttribute("data-primitives-live")).toBe(true);
    expect((status as HTMLElement).style.position).toBe("absolute");
    expect((status as HTMLElement).style.width).toBe("1px");
  });

  it("[ANN-02] the text appears in the region after a microtask", async () => {
    announce("3 results");
    expect(polite()?.textContent).toBe("");
    await settle();
    expect(polite()?.textContent).toBe("3 results");
  });

  it("[ANN-03] routes by politeness", async () => {
    announce("calm");
    announce("urgent", { politeness: "assertive" });
    await settle();
    expect(polite()?.textContent).toBe("calm");
    expect(assertive()?.textContent).toBe("urgent");
  });

  it("[ANN-04] the same message twice empties the region before rewriting it", async () => {
    announce("saved");
    await settle();
    announce("saved");
    expect(polite()?.textContent).toBe("");
    await settle();
    expect(polite()?.textContent).toBe("saved");
  });

  it("[ANN-05] rapid announcements keep only the last", async () => {
    announce("one");
    announce("two");
    announce("three");
    await settle();
    expect(polite()?.textContent).toBe("three");
  });

  it("[ANN-06] regions are created once", async () => {
    announce("a");
    announce("b", { politeness: "assertive" });
    announce("c");
    await settle();
    expect(document.querySelectorAll("[data-primitives-live]").length).toBe(2);
    expect(document.querySelectorAll('[role="status"]').length).toBe(1);
  });

  it("[ANN-07] clearAnnouncements empties the regions and cancels pending text", async () => {
    announce("kept");
    await settle();
    announce("pending");
    clearAnnouncements();
    await settle();
    expect(polite()?.textContent).toBe("");
    expect(assertive()?.textContent).toBe("");
  });

  it("[ANN-08] dispose removes the nodes and cancels pending text; announce recreates them", async () => {
    announce("x");
    disposeAnnouncer();
    expect(document.querySelectorAll("[data-primitives-live]").length).toBe(0);
    await settle();
    expect(document.querySelectorAll("[data-primitives-live]").length).toBe(0);
    announce("y");
    await settle();
    expect(polite()?.textContent).toBe("y");
    expect(document.querySelectorAll("[data-primitives-live]").length).toBe(2);
  });

  it("[ANN-09] recreates the regions when the body was cleared", async () => {
    announce("first");
    await settle();
    document.body.replaceChildren();
    announce("second");
    await settle();
    expect(polite()?.textContent).toBe("second");
  });

  it("[ANN-10] announcers are per document", async () => {
    const other = document.implementation.createHTMLDocument("o");
    announce("main");
    announce("other", { document: other });
    await settle();
    expect(polite()?.textContent).toBe("main");
    expect(other.querySelector('[role="status"]')?.textContent).toBe("other");
    disposeAnnouncer(other);
    expect(other.querySelectorAll("[data-primitives-live]").length).toBe(0);
    expect(polite()?.textContent).toBe("main");
  });
});
