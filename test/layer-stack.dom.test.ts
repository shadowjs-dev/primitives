import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLayerCount,
  LAYER_BRANCH_ATTRIBUTE,
  type LayerHandle,
  type LayerHandlers,
  registerLayer,
} from "../src/utils/layer-stack";
import { key, pointer, trackListeners } from "./support/dom";

const handles: LayerHandle[] = [];
afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove();
  document.body.replaceChildren();
  document.body.removeAttribute("style");
});

function element(id: string, parent: HTMLElement = document.body): HTMLElement {
  const node = document.createElement("div");
  node.id = id;
  const child = document.createElement("button");
  child.id = `${id}-child`;
  node.append(child);
  parent.append(node);
  return node;
}

function layer(
  node: HTMLElement,
  handlers: LayerHandlers,
  extra: Partial<Parameters<typeof registerLayer>[0]> = {},
): LayerHandle {
  const handle = registerLayer({ element: node, handlers: () => handlers, ...extra });
  handles.push(handle);
  return handle;
}

describe("layer stack", () => {
  it("[LYR-01] Escape reaches only the topmost layer", () => {
    const lower = vi.fn();
    const upper = vi.fn();
    layer(element("lower"), { onDismiss: lower });
    layer(element("upper"), { onDismiss: upper });
    key(document.body, "Escape");
    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).not.toHaveBeenCalled();
  });

  it("[LYR-02] onEscapeKeyDown can keep the layer open; otherwise Escape is consumed", () => {
    const onDismiss = vi.fn();
    const keep = layer(element("a"), { onEscapeKeyDown: (e) => e.preventDefault(), onDismiss });
    expect(key(document.body, "Escape")).toBe(false);
    expect(onDismiss).not.toHaveBeenCalled();
    keep.remove();
    const consumed = vi.fn();
    layer(element("b"), { onDismiss: consumed });
    expect(key(document.body, "Escape")).toBe(false);
    expect(consumed).toHaveBeenCalledTimes(1);
  });

  it("[LYR-03] Escape during IME composition is ignored; other keys are ignored", () => {
    const onDismiss = vi.fn();
    layer(element("a"), { onDismiss });
    key(document.body, "Escape", { isComposing: true });
    key(document.body, "Enter");
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("[LYR-04] a pointer press outside dismisses; inside does not", () => {
    const onDismiss = vi.fn();
    const node = element("a");
    layer(node, { onDismiss });
    pointer(node.querySelector("button") as Element, "pointerdown");
    pointer(node, "pointerdown");
    expect(onDismiss).not.toHaveBeenCalled();
    pointer(document.body, "pointerdown");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("[LYR-05] the outside handlers run in order and any of them can prevent the dismissal", () => {
    const order: string[] = [];
    const onDismiss = vi.fn();
    layer(element("a"), {
      onPointerDownOutside: () => order.push("pointer"),
      onInteractOutside: (event) => {
        order.push("interact");
        event.preventDefault();
      },
      onDismiss,
    });
    pointer(document.body, "pointerdown");
    expect(order).toEqual(["pointer", "interact"]);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("[LYR-06] a layer opened from inside another one counts as inside its parent", () => {
    const parentDismiss = vi.fn();
    const childDismiss = vi.fn();
    const parentNode = element("parent");
    const childNode = element("child");
    const parent = layer(parentNode, { onDismiss: parentDismiss });
    layer(childNode, { onDismiss: childDismiss }, { parent });
    pointer(childNode.querySelector("button") as Element, "pointerdown");
    expect(parentDismiss).not.toHaveBeenCalled();
    expect(childDismiss).not.toHaveBeenCalled();
    pointer(parentNode.querySelector("button") as Element, "pointerdown");
    expect(parentDismiss).not.toHaveBeenCalled();
    expect(childDismiss).toHaveBeenCalledTimes(1);
    pointer(document.body, "pointerdown");
    expect(parentDismiss).toHaveBeenCalledTimes(1);
    expect(childDismiss).toHaveBeenCalledTimes(2);
  });

  it("[LYR-07] unrelated layers are outside each other", () => {
    const a = vi.fn();
    const b = vi.fn();
    layer(element("a"), { onDismiss: a });
    const second = element("b");
    layer(second, { onDismiss: b });
    pointer(second.querySelector("button") as Element, "pointerdown");
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });

  it("[LYR-08] branches count as inside", () => {
    const onDismiss = vi.fn();
    const trigger = document.createElement("button");
    document.body.append(trigger);
    layer(element("a"), { onDismiss }, { branches: () => [trigger, null, undefined] });
    pointer(trigger, "pointerdown");
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("[LYR-08b] an element marked as a layer branch is inside every layer, for presses and for focus", () => {
    const onDismiss = vi.fn();
    const surface = document.createElement("div");
    surface.setAttribute(LAYER_BRANCH_ATTRIBUTE, "");
    const control = document.createElement("button");
    surface.append(control);
    document.body.append(surface);
    layer(element("a"), { onDismiss });
    pointer(control, "pointerdown");
    control.focus();
    expect(onDismiss).not.toHaveBeenCalled();
    const other = document.createElement("button");
    document.body.append(other);
    pointer(other, "pointerdown");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("[LYR-09] a touch press waits for the click, and pointercancel (a scroll) cancels it", () => {
    const onDismiss = vi.fn();
    layer(element("a"), { onDismiss });
    pointer(document.body, "pointerdown", { pointerType: "touch" });
    expect(onDismiss).not.toHaveBeenCalled();
    pointer(document.body, "pointercancel", { pointerType: "touch" });
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();
    pointer(document.body, "pointerdown", { pointerType: "touch" });
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("[LYR-10] focus moving outside dismisses; focus inside does not", () => {
    const onDismiss = vi.fn();
    const onFocusOutside = vi.fn();
    const node = element("a");
    const outside = document.createElement("button");
    document.body.append(outside);
    layer(node, { onDismiss, onFocusOutside });
    (node.querySelector("button") as HTMLElement).focus();
    expect(onFocusOutside).not.toHaveBeenCalled();
    outside.focus();
    expect(onFocusOutside).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("[LYR-11] disableOutsidePointerEvents blocks the body, keeps layers above enabled and restores everything", () => {
    document.body.style.pointerEvents = "auto";
    const modal = element("modal");
    const above = element("above");
    const first = layer(modal, {}, { disableOutsidePointerEvents: true });
    expect(document.body.style.pointerEvents).toBe("none");
    expect(modal.style.pointerEvents).toBe("auto");
    const second = layer(above, {});
    expect(above.style.pointerEvents).toBe("auto");
    second.remove();
    expect(above.style.pointerEvents).toBe("");
    first.remove();
    expect(document.body.style.pointerEvents).toBe("auto");
    expect(modal.style.pointerEvents).toBe("");
  });

  it("[LYR-12] layers below a blocking layer ignore outside presses", () => {
    const lower = vi.fn();
    layer(element("lower"), { onDismiss: lower });
    layer(element("modal"), {}, { disableOutsidePointerEvents: true });
    pointer(document.body, "pointerdown");
    expect(lower).not.toHaveBeenCalled();
  });

  it("[LYR-13] with several blockers the body is restored only after the last one goes, in any order", () => {
    document.body.style.pointerEvents = "";
    const a = layer(element("a"), {}, { disableOutsidePointerEvents: true });
    const b = layer(element("b"), {}, { disableOutsidePointerEvents: true });
    a.remove();
    expect(document.body.style.pointerEvents).toBe("none");
    b.remove();
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("[LYR-14] document listeners exist only while a layer is registered", () => {
    const ledger = trackListeners();
    const handle = layer(element("a"), {});
    expect(ledger.describe()).toEqual([
      "click@document",
      "focusin@document",
      "keydown@document",
      "pointercancel@document",
      "pointerdown@document",
    ]);
    handle.remove();
    expect(ledger.active()).toBe(0);
    ledger.restore();
  });

  it("[LYR-15] remove is idempotent and isTopmost follows the stack", () => {
    const lower = layer(element("lower"), {});
    const upper = layer(element("upper"), {});
    expect(upper.isTopmost()).toBe(true);
    expect(lower.isTopmost()).toBe(false);
    upper.remove();
    upper.remove();
    expect(lower.isTopmost()).toBe(true);
    expect(getLayerCount()).toBe(1);
  });

  it("[LYR-16] a handler that throws does not stop the other layers", () => {
    const lower = vi.fn();
    layer(element("lower"), { onDismiss: lower });
    layer(element("upper"), {
      onDismiss: () => {
        throw new Error("boom");
      },
    });
    expect(() => pointer(document.body, "pointerdown")).toThrow("boom");
    expect(lower).toHaveBeenCalledTimes(1);
  });

  it("[LYR-17] a layer removed by an earlier handler in the same event is not dismissed", () => {
    const lowerDismiss = vi.fn();
    const lowerNode = element("lower");
    const lower = layer(lowerNode, { onDismiss: lowerDismiss });
    layer(element("upper"), { onDismiss: () => lower.remove() });
    pointer(document.body, "pointerdown");
    expect(lowerDismiss).not.toHaveBeenCalled();
  });

  it("[LYR-18] layers on different documents are independent", () => {
    const other = document.implementation.createHTMLDocument("other");
    const node = other.createElement("div");
    other.body.append(node);
    const handle = registerLayer({ element: node, handlers: () => ({}) });
    expect(getLayerCount(other)).toBe(1);
    expect(getLayerCount(document)).toBe(0);
    handle.remove();
    expect(getLayerCount(other)).toBe(0);
  });
});
