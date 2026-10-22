import { afterEach, describe, expect, it } from "vitest";
import { hideOthers } from "../src/utils/hide-others";

function html(markup: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.append(host);
  return host;
}

afterEach(() => {
  document.body.replaceChildren();
});

const hidden = (element: Element | null): string | null =>
  element?.getAttribute("aria-hidden") ?? null;

describe("hide-others", () => {
  it("[HID-01] marks siblings off the path only, never targets, ancestors or descendants", () => {
    html(
      `<main id="app"><p id="p1">a</p><section id="wrap"><div id="dialog"><button id="inner">x</button></div><p id="p2">b</p></section></main><aside id="side"></aside>`,
    );
    const dialog = document.getElementById("dialog") as HTMLElement;
    const show = hideOthers(dialog);
    const ids = ["p1", "p2", "side"].map((id) => hidden(document.getElementById(id)));
    expect(ids).toEqual(["true", "true", "true"]);
    for (const id of ["app", "wrap", "dialog", "inner"]) {
      expect(document.getElementById(id)?.hasAttribute("aria-hidden")).toBe(false);
    }
    show();
    expect(document.querySelectorAll("[aria-hidden]").length).toBe(0);
  });

  it("[HID-02] accepts several targets", () => {
    html(`<div id="a"></div><div id="b"></div><div id="c"></div>`);
    const show = hideOthers([
      document.getElementById("a") as Element,
      document.getElementById("b") as Element,
    ]);
    expect(hidden(document.getElementById("c"))).toBe("true");
    expect(document.getElementById("a")?.hasAttribute("aria-hidden")).toBe(false);
    expect(document.getElementById("b")?.hasAttribute("aria-hidden")).toBe(false);
    show();
    expect(document.querySelectorAll("[aria-hidden]").length).toBe(0);
  });

  it("[HID-03] nested layers restore correctly closing inner first", () => {
    html(`<div id="page"></div><div id="dialog"></div><div id="menu"></div>`);
    const dialog = document.getElementById("dialog") as Element;
    const menu = document.getElementById("menu") as Element;
    const page = document.getElementById("page");
    const showDialog = hideOthers(dialog);
    const showMenu = hideOthers(menu);
    expect(hidden(dialog)).toBe("true");
    expect(hidden(page)).toBe("true");
    showMenu();
    expect(dialog.hasAttribute("aria-hidden")).toBe(false);
    expect(hidden(page)).toBe("true");
    showDialog();
    expect(document.querySelectorAll("[aria-hidden]").length).toBe(0);
  });

  it("[HID-04] nested layers restore correctly closing outer first", () => {
    html(`<div id="page"></div><div id="dialog"></div><div id="menu"></div>`);
    const dialog = document.getElementById("dialog") as Element;
    const menu = document.getElementById("menu") as Element;
    const page = document.getElementById("page");
    const showDialog = hideOthers(dialog);
    const showMenu = hideOthers(menu);
    showDialog();
    expect(hidden(page)).toBe("true");
    expect(hidden(dialog)).toBe("true");
    expect(menu.hasAttribute("aria-hidden")).toBe(false);
    showMenu();
    expect(document.querySelectorAll("[aria-hidden]").length).toBe(0);
  });

  it("[HID-05] preserves and restores a pre-existing aria-hidden value", () => {
    html(
      `<div id="keep" aria-hidden="false"></div><div id="was" aria-hidden="true"></div><div id="t"></div>`,
    );
    const show = hideOthers(document.getElementById("t") as Element);
    expect(hidden(document.getElementById("keep"))).toBe("true");
    show();
    expect(hidden(document.getElementById("keep"))).toBe("false");
    expect(hidden(document.getElementById("was"))).toBe("true");
  });

  it("[HID-06] skips script, style, template and live regions", () => {
    html(
      `<script id="s"></script><style id="st"></style><template id="tp"></template><div id="live" aria-live="polite"></div><div id="ann" data-primitives-live></div><div id="other"></div><div id="t"></div>`,
    );
    const show = hideOthers(document.getElementById("t") as Element);
    for (const id of ["s", "st", "tp", "live", "ann"]) {
      expect(document.getElementById(id)?.hasAttribute("aria-hidden")).toBe(false);
    }
    expect(hidden(document.getElementById("other"))).toBe("true");
    show();
  });

  it("[HID-07] an ancestor of a live region is kept visible, not hidden", () => {
    html(
      `<div id="box"><div id="live" aria-live="assertive"></div><p id="p"></p></div><div id="t"></div>`,
    );
    const show = hideOthers(document.getElementById("t") as Element);
    expect(document.getElementById("box")?.hasAttribute("aria-hidden")).toBe(false);
    expect(hidden(document.getElementById("p"))).toBe("true");
    show();
  });

  it("[HID-08] inert mode sets inert only and restores it", () => {
    html(`<div id="a"></div><div id="b" inert></div><div id="t"></div>`);
    const show = hideOthers(document.getElementById("t") as Element, { mode: "inert" });
    expect(document.getElementById("a")?.hasAttribute("inert")).toBe(true);
    expect(document.getElementById("a")?.hasAttribute("aria-hidden")).toBe(false);
    show();
    expect(document.getElementById("a")?.hasAttribute("inert")).toBe(false);
    expect(document.getElementById("b")?.hasAttribute("inert")).toBe(true);
  });

  it("[HID-09] both mode sets and restores both attributes", () => {
    html(`<div id="a"></div><div id="t"></div>`);
    const show = hideOthers(document.getElementById("t") as Element, { mode: "both" });
    const a = document.getElementById("a");
    expect(a?.getAttribute("aria-hidden")).toBe("true");
    expect(a?.hasAttribute("inert")).toBe(true);
    show();
    expect(a?.hasAttribute("aria-hidden")).toBe(false);
    expect(a?.hasAttribute("inert")).toBe(false);
  });

  it("[HID-10] the release function is idempotent", () => {
    html(`<div id="a"></div><div id="t"></div>`);
    const t = document.getElementById("t") as Element;
    const one = hideOthers(t);
    const two = hideOthers(t);
    one();
    one();
    expect(hidden(document.getElementById("a"))).toBe("true");
    two();
    expect(document.getElementById("a")?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("[HID-11] a target outside the body hides nothing", () => {
    html(`<div id="a"></div>`);
    const detached = document.createElement("div");
    const show = hideOthers(detached);
    expect(document.querySelectorAll("[aria-hidden]").length).toBe(0);
    show();
  });

  it("[HID-12] works in another document", () => {
    const other = document.implementation.createHTMLDocument("o");
    other.body.innerHTML = `<div id="a"></div><div id="t"></div>`;
    const show = hideOthers(other.getElementById("t") as Element, { document: other });
    expect(other.getElementById("a")?.getAttribute("aria-hidden")).toBe("true");
    show();
    expect(other.getElementById("a")?.hasAttribute("aria-hidden")).toBe(false);
  });
});
