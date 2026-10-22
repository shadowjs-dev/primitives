/**
 * The imperative toast queue: ordering, a limit on how many toasts are visible at once, unique
 * ids, de-duplication by key, dismissal that keeps a toast in the list until its exit animation
 * has finished, and promise toasts. It renders nothing: the application maps `toasts()` to
 * `<Toast>` elements, which keeps the markup and styling in the application's hands.
 * @packageDocumentation
 */
import { type Accessor, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";

/**
 * How a toast is announced: `"foreground"` interrupts the screen reader (assertive), `"background"` waits for a pause (polite).
 * @since 1.0.0
 * @see {@link ToastOptions}
 */
export type ToastType = "foreground" | "background";

/**
 * What the application passes to {@link Toaster.add}. The options set no ARIA or data attributes themselves: `type` picks the live region the text is announced through (`role="alert"` for `"foreground"`, `role="status"` for `"background"`), and the rendered {@link Toast} sets its own attributes.
 * @typeParam D The type of the application's own `data` payload.
 * @since 1.0.0
 * @see {@link Toaster}
 */
export interface ToastOptions<D = unknown> {
  /**
   * The id to use. Adding a toast whose id is open updates that toast instead of creating a second one. A dismissed toast that still has that id is removed at once, and the new toast takes its place.
   * @default none (generated: "toast-1", "toast-2", ...)
   */
  readonly id?: string | undefined;
  /**
   * De-duplication key. While a toast with the same key is open or waiting, adding another one updates it in place and returns its id, so a repeated "Saved" does not stack.
   * @default none
   */
  readonly key?: string | undefined;
  /**
   * The headline. The application renders it, usually inside `Toast.Title`.
   * @default none
   */
  readonly title?: JsxChild | undefined;
  /**
   * The details. The application renders it, usually inside `Toast.Description`.
   * @default none
   */
  readonly description?: JsxChild | undefined;
  /**
   * Announcement urgency: `"foreground"` is announced assertively through `role="alert"`, `"background"` politely through `role="status"`.
   * @default "foreground"
   */
  readonly type?: ToastType | undefined;
  /**
   * Time in ms before the toast closes itself. `Infinity` keeps it until dismissed.
   * @default none (the toaster's duration, then the provider's)
   */
  readonly duration?: number | undefined;
  /**
   * Anything the application wants to carry along, such as an action, a variant or an icon name. The queue stores it and does not read it.
   * @default none
   */
  readonly data?: D | undefined;
}

/**
 * The fields {@link Toaster.update} can change. A key that is present replaces the field, so `{ duration: undefined }` hands the duration back to the provider. The exception is `type`: an `undefined` type keeps the current one.
 * @typeParam D The type of the application's own `data` payload.
 * @since 1.0.0
 * @see {@link Toaster}
 */
export interface ToastPatch<D = unknown> {
  /** The new title. An absent key keeps the current one. */
  readonly title?: JsxChild | undefined;
  /** The new description. An absent key keeps the current one. */
  readonly description?: JsxChild | undefined;
  /** The new announcement type. An absent key keeps the current one. */
  readonly type?: ToastType | undefined;
  /** The new duration in milliseconds, or `undefined` to use the provider's duration. */
  readonly duration?: number | undefined;
  /** The new application data. */
  readonly data?: D | undefined;
}

/**
 * A toast as the queue holds it: an immutable snapshot, replaced on every change, so a keyed `For` updates the row instead of re-creating it. Pass `open` to `<Toast open>`.
 * @typeParam D The type of the application's own `data` payload.
 * @since 1.0.0
 * @see {@link Toaster}
 */
export interface ToastItem<D = unknown> {
  /** The id of the toast, as returned when it was added. */
  readonly id: string;
  /** The de-duplication key the toast was added with, or `undefined`. */
  readonly key: string | undefined;
  /** The title content of the toast. */
  readonly title: JsxChild | undefined;
  /** The description content of the toast. */
  readonly description: JsxChild | undefined;
  /** The announcement type of the toast. */
  readonly type: ToastType;
  /** `undefined` means "use the provider's duration". */
  readonly duration: number | undefined;
  /** The application data the toast was added with, or `undefined`. */
  readonly data: D | undefined;
  /**
   * `false` once the toast was dismissed. It stays in the list until {@link Toaster.remove} so
   * its exit animation can play: pass it to `<Toast open>`.
   */
  readonly open: boolean;
}

/**
 * The content of one state of a promise toast. A string becomes the title; a {@link ToastPatch} sets the fields.
 * @typeParam D The type of the application's own `data` payload.
 * @since 1.0.0
 * @see {@link ToastPromiseMessages}
 */
export type ToastContent<D = unknown> = string | ToastPatch<D>;

/**
 * The content of each state of {@link Toaster.promise}: `loading` while the promise is pending, then `success` or `error` once it settles.
 * @typeParam T What the promise resolves to.
 * @typeParam D The type of the application's own `data` payload.
 * @since 1.0.0
 * @see {@link Toaster.promise}
 */
export interface ToastPromiseMessages<T, D = unknown> {
  /** Shown while the promise is pending. The toast stays until the promise settles. */
  readonly loading: ToastContent<D>;
  /** Shown when the promise resolves; may be computed from the value. */
  readonly success: ToastContent<D> | ((value: T) => ToastContent<D>);
  /** Shown when the promise rejects; may be computed from the reason. */
  readonly error: ToastContent<D> | ((reason: unknown) => ToastContent<D>);
}

/**
 * What {@link Toaster.promise} returns: the id of the toast that follows the promise, and the promise itself so the caller can await it. A rejection still reaches the caller through `result`.
 * @typeParam T What the promise resolves to.
 * @since 1.0.0
 * @see {@link Toaster.promise}
 */
export interface ToastPromiseHandle<T> {
  /** The id of the toast that follows the promise. */
  readonly id: string;
  /** The promise that was passed in, for the caller to await. A rejection still reaches the caller. */
  readonly result: Promise<T>;
}

/**
 * Options of {@link createToaster}. The queue sets no ARIA or data attributes; the toasts it renders get those of {@link Toast}, and `type` on each toast chooses its announcement politeness.
 * @typeParam D The type of the application's own `data` payload.
 * @since 1.0.0
 * @see {@link createToaster}
 */
export interface ToasterOptions<D = unknown> {
  /**
   * How many toasts may be open at once. The rest wait and take a free slot, oldest first, as soon as an open one is dismissed or removed. `NaN` or an omitted value means no limit, and a value below one counts as one.
   * @default none (no limit)
   */
  readonly limit?: number | undefined;
  /**
   * The default `duration` of toasts that do not set one.
   * @default none (the provider's duration)
   */
  readonly duration?: number | undefined;
  /**
   * The order of `toasts()`: `"oldest-first"` keeps insertion order and `"newest-first"` reverses it. `pending()` is always oldest first.
   * @default "oldest-first"
   */
  readonly order?: "oldest-first" | "newest-first" | undefined;
  /**
   * The prefix of generated ids, which then read `"{prefix}-{n}"`. Use another prefix when several toasters share a page.
   * @default "toast"
   */
  readonly idPrefix?: string | undefined;
  /**
   * Called with a toast when it leaves the list through {@link Toaster.remove}, including a toast that was still open, and when a dismissed toast's id is reused. A waiting toast removed by `dismiss` or `remove` does not trigger it.
   * @default none
   */
  readonly onExitComplete?: ((item: ToastItem<D>) => void) | undefined;
}

/**
 * The queue {@link createToaster} returns: the `toasts` and `pending` lists to render, and the methods that change them. It has no keys or ARIA of its own; render `toasts()` inside {@link ToastViewport}.
 * @typeParam D The type of the application's own `data` payload.
 * @since 1.0.0
 * @see {@link createToaster}
 */
export interface Toaster<D = unknown> {
  /** The toasts to render (open ones and dismissed ones that are still exiting), tracked. */
  readonly toasts: Accessor<readonly ToastItem<D>[]>;
  /** The toasts waiting for a free slot because of `limit`, tracked. */
  readonly pending: Accessor<readonly ToastItem<D>[]>;
  /**
   * Adds a toast.
   * @param options The toast.
   * @returns Its id, or the id of the toast it was merged into (same `id` or `key`).
   */
  add(options: ToastOptions<D>): string;
  /**
   * Changes a toast, open or waiting.
   * @param id The toast.
   * @param patch The fields to replace.
   * @returns `false` when there is no such toast.
   */
  update(id: string, patch: ToastPatch<D>): boolean;
  /**
   * Starts closing a toast, or every toast when `id` is omitted. Waiting toasts that are dismissed
   * never appear. The toast stays in `toasts()` (with `open: false`) until {@link Toaster.remove}.
   */
  dismiss(id?: string): void;
  /** Takes a toast out of the list; call it when its exit animation has finished. */
  remove(id: string): void;
  /**
   * Shows a loading toast and turns it into a success or error toast when `promise` settles.
   * @param promise The promise, or a function starting it.
   * @param messages What to show in each state.
   * @param options Extra options for the toast (`id`, `key`, `type`, `data`, and the `duration`
   *   used once the promise settled).
   * @returns The id and the promise.
   */
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages<T, D>,
    options?: ToastOptions<D>,
  ): ToastPromiseHandle<T>;
}

