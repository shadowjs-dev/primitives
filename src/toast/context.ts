import { type Accessor, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { createPartContext, type PartContext } from "../utils/index";
import type { ToastType } from "./queue";
import type { SwipeDirection } from "./swipe";

/**
 * The default time, in ms, before a toast closes itself, used when {@link ToastProvider} sets no `duration`. A toast's own duration, or its toaster's, overrides it.
 * @example
 * import { DEFAULT_TOAST_DURATION } from "@shadow-js/primitives";
 *
 * export const fiveSeconds: number = DEFAULT_TOAST_DURATION;
 * @see {@link ToastProviderProps}
 * @since 1.0.0
 */
export const DEFAULT_TOAST_DURATION = 5000;
/**
 * The default distance, in px, a swipe must travel beyond to dismiss a toast. The comparison is strict: a swipe of exactly this distance snaps back.
 * @example
 * import { DEFAULT_SWIPE_THRESHOLD } from "@shadow-js/primitives";
 *
 * export const threshold: number = DEFAULT_SWIPE_THRESHOLD;
 * @see {@link ToastProviderProps}
 * @since 1.0.0
 */
export const DEFAULT_SWIPE_THRESHOLD = 50;
/**
 * The default name of the viewport region for assistive technology, before the hotkey is appended. With the default hotkey the region is named "Notification (F8)".
 * @example
 * import { DEFAULT_TOAST_LABEL } from "@shadow-js/primitives";
 *
 * export const regionName: string = `${DEFAULT_TOAST_LABEL} (F8)`;
 * @see {@link ToastProviderProps}
 * @since 1.0.0
 */
export const DEFAULT_TOAST_LABEL = "Notification";

/**
 * Props of {@link ToastProvider}. The provider sets no ARIA attributes and no data attributes of its own: `label` names the region that {@link ToastViewport} renders with `role="region"` and `aria-label`, and the toasts set their own `data-*` attributes.
 * @since 1.0.0
 * @see {@link ToastProvider}
 */
export interface ToastProviderProps {
  /**
   * The name of the viewport region for assistive technology. The region is labeled `"{label} ({hotkey})"`, for example "Notification (F8)".
   * @default "Notification"
   */
  readonly label?: string | undefined;
  /**
   * Time in ms before a toast closes itself, for toasts that set no duration of their own. `Infinity` never closes them.
   * @default 5000
   */
  readonly duration?: number | undefined;
  /**
   * The side a toast is swiped toward to dismiss it. Every toast sets `data-swipe-direction` to this value.
   * @default "right"
   */
  readonly swipeDirection?: SwipeDirection | undefined;
  /**
   * Distance in px a swipe must travel, strictly more than this, to dismiss a toast. A shorter swipe snaps back.
   * @default 50
   */
  readonly swipeThreshold?: number | undefined;
  /**
   * The application: the viewport, the toasts and anything that creates them.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/** Why the toasts are paused; each reason is one bit. @internal */
export type PauseReason = "pointer" | "focus" | "blur" | "hidden";

const PAUSE_BITS: Readonly<Record<PauseReason, number>> = {
  pointer: 1,
  focus: 2,
  blur: 4,
  hidden: 8,
};

/**
 * What every toast part reads from {@link ToastProvider}: the defaults, the region and list elements, the pause state and the number of mounted toasts. Parts read it with `toastProviderContext.use`.
 * @since 1.0.0
 * @see {@link toastProviderContext}
 */
export interface ToastProviderContextValue {
  /** The accessible name of the viewport region, before the hotkey is appended. Call it to read the value. */
  readonly label: Accessor<string>;
  /** The default time a toast stays open, in milliseconds. Call it to read the value. */
  readonly duration: Accessor<number>;
  /** The direction a toast is swiped away in. Call it to read the value. */
  readonly swipeDirection: Accessor<SwipeDirection>;
  /** The distance, in px, a swipe must pass before it dismisses the toast. Call it to read the value. */
  readonly swipeThreshold: Accessor<number>;
  /** The viewport region element (the focus and hotkey target). */
  readonly region: Accessor<HTMLElement | undefined>;
  readonly setRegion: (element: HTMLElement | undefined) => void;
  /** The list element toasts are rendered into. */
  readonly list: Accessor<HTMLElement | undefined>;
  readonly setList: (element: HTMLElement | undefined) => void;
  /** Whether the viewport holds the timers: pointer over it, focus in it, window blurred or hidden. */
  readonly paused: Accessor<boolean>;
  readonly setPauseReason: (reason: PauseReason, active: boolean) => void;
  /** How many toasts are mounted. */
  readonly toastCount: Accessor<number>;
  /** Registers a mounted toast; call inside `onMount`. Returns the unregister function. */
  readonly registerToast: () => () => void;
}

/**
 * The context {@link ToastProvider} provides. The viewport and the toasts read it with `use`, which throws outside a provider.
 * @example
 * import { toastProviderContext } from "@shadow-js/primitives";
 *
 * export function ToastRegionName() {
 *   const provider = toastProviderContext.use("ToastRegionName");
 *   return <span>{provider.label()}</span>;
 * }
 * @see {@link ToastProvider}
 * @since 1.0.0
 */
export const toastProviderContext: PartContext<ToastProviderContextValue> =
  createPartContext<ToastProviderContextValue>("Toast.Provider");

/** Marks the parts rendered inside the viewport (a toast there is inline, elsewhere it is portaled). @internal */
export const toastViewportContext: PartContext<true> = createPartContext<true>("Toast.Viewport");

/**
 * What the parts inside a toast read from {@link ToastRoot}: whether the toast is open, its announcement type, and the means to close it. Parts read it with `toastContext.use`.
 * @since 1.0.0
 * @see {@link toastContext}
 */
export interface ToastContextValue {
  /** Whether the toast is open. Call it to read the value. */
  readonly open: Accessor<boolean>;
  /** The announcement type: `"foreground"` (announced at once) or `"background"` (announced politely). Call it to read the value. */
  readonly type: Accessor<ToastType>;
  /** Closes the toast, moving focus to the viewport when the focus was inside the toast. */
  readonly close: () => void;
}

/**
 * The context {@link ToastRoot} provides to its parts. `Toast.Title`, `Toast.Description`, `Toast.Action` and `Toast.Close` call `use` on it, so each throws when rendered outside a `Toast`.
 * @example
 * import { toastContext } from "@shadow-js/primitives";
 *
 * export function ToastState() {
 *   const toast = toastContext.use("ToastState");
 *   return <span>{toast.open() ? "Showing" : "Dismissed"}</span>;
 * }
 * @see {@link ToastRoot}
 * @since 1.0.0
 */
export const toastContext: PartContext<ToastContextValue> =
  createPartContext<ToastContextValue>("Toast");

/** Builds the state the provider shares with the viewport and the toasts. @internal */
export function createToastProviderContext(props: ToastProviderProps): ToastProviderContextValue {
  const [region, setRegionSignal] = useSignal<HTMLElement | undefined>(undefined);
  const [list, setListSignal] = useSignal<HTMLElement | undefined>(undefined);
  const [mask, setMask] = useSignal(0);
  const [count, setCount] = useSignal(0);
  return {
    label: () => props.label ?? DEFAULT_TOAST_LABEL,
    duration: () => props.duration ?? DEFAULT_TOAST_DURATION,
    swipeDirection: () => props.swipeDirection ?? "right",
    swipeThreshold: () => props.swipeThreshold ?? DEFAULT_SWIPE_THRESHOLD,
    region,
    setRegion: (element) => setRegionSignal(() => element),
    list,
    setList: (element) => setListSignal(() => element),
    paused: () => mask() !== 0,
    setPauseReason(reason, active) {
      const bit = PAUSE_BITS[reason];
      setMask((current) => (active ? current | bit : current & ~bit));
    },
    toastCount: count,
    registerToast() {
      setCount((value) => value + 1);
      return () => setCount((value) => value - 1);
    },
  };
}
