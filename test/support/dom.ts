/**
 * Test helpers shared by the primitive suites: keyboard and pointer input, listener-leak tracking
 * and the SSR -> hydrate round trip. Everything is synchronous (`flushSync`), nothing sleeps.
 */

import { flushSync } from "@shadow-js/core";
import { createComponent, hydrate } from "@shadow-js/web";
import { createComponent as createServerComponent, renderToString } from "@shadow-js/web/server";
import { vi } from "vitest";

/** Init for a synthetic keyboard event. */
export interface KeyInit {
  readonly shiftKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly altKey?: boolean;
  readonly metaKey?: boolean;
  readonly repeat?: boolean;
  readonly isComposing?: boolean;
}

/**
 * Presses a key on `target`: keydown (cancelable, bubbling, composed), then keyup unless the
 * keydown was prevented... keyup is always sent, as browsers do. Returns false when keydown was
 * canceled. Effects are flushed before returning.
 */
export function key(target: EventTarget, name: string, init: KeyInit = {}): boolean {
  const down = new KeyboardEvent("keydown", {
    key: name,
    bubbles: true,
    cancelable: true,
    composed: true,
    ...init,
  });
  const allowed = target.dispatchEvent(down);
  flushSync();
  target.dispatchEvent(
    new KeyboardEvent("keyup", {
      key: name,
      bubbles: true,
      cancelable: true,
      composed: true,
      ...init,
    }),
  );
  flushSync();
  return allowed;
}

/** Init for a synthetic pointer event. */
export interface PointerInit {
  readonly pointerType?: "mouse" | "touch" | "pen";
  readonly button?: number;
  readonly clientX?: number;
  readonly clientY?: number;
  readonly ctrlKey?: boolean;
  readonly pointerId?: number;
}

/** Dispatches one pointer event (`pointerdown`, `pointermove`, ...) and flushes effects. */
export function pointer(target: EventTarget, type: string, init: PointerInit = {}): boolean {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerType: "mouse",
    pointerId: 1,
    isPrimary: true,
    button: 0,
    ...init,
  });
  const allowed = target.dispatchEvent(event);
  flushSync();
  return allowed;
}

/**
 * A full left-button press the way a mouse produces it: pointerdown, mousedown, focus of the
 * nearest focusable ancestor (unless mousedown was prevented), pointerup, mouseup, click.
 */
export function press(target: Element, init: PointerInit = {}): void {
  pointer(target, "pointerdown", init);
  const down = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    composed: true,
    button: 0,
  });
  const proceed = target.dispatchEvent(down);
  if (proceed) {
    const focusable = target.closest<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus();
  }
  pointer(target, "pointerup", init);
  target.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true, composed: true, button: 0 }),
  );
  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, composed: true, button: 0 }),
  );
  flushSync();
}

/** Moves focus and flushes effects. */
export function focus(target: HTMLElement): void {
  target.focus();
  flushSync();
}

/** What is currently focused, as a short selector-like string for failure messages. */
export function activeDescription(): string {
  const active = document.activeElement;
  if (active === null || active === document.body) return "body";
  const id = active.id === "" ? "" : `#${active.id}`;
  return `${active.tagName.toLowerCase()}${id}`;
}

/** Reads the `data-state` attribute of an element, or `null` when it is missing. */
export function state(element: Element | null): string | null {
  return element?.getAttribute("data-state") ?? null;
}

/** Tracks event-listener registrations so a test can prove unmounting leaves nothing behind. */
export interface ListenerLedger {
  /** How many registrations are currently active (added and not removed). */
  active(): number;
  /** Active registrations as `type@target` strings, sorted. */
  describe(): string[];
  restore(): void;
}

interface Registration {
  readonly target: unknown;
  readonly type: string;
  readonly capture: boolean;
  readonly listener: unknown;
}

function captureOf(options: unknown): boolean {
  return typeof options === "boolean"
    ? options
    : (options as { capture?: boolean } | undefined)?.capture === true;
}

function targetName(target: unknown): string {
  if (target === document) return "document";
  if (target === window) return "window";
  if (target instanceof Element) return target.tagName.toLowerCase();
  return Object.prototype.toString.call(target);
}

/**
 * Spies on `EventTarget.prototype.addEventListener` / `removeEventListener` and keeps a ledger of
 * the registrations that are still active (same target, type, listener and capture flag). A
 * `once` listener leaves the ledger when it is removed explicitly; call this before mounting.
 */
export function trackListeners(): ListenerLedger {
  const active: Registration[] = [];
  const find = (target: unknown, type: string, capture: boolean, listener: unknown): number =>
    active.findIndex(
      (entry) =>
        entry.target === target &&
        entry.type === type &&
        entry.capture === capture &&
        entry.listener === listener,
    );
  const restores: Array<() => void> = [];
  /** Patches the object that owns `addEventListener` for `sample` (the prototype, or the window itself). */
  const patch = (sample: object): void => {
    let owner: object | null = sample;
    while (owner !== null && !Object.hasOwn(owner, "addEventListener")) {
      owner = Object.getPrototypeOf(owner);
    }
    if (owner === null) throw new Error("trackListeners: no addEventListener found");
    const originalAdd = Reflect.get(owner, "addEventListener") as EventTarget["addEventListener"];
    const originalRemove = Reflect.get(
      owner,
      "removeEventListener",
    ) as EventTarget["removeEventListener"];
    const add = vi.spyOn(owner as EventTarget, "addEventListener").mockImplementation(function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      const capture = captureOf(options);
      if (listener !== null && find(this, type, capture, listener) === -1) {
        active.push({ target: this, type, capture, listener });
      }
      return originalAdd.call(this, type, listener, options);
    });
    const remove = vi
      .spyOn(owner as EventTarget, "removeEventListener")
      .mockImplementation(function (
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
      ) {
        const index = find(this, type, captureOf(options), listener);
        if (index !== -1) active.splice(index, 1);
        return originalRemove.call(this, type, listener, options);
      });
    restores.push(() => {
      add.mockRestore();
      remove.mockRestore();
    });
  };
  patch(document.createElement("div"));
  patch(window);
  return {
    active: () => active.length,
    describe: () => active.map((entry) => `${entry.type}@${targetName(entry.target)}`).sort(),
    restore() {
      for (const undo of restores) undo();
    },
  };
}

/** The result of rendering a fixture on the server and hydrating it on the client. */
export interface HydrationResult {
  /** The markup the server produced. */
  readonly html: string;
  /** The container holding the hydrated DOM. */
  readonly host: HTMLElement;
  /** Every element the server markup contained, in document order, before hydration. */
  readonly serverElements: readonly Element[];
  /** Removes the container. */
  dispose(): void;
}

type Component = (props: Record<string, unknown>) => unknown;

/**
 * Renders `ssr` on the server, puts the markup in a container, hydrates it with `dom`, and
 * returns the pieces so a test can assert that the very same elements were kept.
 */
export function ssrAndHydrate(
  ssr: Component,
  dom: Component,
  props: Record<string, unknown> = {},
): HydrationResult {
  const html = renderToString(() => createServerComponent(ssr, props));
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  const serverElements = [...host.querySelectorAll("*")];
  const stop = hydrate(() => createComponent(dom, props), host);
  return {
    html,
    host,
    serverElements,
    dispose() {
      if (typeof stop === "function") stop();
      host.remove();
    },
  };
}
