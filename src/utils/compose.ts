/**
 * Small composition helpers shared by every primitive: calling any event-handler form, composing
 * handlers so the application keeps control, and composing refs.
 * @packageDocumentation
 */
import { untrack } from "@shadow-js/core";

/** A handler that takes any event; the constraint of {@link alwaysRun}. */
type AnyEventHandler = (event: never) => unknown;

/**
 * Anything JSX accepts for an `onX` attribute: a function, a `[fn, data]` tuple (the data is passed
 * as the first argument) or a listener object with `handleEvent`. {@link toCallable} turns each form
 * into a plain function.
 * @see {@link toCallable}
 * @see {@link callHandler}
 * @since 1.0.0
 */
export type EventHandlerLike =
  | ((event: never) => unknown)
  | readonly [(data: never, event: never) => unknown, unknown]
  | { handleEvent(event: never): unknown };

/**
 * A ref as JSX hands it to a component: a callback, or `undefined` when the caller passed none.
 * @typeParam T The element type.
 * @see {@link composeRefs}
 * @since 1.0.0
 */
export type RefCallback<T> = ((element: T) => void) | undefined;

/**
 * Handlers the library must run even when the application called `preventDefault()` on the event
 * (bookkeeping such as "the pointer went down inside"). `mergeElementProps` skips the
 * default-prevented check for them. A WeakSet, so the marker never touches the function itself.
 */
const ALWAYS_RUN = new WeakSet<object>();

/**
 * Marks an internal handler as one that must run even if an earlier handler prevented the default
 * action. Use it only for bookkeeping that must not depend on the application. The function is
 * returned unchanged; only its identity is recorded.
 *
 * @param handler The internal handler.
 * @returns The same function.
 * @example
 * import { alwaysRun, mergeElementProps } from "@shadow-js/primitives";
 *
 * let pointerDowns = 0;
 *
 * export function bookkeepingProps(app: { onPointerDown?: (event: PointerEvent) => void }) {
 *   return mergeElementProps(
 *     { onPointerDown: alwaysRun((event: PointerEvent) => { pointerDowns += 1; }) },
 *     app,
 *   );
 * }
 * @see {@link mergeElementProps}
 * @since 1.0.0
 */
export function alwaysRun<F extends AnyEventHandler>(handler: F): F {
  ALWAYS_RUN.add(handler);
  return handler;
}

/**
 * Whether `handler` was marked with {@link alwaysRun}. Used by `mergeElementProps` to decide which
 * handlers run after a `preventDefault()`. No barrel re-exports it, so it is internal to the package.
 *
 * @param handler Any value.
 * @returns `true` for a function marked with {@link alwaysRun}.
 * @see {@link alwaysRun}
 * @since 1.0.0
 * @internal
 */
export function isAlwaysRun(handler: unknown): boolean {
  return typeof handler === "function" && ALWAYS_RUN.has(handler);
}

/**
 * Turns any event-handler form into a plain function, or `undefined` when there is none. A tuple
 * `[fn, data]` becomes a function that calls `fn(data, event)`; a listener object becomes a function
 * that calls its `handleEvent`. Other values give `undefined`. Nothing is called.
 *
 * @param handler A function, a `[fn, data]` tuple, a listener object, or nothing.
 * @returns A function that takes the event, or `undefined`.
 * @example
 * import { toCallable } from "@shadow-js/primitives";
 *
 * const onRow = toCallable([(id: string, event: Event) => console.log(id, event.type), "row-1"]);
 * onRow?.(new Event("click") as never);
 * @see {@link callHandler}
 * @see {@link EventHandlerLike}
 * @since 1.0.0
 */
export function toCallable(handler: unknown): ((event: never) => void) | undefined {
  if (typeof handler === "function") {
    const fn = handler as (event: never) => void;
    return fn;
  }
  if (Array.isArray(handler) && typeof handler[0] === "function") {
    const [fn, data] = handler as [(data: unknown, event: never) => void, unknown];
    const bound = (event: never): void => {
      fn(data, event);
    };
    return bound;
  }
  if (
    typeof handler === "object" &&
    handler !== null &&
    typeof (handler as { handleEvent?: unknown }).handleEvent === "function"
  ) {
    const object = handler as { handleEvent(event: never): void };
    const bound = (event: never): void => {
      object.handleEvent(event);
    };
    return bound;
  }
  return undefined;
}

/**
 * Calls a handler of any form with the event, untracked. A missing handler is a no-op. Use it for
 * handlers the application passed in, so a read inside the handler does not subscribe the caller.
 *
 * @param handler A function, a `[fn, data]` tuple, a listener object, or nothing.
 * @param event The event (or, for value handlers such as `onCheckedChange`, the value) to pass.
 * @example
 * import { callHandler } from "@shadow-js/primitives";
 *
 * export function notifyChange(onCheckedChange: unknown, checked: boolean): void {
 *   callHandler(onCheckedChange, checked);
 * }
 * @see {@link toCallable}
 * @see {@link composeEventHandlers}
 * @since 1.0.0
 */
export function callHandler(handler: unknown, event: unknown): void {
  const fn = toCallable(handler);
  if (fn !== undefined) untrack(() => fn(event as never));
}

/**
 * Composes the application's handler with the library's: the application runs first, and the
 * library's runs only if the application did not call `preventDefault()`. This is how every part
 * lets the application veto a built-in behavior. The handler sets no ARIA attributes and handles no
 * keys by itself; the part that uses it decides.
 *
 * @param external The application's handler (any form), read when the event fires. Pass an
 *   accessor so a reactive prop is always current.
 * @param internal The library's handler.
 * @param checkDefaultPrevented Set to `false` to run `internal` regardless.
 * @returns A single handler.
 * @example
 * import { composeEventHandlers } from "@shadow-js/primitives";
 *
 * export function clickHandler(
 *   props: { onClick?: (event: MouseEvent) => void },
 *   toggle: () => void,
 * ) {
 *   return composeEventHandlers<MouseEvent>(() => props.onClick, () => toggle());
 * }
 * @see {@link callHandler}
 * @see {@link mergeElementProps}
 * @since 1.0.0
 */
export function composeEventHandlers<E extends Event>(
  external: () => unknown,
  internal: (event: E) => void,
  checkDefaultPrevented = true,
): (event: E) => void {
  return (event: E): void => {
    callHandler(external(), event);
    if (!checkDefaultPrevented || !event.defaultPrevented) internal(event);
  };
}

/**
 * Composes several refs into one callback that calls each with the element, in argument order.
 * `undefined` entries are skipped. The returned callback is new on every call, so keep the result
 * stable (for example in a variable) when identity matters.
 *
 * @param refs Ref callbacks, as received in `props.ref`.
 * @returns One ref callback.
 * @example
 * import { composeRefs, type RefCallback } from "@shadow-js/primitives";
 *
 * export function Trigger(props: { ref?: RefCallback<HTMLButtonElement> }) {
 *   let trigger: HTMLButtonElement | undefined;
 *   return <button ref={composeRefs(props.ref, (element: HTMLButtonElement) => { trigger = element; })} />;
 * }
 * @see {@link RefCallback}
 * @see {@link mergeElementProps}
 * @since 1.0.0
 */
export function composeRefs<T>(...refs: readonly RefCallback<T>[]): (element: T) => void {
  return (element: T): void => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(element);
    }
  };
}