/** `limit` as a count: at least one, `Infinity` when absent or not a number. */
function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || Number.isNaN(limit)) return Number.POSITIVE_INFINITY;
  return Math.max(1, Math.floor(limit));
}

const PATCH_KEYS = ["title", "description", "type", "duration", "data"] as const;

/** Applies the keys that are present in `patch`, producing a new snapshot. */
function applyPatch<D>(item: ToastItem<D>, patch: ToastPatch<D>): ToastItem<D> {
  const next: {
    -readonly [K in keyof ToastItem<D>]: ToastItem<D>[K];
  } = { ...item };
  for (const name of PATCH_KEYS) {
    if (!Object.hasOwn(patch, name)) continue;
    if (name === "type") {
      next.type = patch.type ?? item.type;
    } else if (name === "title") {
      next.title = patch.title;
    } else if (name === "description") {
      next.description = patch.description;
    } else if (name === "duration") {
      next.duration = patch.duration;
    } else {
      next.data = patch.data;
    }
  }
  return next;
}

function contentToPatch<D>(content: ToastContent<D>): ToastPatch<D> {
  return typeof content === "string" ? { title: content } : content;
}

/**
 * Creates a toast queue. Create one per application, or per request on a server: the queue is plain state, nothing is shared between toasters and nothing runs at import time. The queue has no keys or ARIA of its own; each item of `toasts()` becomes a {@link Toast} with the keyboard and ARIA contract described there.
 *
 * @param options See {@link ToasterOptions}.
 * @returns The queue.
 * @example
 * import { createToaster, type ToastItem, Toast } from "@shadow-js/primitives";
 * import { For } from "@shadow-js/web";
 *
 * const toaster = createToaster({ limit: 3, duration: 4000 });
 *
 * export function save(): void {
 *   toaster.add({ title: "Saved", key: "saved" });
 * }
 *
 * export function Notifications() {
 *   return (
 *     <Toast.Provider>
 *       <Toast.Viewport>
 *         <For each={toaster.toasts()} key={(item: ToastItem) => item.id}>
 *           {(item: () => ToastItem) => (
 *             <Toast
 *               open={item().open}
 *               duration={item().duration}
 *               type={item().type}
 *               onOpenChange={(open: boolean) => {
 *                 if (!open) toaster.dismiss(item().id);
 *               }}
 *               onExitComplete={() => toaster.remove(item().id)}
 *             >
 *               <Toast.Title>{item().title}</Toast.Title>
 *               <Toast.Close aria-label="Dismiss">x</Toast.Close>
 *             </Toast>
 *           )}
 *         </For>
 *       </Toast.Viewport>
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link Toaster}
 * @see {@link ToasterOptions}
 * @see {@link Toast}
 * @since 1.0.0
 */
