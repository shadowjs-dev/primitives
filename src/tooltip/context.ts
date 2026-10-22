import { type Accessor, onCleanup, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createPartContext,
  type PartContext,
  partId,
  useBaseId,
  useControllableState,
} from "../utils/index";

/** The document event a tooltip fires when it opens; the others close. @internal */
export const TOOLTIP_OPEN_EVENT = "primitives.tooltip.open";

/**
 * The default time the pointer must rest on a trigger before its tooltip opens, in milliseconds.
 * A {@link TooltipProvider} `delayDuration` replaces it, and a {@link TooltipRoot} `delayDuration`
 * replaces both. Keyboard focus is never delayed.
 * @example
 * import { DEFAULT_DELAY_DURATION } from "@shadow-js/primitives";
 *
 * const delay: number = DEFAULT_DELAY_DURATION;
 * console.log(delay);
 * @see {@link TooltipProviderProps}
 * @since 1.0.0
 */
export const DEFAULT_DELAY_DURATION = 700;
/**
 * The default time after a tooltip closes during which the next tooltip of the same provider opens
 * at once, in milliseconds. A {@link TooltipProvider} `skipDelayDuration` replaces it.
 * @example
 * import { DEFAULT_SKIP_DELAY_DURATION } from "@shadow-js/primitives";
 *
 * const window: number = DEFAULT_SKIP_DELAY_DURATION;
 * console.log(window);
 * @see {@link TooltipProviderProps}
 * @since 1.0.0
 */
export const DEFAULT_SKIP_DELAY_DURATION = 300;

/**
 * Props of {@link TooltipProvider}: the delay settings that every tooltip below it shares.
 *
 * Accessibility: none of these props changes an ARIA attribute or a key. They only decide when a
 * tooltip opens and closes.
 * @since 1.0.0
 * @see {@link TooltipProvider}
 */
