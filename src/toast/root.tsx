import {
  onCleanup,
  onMount,
  splitProps,
  untrack,
  useEffect,
  useMemo,
  useSignal,
} from "@shadow-js/core";
import { Portal, Show } from "@shadow-js/web";
import { isClaiming } from "@shadow-js/web/extend";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  announce,
  callHandler,
  composeEventHandlers,
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useControllableState,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { getAnnounceText } from "./announce-text";
import {
  type ToastContextValue,
  toastContext,
  toastProviderContext,
  toastViewportContext,
} from "./context";
import type { ToastType } from "./queue";
import {
  getSwipeDelta,
  getSwipeMoveBuffer,
  hasLeftDeadZone,
  isDeltaInDirection,
  type SwipePoint,
} from "./swipe";

/**
 * The event passed to the swipe callbacks of {@link ToastRoot}: a `CustomEvent` whose `detail.delta` is the clamped travel in px along the swipe axis and whose `detail.originalEvent` is the pointer event. Calling `preventDefault()` in `onSwipeEnd` keeps the toast open.
 * @since 1.0.0
 * @see {@link ToastRootOwnProps}
 */
export type ToastSwipeEvent = CustomEvent<{
  readonly originalEvent: PointerEvent;
  readonly delta: SwipePoint;
}>;

/**
 * Own props of {@link ToastRoot}, the element one toast renders. The toast is an `li` with `tabindex="0"` and no role, and it is not a live region: its text is announced once through a shared live region, `role="alert"` (`aria-live="assertive"`) for `"foreground"` and `role="status"` (`aria-live="polite"`) for `"background"`. It sets `data-state` (`"open"` or `"closed"`), `data-swipe-direction` (the provider's `swipeDirection`) and, during a swipe, `data-swipe` (`"start"`, `"move"`, `"cancel"` or `"end"`; absent otherwise).
 * @since 1.0.0
 * @see {@link ToastRoot}
 */