export function createToaster<D = unknown>(options: ToasterOptions<D> = {}): Toaster<D> {
  const limit = normalizeLimit(options.limit);
  const prefix = options.idPrefix ?? "toast";
  // Plain arrays are the source of truth (mutations may happen inside effects and handlers alike);
  // the signals only publish snapshots.
  let shown: ToastItem<D>[] = [];
  let waiting: ToastItem<D>[] = [];
  let counter = 0;
  const [shownSignal, setShownSignal] = useSignal<readonly ToastItem<D>[]>([]);
  const [waitingSignal, setWaitingSignal] = useSignal<readonly ToastItem<D>[]>([]);

  const publish = (): void => {
    const list = options.order === "newest-first" ? [...shown].reverse() : [...shown];
    setShownSignal(list);
    setWaitingSignal([...waiting]);
  };

  const openCount = (): number => shown.filter((item) => item.open).length;

  /** Moves waiting toasts into free slots, oldest first. */
  const fill = (): void => {
    while (waiting.length > 0 && openCount() < limit) {
      const next = waiting.shift();
      if (next === undefined) break;
      shown.push(next);
    }
  };

  const inUse = (id: string): boolean =>
    shown.some((item) => item.id === id) || waiting.some((item) => item.id === id);

  const nextId = (): string => {
    let id: string;
    do {
      counter += 1;
      id = `${prefix}-${counter}`;
    } while (inUse(id));
    return id;
  };

  const replace = (next: ToastItem<D>): void => {
    shown = shown.map((item) => (item.id === next.id ? next : item));
    waiting = waiting.map((item) => (item.id === next.id ? next : item));
  };

  const find = (id: string): ToastItem<D> | undefined =>
    shown.find((item) => item.id === id) ?? waiting.find((item) => item.id === id);

  const release = (item: ToastItem<D>): void => {
    shown = shown.filter((entry) => entry.id !== item.id);
    options.onExitComplete?.(item);
  };

  const add = (input: ToastOptions<D>): string => {
    if (input.id !== undefined) {
      const same = find(input.id);
      if (same?.open === true) {
        replace(applyPatch(same, input));
        publish();
        return same.id;
      }
      // A dismissed toast with that id is still exiting; it makes way for the new one.
      if (same !== undefined) release(same);
    }
    if (input.key !== undefined) {
      const twin = [...shown, ...waiting].find((item) => item.open && item.key === input.key);
      if (twin !== undefined) {
        replace(applyPatch(twin, input));
        publish();
        return twin.id;
      }
    }
    const id = input.id ?? nextId();
    waiting.push({
      id,
      key: input.key,
      title: input.title,
      description: input.description,
      type: input.type ?? "foreground",
      duration: input.duration ?? options.duration,
      data: input.data,
      open: true,
    });
    fill();
    publish();
    return id;
  };

  const update = (id: string, patch: ToastPatch<D>): boolean => {
    const item = find(id);
    if (item === undefined) return false;
    replace(applyPatch(item, patch));
    publish();
    return true;
  };

  const dismiss = (id?: string): void => {
    if (id === undefined) {
      waiting = [];
      shown = shown.map((item) => (item.open ? { ...item, open: false } : item));
      publish();
      return;
    }
    waiting = waiting.filter((item) => item.id !== id);
    shown = shown.map((item) => (item.id === id && item.open ? { ...item, open: false } : item));
    fill();
    publish();
  };

  const remove = (id: string): void => {
    const item = shown.find((entry) => entry.id === id);
    waiting = waiting.filter((entry) => entry.id !== id);
    if (item !== undefined) release(item);
    fill();
    publish();
  };

  const promise = <T>(
    source: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages<T, D>,
    promiseOptions: ToastOptions<D> = {},
  ): ToastPromiseHandle<T> => {
    const settledDuration = promiseOptions.duration ?? options.duration;
    const id = add({
      ...promiseOptions,
      ...contentToPatch(messages.loading),
      duration: Number.POSITIVE_INFINITY,
    });
    const result = typeof source === "function" ? source() : source;
    const settle = (patch: ToastPatch<D>): void => {
      // A toast the user dismissed while the promise was pending must stay dismissed.
      if (find(id)?.open !== true) return;
      update(id, { ...patch, duration: patch.duration ?? settledDuration });
    };
    result.then(
      (value) => {
        const content = messages.success;
        settle(contentToPatch(typeof content === "function" ? content(value) : content));
      },
      (reason: unknown) => {
        const content = messages.error;
        settle(contentToPatch(typeof content === "function" ? content(reason) : content));
      },
    );
    return { id, result };
  };

  return {
    toasts: shownSignal,
    pending: waitingSignal,
    add,
    update,
    dismiss,
    remove,
    promise,
  };
}