export interface TooltipProviderProps {
  /**
   * How long the pointer must rest on a trigger before its tooltip opens, in milliseconds. A
   * {@link TooltipRoot} `delayDuration` overrides it for one tooltip.
   * @default `700`
   */
  readonly delayDuration?: number | undefined;
  /**
   * After a tooltip closes, how long the next trigger opens its tooltip without the delay, in
   * milliseconds. This is what makes moving along a row of triggers feel instant.
   * @default `300`
   */
  readonly skipDelayDuration?: number | undefined;
  /**
   * Closes the tooltip as soon as the pointer leaves the trigger, instead of letting the pointer travel
   * to the content. A {@link TooltipRoot} `disableHoverableContent` overrides it for one tooltip.
   * @default `false`
   */
  readonly disableHoverableContent?: boolean | undefined;
  /**
   * The application below the provider.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/**
 * The delay group a {@link TooltipProvider} shares. It remembers when a tooltip last opened and
 * closed, so the next tooltip can skip the delay while the skip window is open. Read by the tooltip
 * roots; build one with {@link createTooltipGroup}.
 * @since 1.0.0
 * @see {@link TooltipProvider}
 */
export interface TooltipGroup {
  /** The delay a tooltip waits before it opens, in milliseconds. */
  readonly delayDuration: Accessor<number>;
  /** The skip window after a tooltip closes, in milliseconds. */
  readonly skipDelayDuration: Accessor<number>;
  /** Whether the tooltips close as soon as the pointer leaves their trigger. */
  readonly disableHoverableContent: Accessor<boolean>;
  /** Whether the next tooltip has to wait `delayDuration` (false inside the skip window). */
  readonly isOpenDelayed: () => boolean;
  /** A tooltip of the group opened. */
  readonly onOpen: () => void;
  /** A tooltip of the group closed; opens the skip window. */
  readonly onClose: () => void;
  /** Whether the pointer is traveling between a trigger and its content. */
  readonly isPointerInTransit: () => boolean;
  readonly setPointerInTransit: (inTransit: boolean) => void;
}

/**
 * The delay group that a {@link TooltipProvider} provides to the tooltips below it. A tooltip reads
 * it with `useOptional()`, which returns `undefined` outside a provider; the tooltip then forms a
 * group of its own. `use()` throws outside a provider.
 * @example
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 * import { type TooltipGroup, tooltipGroupContext } from "@shadow-js/primitives";
 *
 * export function ProviderDelay(): JsxChild {
 *   const group: TooltipGroup = tooltipGroupContext.use("Tooltip.Delay");
 *   return <span>{group.delayDuration()}</span>;
 * }
 * @see {@link TooltipGroup}
 * @see {@link createTooltipGroup}
 * @since 1.0.0
 */
export const tooltipGroupContext: PartContext<TooltipGroup> =
  createPartContext<TooltipGroup>("TooltipProvider");

/**
 * Builds the delay group that {@link TooltipProvider} provides. Its skip-window timer is cleared
 * when the owner is disposed, so an unmounted provider leaves no timer behind. Call it inside a
 * component, not at module level.
 *
 * @param props See {@link TooltipProviderProps}.
 * @returns The delay group.
 * @example
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 * import { createTooltipGroup, type TooltipProviderProps } from "@shadow-js/primitives";
 *
 * export function GroupStatus(props: TooltipProviderProps): JsxChild {
 *   const group = createTooltipGroup(props);
 *   return <span>{group.isOpenDelayed() ? "waits" : "instant"}</span>;
 * }
 * @see {@link TooltipProvider}
 * @since 1.0.0
 */
export function createTooltipGroup(props: TooltipProviderProps): TooltipGroup {
  // Plain variables: they are only ever read from event handlers and timers, never rendered.
  let isOpenDelayed = true;
  let inTransit = false;
  let skipTimer: ReturnType<typeof setTimeout> | undefined;
  const clearSkipTimer = (): void => {
    if (skipTimer !== undefined) clearTimeout(skipTimer);
    skipTimer = undefined;
  };
  onCleanup(clearSkipTimer);
  return {
    delayDuration: () => props.delayDuration ?? DEFAULT_DELAY_DURATION,
    skipDelayDuration: () => props.skipDelayDuration ?? DEFAULT_SKIP_DELAY_DURATION,
    disableHoverableContent: () => props.disableHoverableContent === true,
    isOpenDelayed: () => isOpenDelayed,
    onOpen() {
      clearSkipTimer();
      isOpenDelayed = false;
    },
    onClose() {
      clearSkipTimer();
      skipTimer = setTimeout(() => {
        isOpenDelayed = true;
        skipTimer = undefined;
      }, props.skipDelayDuration ?? DEFAULT_SKIP_DELAY_DURATION);
    },
    isPointerInTransit: () => inTransit,
    setPointerInTransit(next) {
      inTransit = next;
    },
  };
}

/**
 * Props of {@link TooltipRoot}: the open state and the timing overrides of one tooltip.
 *
 * Accessibility: while the tooltip is open, the trigger's `aria-describedby` names the content, and
 * the content's hidden copy has the `role="tooltip"` with the same id. Data attributes: none on the
 * root; the trigger and the content carry `data-state`.
 * @since 1.0.0
 * @see {@link TooltipRoot}
 */
export interface TooltipProps {
  /**
   * Controlled open state. Controlled when set (not `undefined`): the tooltip shows this value and
   * asks to change only through `onOpenChange`.
   * @default none (uncontrolled)
   */
  readonly open?: boolean | undefined;
  /**
   * Initial open state when uncontrolled.
   * @default `false`
   */
  readonly defaultOpen?: boolean | undefined;
  /**
   * Called with the new state each time the tooltip asks to open or close. Hovering or focusing the
   * trigger opens it; Escape, blur, a press, a click, a press outside or leaving the trigger and the
   * grace area closes it.
   * @default none
   */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Overrides the provider's `delayDuration` for this tooltip, in milliseconds.
   * @default the provider's `delayDuration`, else `700`
   */
  readonly delayDuration?: number | undefined;
  /**
   * Overrides the provider's `disableHoverableContent` for this tooltip.
   * @default the provider's `disableHoverableContent`, else `false`
   */
  readonly disableHoverableContent?: boolean | undefined;
  /**
   * Base id; the content's id derives from it. Generated per tooltip when omitted.
   * @default generated
   */
  readonly id?: string | undefined;
  /**
   * The trigger, the portal and the content.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/**
 * What every tooltip part reads from its root: the open state, the ids, the trigger reference and
 * the handlers that open and close the tooltip. Parts read it through {@link tooltipContext}.
 * @since 1.0.0
 * @see {@link tooltipContext}
 */
export interface TooltipContextValue {
  /** Whether the tooltip is open. Call it to read the value. */
  readonly open: Accessor<boolean>;
  /** `"closed"`, `"delayed-open"` (the pointer waited) or `"instant-open"` (focus, or the skip window). */
  readonly stateAttribute: Accessor<"closed" | "delayed-open" | "instant-open">;
  /** The delay group the tooltip belongs to. */
  readonly group: TooltipGroup;
  /** Whether the pointer must leave the trigger without traveling to the content. Call it to read the value. */
  readonly disableHoverableContent: Accessor<boolean>;
  /** The base id the content's id derives from. Call it to read the value. */
  readonly id: Accessor<string>;
  /** The id of the content, which the trigger's `aria-describedby` names while open. Call it to read the value. */
  readonly contentId: Accessor<string>;
  /** The trigger element, or `undefined` before it mounts. Call it to read the value. */
  readonly trigger: Accessor<HTMLElement | undefined>;
  readonly setTrigger: (element: HTMLElement | undefined) => void;
  /** The pointer moved onto the trigger: open after the delay, or at once inside the skip window. */
  readonly onTriggerEnter: () => void;
  /** The pointer left the trigger. */
  readonly onTriggerLeave: () => void;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  /** Keeps the portal alive while content is still animating out; returns the release function. */
  readonly hold: () => () => void;
  readonly held: Accessor<boolean>;
}

/**
 * The context of {@link TooltipRoot}. A part reads it with `tooltipContext.use("Tooltip.Part")`,
 * which throws `[primitives] <Tooltip.Part> must be used within <Tooltip>.` outside a tooltip.
 * @example
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 * import { type TooltipContextValue, tooltipContext } from "@shadow-js/primitives";
 *
 * export function TooltipStatus(): JsxChild {
 *   const state: TooltipContextValue = tooltipContext.use("Tooltip.Status");
 *   return <span>{state.open() ? "open" : "closed"}</span>;
 * }
 * @see {@link TooltipContextValue}
 * @since 1.0.0
 */
export const tooltipContext: PartContext<TooltipContextValue> =
  createPartContext<TooltipContextValue>("Tooltip");

/**
 * Builds the state every tooltip part shares: the open state, the trigger reference, the ids, and
 * the timer that opens the tooltip after the delay. Inside a {@link TooltipProvider} the tooltip
 * joins that delay group; outside one it forms its own. Call it inside a component.
 *
 * @param props See {@link TooltipProps}.
 * @returns The state that the parts read.
 * @example
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 * import { createTooltipContext, type TooltipProps } from "@shadow-js/primitives";
 *
 * export function TooltipState(props: TooltipProps): JsxChild {
 *   const state = createTooltipContext(props);
 *   return <span>{state.open() ? "open" : "closed"}</span>;
 * }
 * @see {@link TooltipRoot}
 * @since 1.0.0
 */
export function createTooltipContext(props: TooltipProps): TooltipContextValue {
  // Without a provider the tooltip is its own delay group: it still works, it just cannot share the skip window.
  const group = tooltipGroupContext.useOptional() ?? createTooltipGroup({});
  const base = useBaseId(() => props.id);
  const [trigger, setTrigger] = useSignal<HTMLElement | undefined>(undefined);
  const [wasOpenDelayed, setWasOpenDelayed] = useSignal(false);
  const [holds, setHolds] = useSignal(0);
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  const clearOpenTimer = (): void => {
    if (openTimer !== undefined) clearTimeout(openTimer);
    openTimer = undefined;
  };
  onCleanup(clearOpenTimer);

  const [open, setOpenState] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => (next) => {
      if (next) {
        group.onOpen();
        // Only one tooltip is visible at a time: the others close when this one opens.
        document.dispatchEvent(new CustomEvent(TOOLTIP_OPEN_EVENT, { detail: base() }));
      } else {
        group.onClose();
      }
      props.onOpenChange?.(next);
    },
    name: "Tooltip open",
  });