export interface ToastRootOwnProps {
  /**
   * Controlled open state. With `onOpenChange` the application owns it: a close request only calls `onOpenChange(false)`, and the toast stays until `open` is `false`.
   * @default none (uncontrolled)
   */
  readonly open?: boolean | undefined;
  /**
   * Initial open state when uncontrolled. A toast exists to be seen, so it opens by default.
   * @default true
   */
  readonly defaultOpen?: boolean | undefined;
  /**
   * Called with `false` when the toast asks to close: its timer ran out, Escape was pressed, a swipe passed the threshold, or `Toast.Action` or `Toast.Close` was activated. Use it to update the state that controls `open`.
   * @default none
   */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Time in ms before the toast closes itself, overriding the provider's `duration`. `Infinity` never closes it. Changing it restarts the countdown.
   * @default none (the provider's duration)
   */
  readonly duration?: number | undefined;
  /**
   * How the toast is announced. `"foreground"` is announced assertively through `role="alert"` and interrupts the screen reader; `"background"` is announced politely through `role="status"`. Any other value warns in development (`[primitives TOAST_TYPE]`) and is treated as `"foreground"`.
   * @default "foreground"
   */
  readonly type?: ToastType | undefined;
  /**
   * Keeps the toast mounted while it is closed, for animation libraries that drive their own exit. A closed toast then has `data-state="closed"` and sets no timer.
   * @default false
   */
  readonly forceMount?: boolean | undefined;
  /**
   * Called when the countdown pauses: the pointer entered the viewport, focus moved inside it, the window lost focus, or the page was hidden. Not called while the toast is closed.
   * @default none
   */
  readonly onPause?: (() => void) | undefined;
  /**
   * Called when the countdown resumes. The time the toast had left is kept and counted down from.
   * @default none
   */
  readonly onResume?: (() => void) | undefined;
  /**
   * Called with the keydown event when Escape is pressed while focus is inside the toast, including on its buttons. Calling `preventDefault()` keeps the toast open. Only Escape is read: other keys never close it.
   * @default none
   */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /**
   * Called once when a swipe starts: the pointer has traveled past the slack (`10` px for touch, `2` px otherwise) along the dismiss axis.
   * @default none
   */
  readonly onSwipeStart?: ((event: ToastSwipeEvent) => void) | undefined;
  /**
   * Called on every pointer move during a swipe, with the clamped travel in `detail.delta`.
   * @default none
   */
  readonly onSwipeMove?: ((event: ToastSwipeEvent) => void) | undefined;
  /**
   * Called when a swipe is abandoned: the pointer was released before the threshold, or the pointer was canceled, even past the threshold. The toast snaps back.
   * @default none
   */
  readonly onSwipeCancel?: ((event: ToastSwipeEvent) => void) | undefined;
  /**
   * Called when a swipe is released past the threshold, before the toast closes. Calling `preventDefault()` keeps the toast open and snaps it back.
   * @default none
   */
  readonly onSwipeEnd?: ((event: ToastSwipeEvent) => void) | undefined;
  /**
   * Called after the toast has left the DOM: its CSS exit animation or transition ended, or at once when there is none. Remove it from your list here. It is not called for a toast that never mounted.
   * @default none
   */
  readonly onExitComplete?: (() => void) | undefined;
}

/**
 * Props of {@link ToastRoot}: the attributes of the `li` it renders (`as` can replace the element), plus {@link ToastRootOwnProps}.
 * @typeParam T The element to render, `"li"` by default.
 * @since 1.0.0
 * @see {@link ToastRoot}
 */
export type ToastRootProps<T extends PolymorphicTarget = "li"> = PolymorphicProps<
  "li",
  ToastRootOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN_KEYS = [
  "as",
  "open",
  "defaultOpen",
  "onOpenChange",
  "duration",
  "type",
  "forceMount",
  "onPause",
  "onResume",
  "onEscapeKeyDown",
  "onSwipeStart",
  "onSwipeMove",
  "onSwipeCancel",
  "onSwipeEnd",
  "onExitComplete",
  "onKeyDown",
  "onPointerDown",
  "onPointerMove",
  "onPointerUp",
  "onPointerCancel",
  "onClick",
] as const;

/**
 * One notification: an `li` that closes itself after its `duration`, on Escape, on a swipe past the threshold, and through `Toast.Action` or `Toast.Close`. The countdown pauses while the viewport is hovered or focused, and while the window is blurred or the page is hidden. The toast's text is announced once when it appears, assertively for `foreground` and politely for `background`, through a shared live region; the toast itself is not a live region. It stays mounted until its CSS exit animation or transition ends.
 *
 * Keyboard: the toast is focusable (`tabindex="0"`). Escape closes it while focus is inside it, unless `onEscapeKeyDown` prevents the default. Enter and Space activate the buttons inside it. When the toast closes while focus is inside it, focus moves to the viewport region so it is not lost. ARIA: the toast has no role; the announcement uses `role="alert"` or `role="status"`. Data attributes: `data-state` (`"open"` or `"closed"`), `data-swipe-direction` (the provider's `swipeDirection`), and `data-swipe` (`"start"`, `"move"`, `"cancel"` or `"end"` during a swipe, absent otherwise). The CSS variables `--primitives-toast-swipe-move-x` and `--primitives-toast-swipe-move-y` carry the travel in px while moving, and `--primitives-toast-swipe-end-x` and `--primitives-toast-swipe-end-y` after a successful swipe.
 *
 * Render it inside `Toast.Viewport`, or anywhere inside `Toast.Provider`; it is then moved into the viewport once that exists.
 *
 * @param props See {@link ToastRootProps}.
 * @returns The toast, or nothing while it is closed and not force-mounted.
 * @throws Error when rendered outside a `Toast.Provider`, with the message `[primitives] <Toast> must be used within <Toast.Provider>.`
 * @example
 * import { Toast } from "@shadow-js/primitives";
 * import { useSignal } from "@shadow-js/core";
 *
 * export function ScheduledToast() {
 *   const [open, setOpen] = useSignal(true);
 *   return (
 *     <Toast.Provider>
 *       <Toast.Viewport />
 *       <Toast open={open()} duration={4000} onOpenChange={setOpen}>
 *         <Toast.Title>Scheduled</Toast.Title>
 *         <Toast.Description>Friday at 5:00 PM</Toast.Description>
 *         <Toast.Action altText="Undo the scheduling">Undo</Toast.Action>
 *         <Toast.Close aria-label="Dismiss">x</Toast.Close>
 *       </Toast>
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link ToastRootProps}
 * @see {@link ToastRootOwnProps}
 * @see {@link ToastViewport}
 * @since 1.0.0
 */
export function ToastRoot<T extends PolymorphicTarget = "li">(props: ToastRootProps<T>): JsxChild {
  const provider = toastProviderContext.use("Toast");
  const inViewport = toastViewportContext.useOptional() !== undefined;
  const [own, rest] = splitProps(partProps<Loose & ToastRootOwnProps>(props), OWN_KEYS);
  const [open, setOpen] = useControllableState<boolean>({
    value: () => own.open,
    defaultValue: () => own.defaultOpen !== false,
    onChange: () => own.onOpenChange,
    name: "Toast open",
  });
  const presence = usePresence(() => open() || own.forceMount === true);

  let wasMounted = untrack(presence.mounted);
  useEffect(() => {
    const mounted = presence.mounted();
    if (wasMounted && !mounted) untrack(() => own.onExitComplete?.());
    wasMounted = mounted;
  });

  if (inViewport) {
    return (
      <Show when={presence.mounted()}>
        <ToastLayer
          own={own}
          rest={rest}
          open={open}
          setOpen={setOpen}
          presenceRef={presence.ref}
        />
      </Show>
    );
  }
  // The server never renders a portaled toast, so the client must not try to hydrate one: it
  // appears after mount, once the viewport exists.
  const [ready, setReady] = useSignal(false);
  onMount(() => {
    if (!isClaiming()) {
      setReady(true);
      return;
    }
    // Hydration flushes effects while it is still claiming: continue once it has returned.
    let disposed = false;
    queueMicrotask(() => {
      if (!disposed) setReady(true);
    });
    return () => {
      disposed = true;
    };
  });
  return (
    <Show when={ready() && provider.list() !== undefined}>
      <Portal mount={() => provider.list()}>
        <Show when={presence.mounted()}>
          <ToastLayer
            own={own}
            rest={rest}
            open={open}
            setOpen={setOpen}
            presenceRef={presence.ref}
          />
        </Show>
      </Portal>
    </Show>
  );
}

interface ToastLayerProps {
  readonly own: Loose & ToastRootOwnProps;
  readonly rest: object;
  readonly open: () => boolean;
  readonly setOpen: (open: boolean) => void;
  readonly presenceRef: (element: HTMLElement) => void;
}

/** What a swipe looks like to the styles: the phase and the travel. */
interface SwipeView {
  readonly phase: "start" | "move" | "cancel" | "end";
  readonly x: number;
  readonly y: number;
}

function swipeEvent(name: string, original: PointerEvent, delta: SwipePoint): ToastSwipeEvent {
  return new CustomEvent(`primitives.toast.${name}`, {
    cancelable: true,
    detail: { originalEvent: original, delta },
  });
}

/** The mounted part of a toast: everything here lives exactly as long as the element. */
function ToastLayer(layer: ToastLayerProps): JsxChild {
  const provider = toastProviderContext.use("Toast");
  const { own, setOpen } = layer;
  // Memos, not the raw accessors: an update to the item the application derives these from (a new
  // title, say) must not restart the countdown or announce the toast again, only a real change may.
  const open = useMemo(layer.open);
  const [node, setNode] = useSignal<HTMLElement | undefined>(undefined);
  const [swipe, setSwipe] = useSignal<SwipeView | undefined>(undefined);
  const duration = useMemo((): number => own.duration ?? provider.duration());
  const type = (): ToastType => (own.type === "background" ? "background" : "foreground");

  onMount(() => provider.registerToast());

  if (__DEV__) {
    useEffect(() => {
      const value = own.type;
      if (value !== undefined && value !== "foreground" && value !== "background") {
        console.warn(
          `[primitives TOAST_TYPE] Invalid type "${String(value)}" on <Toast>. Expected "foreground" or "background"; using "foreground".`,
        );
      }
    });
  }

  // Closing by hand while focus is inside the toast would drop focus on the body once the toast
  // leaves; the viewport is the closest place to keep the user's position.
  const close = (): void => {
    const element = untrack(node);
    const hadFocus = element?.contains(element.ownerDocument.activeElement) === true;
    setOpen(false);
    if (hadFocus) untrack(provider.region)?.focus({ preventScroll: true });
  };

  // The countdown. `remaining` is what is left of the duration; pausing subtracts the time that
  // elapsed since the timer last started, resuming starts a timer for what remains.
  let timer: ReturnType<typeof setTimeout> | undefined;
  let startedAt = 0;
  let remaining = Number.POSITIVE_INFINITY;
  const clearTimer = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  onCleanup(clearTimer);
  const runTimer = (): void => {
    clearTimer();
    if (!Number.isFinite(remaining)) return;
    startedAt = Date.now();
    timer = setTimeout(
      () => {
        timer = undefined;
        remaining = 0;
        setOpen(false);
      },
      Math.max(0, remaining),
    );
  };
  const haltTimer = (): void => {
    if (timer === undefined) return;
    clearTimer();
    remaining = Math.max(0, remaining - (Date.now() - startedAt));
  };

  useEffect(() => {
    if (!open()) return;
    remaining = duration();
    if (!untrack(provider.paused)) runTimer();
    onCleanup(clearTimer);
  });

  let wasPaused = untrack(provider.paused);
  useEffect(() => {
    const paused = provider.paused();
    if (paused === wasPaused) return;
    wasPaused = paused;
    untrack(() => {
      if (!open()) return;
      if (paused) {
        haltTimer();
        own.onPause?.();
      } else {
        runTimer();
        own.onResume?.();
      }
    });
  });

  // The announcement: once per appearance, through the shared live regions.
  useEffect(() => {
    const element = node();
    if (element === undefined || !open()) return;
    const text = getAnnounceText(element);
    if (text === "") return;
    announce(text, { politeness: untrack(type) === "background" ? "polite" : "assertive" });
  });

  // Swipe to dismiss. The gesture state is plain variables: only the view of it is reactive.
  let start: SwipePoint | undefined;
  let delta: SwipePoint | undefined;
  let suppressClick = false;

  const releaseCapture = (event: PointerEvent): void => {
    const element = untrack(node);
    if (element === undefined) return;
    if (
      typeof element.hasPointerCapture === "function" &&
      element.hasPointerCapture(event.pointerId)
    ) {
      element.releasePointerCapture(event.pointerId);
    }
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    suppressClick = false;
    start = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (start === undefined) return;
    const current = { x: event.clientX, y: event.clientY };
    const direction = untrack(provider.swipeDirection);
    const next = getSwipeDelta(start, current, direction);
    const buffer = getSwipeMoveBuffer(event.pointerType);
    if (delta !== undefined) {
      delta = next;
      setSwipe({ phase: "move", x: next.x, y: next.y });
      untrack(() => own.onSwipeMove?.(swipeEvent("swipeMove", event, next)));
    } else if (isDeltaInDirection(next, direction, buffer)) {
      delta = next;
      setSwipe({ phase: "start", x: 0, y: 0 });
      untrack(() => own.onSwipeStart?.(swipeEvent("swipeStart", event, next)));
      const element = untrack(node);
      // Without capture the pointer leaves the toast as it follows it and the gesture is lost.
      if (element !== undefined && typeof element.setPointerCapture === "function") {
        element.setPointerCapture(event.pointerId);
      }
    } else if (hasLeftDeadZone(start, current, buffer)) {
      // The user is scrolling or selecting, not swiping.
      start = undefined;
    }
  };

  const finishSwipe = (event: PointerEvent, allowEnd: boolean): void => {
    releaseCapture(event);
    const finished = delta;
    start = undefined;
    delta = undefined;
    if (finished === undefined) return;
    suppressClick = true;
    const threshold = untrack(provider.swipeThreshold);
    const direction = untrack(provider.swipeDirection);
    if (allowEnd && isDeltaInDirection(finished, direction, threshold)) {
      const ending = swipeEvent("swipeEnd", event, finished);
      untrack(() => own.onSwipeEnd?.(ending));
      if (ending.defaultPrevented) {
        setSwipe({ phase: "cancel", x: 0, y: 0 });
        return;
      }
      setSwipe({ phase: "end", x: finished.x, y: finished.y });
      close();
      return;
    }
    untrack(() => own.onSwipeCancel?.(swipeEvent("swipeCancel", event, finished)));
    setSwipe({ phase: "cancel", x: 0, y: 0 });
  };

  // `pointercancel` is not a delegated event, so the framework would leave a native listener behind
  // when the toast goes: bind and unbind it here.
  useEffect(() => {
    const element = node();
    if (element === undefined) return;
    const onPointerCancel = (event: PointerEvent): void => {
      callHandler(own["onPointerCancel"], event);
      if (!event.defaultPrevented) finishSwipe(event, false);
    };
    element.addEventListener("pointercancel", onPointerCancel);
    onCleanup(() => element.removeEventListener("pointercancel", onPointerCancel));
  });

  const context: ToastContextValue = { open, type, close };

  const merged = mergeElementProps(
    {
      tabindex: 0,
      get "data-state"() {
        return open() ? "open" : "closed";
      },
      get "data-swipe-direction"() {
        return provider.swipeDirection();
      },
      get "data-swipe"() {
        return swipe()?.phase;
      },
      get style() {
        const view = swipe();
        return {
          "user-select": "none",
          "touch-action": "none",
          "--primitives-toast-swipe-move-x": view?.phase === "move" ? `${view.x}px` : undefined,
          "--primitives-toast-swipe-move-y": view?.phase === "move" ? `${view.y}px` : undefined,
          "--primitives-toast-swipe-end-x": view?.phase === "end" ? `${view.x}px` : undefined,
          "--primitives-toast-swipe-end-y": view?.phase === "end" ? `${view.y}px` : undefined,
        };
      },
    },
    layer.rest,
    {
      ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => setNode(element)),
      onKeyDown: composeEventHandlers(
        () => own["onKeyDown"],
        (event: KeyboardEvent) => {
          if (event.key !== "Escape") return;
          callHandler(own.onEscapeKeyDown, event);
          if (!event.defaultPrevented) close();
        },
      ),
      onPointerDown: composeEventHandlers(() => own["onPointerDown"], onPointerDown),
      onPointerMove: composeEventHandlers(() => own["onPointerMove"], onPointerMove),
      onPointerUp: composeEventHandlers(
        () => own["onPointerUp"],
        (event: PointerEvent) => finishSwipe(event, true),
      ),
      // A swipe that ends over a link or button must not also activate it.
      onClick: composeEventHandlers(
        () => own["onClick"],
        (event: MouseEvent) => {
          if (!suppressClick) return;
          suppressClick = false;
          event.preventDefault();
        },
      ),
    },
  );

  return (
    <toastContext.Provider value={context}>
      <Polymorphic as={own.as ?? "li"} {...merged} />
    </toastContext.Provider>
  );
}