  const delayDuration = (): number => props.delayDuration ?? group.delayDuration();
  const disableHoverableContent = (): boolean =>
    props.disableHoverableContent ?? group.disableHoverableContent();

  const handleOpen = (): void => {
    clearOpenTimer();
    setWasOpenDelayed(false);
    setOpenState(true);
  };
  const handleClose = (): void => {
    clearOpenTimer();
    setOpenState(false);
  };
  const handleDelayedOpen = (): void => {
    clearOpenTimer();
    openTimer = setTimeout(() => {
      setWasOpenDelayed(true);
      setOpenState(true);
      openTimer = undefined;
    }, delayDuration());
  };

  return {
    open,
    stateAttribute: () =>
      open() ? (wasOpenDelayed() ? "delayed-open" : "instant-open") : "closed",
    group,
    disableHoverableContent,
    id: base,
    contentId: () => partId(base(), "content"),
    trigger,
    setTrigger: (element) => setTrigger(() => element),
    onTriggerEnter() {
      if (group.isOpenDelayed()) handleDelayedOpen();
      else handleOpen();
    },
    onTriggerLeave() {
      // With hoverable content the pointer may be on its way to it: the grace area decides.
      if (disableHoverableContent()) handleClose();
      else clearOpenTimer();
    },
    onOpen: handleOpen,
    onClose: handleClose,
    hold() {
      setHolds((count) => count + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        setHolds((count) => count - 1);
      };
    },
    held: () => holds() > 0,
  };
}
