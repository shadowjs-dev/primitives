import { type Accessor, onCleanup, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { createPartContext, type PartContext, useControllableState } from "../utils/index";

/**
 * Props of {@link HoverCard}.
 *
 * Accessibility: the card sets no ARIA attributes and no role. It is supplementary content for
 * pointer users, not a dialog, so it is not announced and does not trap focus. The trigger and the
 * content carry `data-state="open" | "closed"`. The mouse or a pen opens the card after `openDelay`
 * and closes it after `closeDelay`; keyboard focus does the same. Touch never opens it. Escape and
 * a press outside close it at once.
 * @since 1.0.0
 * @see {@link HoverCardRoot}
 */
export interface HoverCardProps {
  /** Controlled open state. @default none */
  readonly open?: boolean | undefined;
  /** Initial open state when uncontrolled. @default `false` */
  readonly defaultOpen?: boolean | undefined;
  /** Called when the card asks to open or close. @default none */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** How long the pointer (or focus) must stay on the trigger before the card opens, in ms. @default `700` */
  readonly openDelay?: number | undefined;
  /** How long the pointer (or focus) must stay away from trigger and card before it closes, in ms. @default `300` */
  readonly closeDelay?: number | undefined;
  /** The `HoverCard.Trigger`, `HoverCard.Portal` and any other parts. @default none */
  readonly children?: JsxChild | undefined;
}

/**
 * What every hover card part reads from its root. @internal
 * @since 1.0.0
 * @see {@link HoverCardRoot}
 */
export interface HoverCardContextValue {
  readonly open: Accessor<boolean>;
  readonly trigger: Accessor<HTMLElement | undefined>;
  readonly setTrigger: (element: HTMLElement | undefined) => void;
  /** The mounted card element, if the card is mounted. */
  readonly content: Accessor<HTMLElement | undefined>;
  readonly setContent: (element: HTMLElement | undefined) => void;
  /** Ask to open after `openDelay`; cancels a pending close. */
  readonly onOpen: () => void;
  /** Ask to close after `closeDelay`, unless text is being selected in the card. */
  readonly onClose: () => void;
  /** Close at once (Escape, press outside). */
  readonly onDismiss: () => void;
  /** Selection bookkeeping of the content, read at event time. */
  readonly selection: { hasSelection: boolean; isPointerDownOnContent: boolean };
  readonly hold: () => () => void;
  readonly held: Accessor<boolean>;
}

/**
 * The context every `HoverCard` part reads from its root. Call `hoverCardContext.use(name)` in a
 * part that must only exist inside a `HoverCard`; it throws when there is none.
 *
 * @example
 * import { hoverCardContext } from "@shadow-js/primitives";
 *
 * export function OpenState() {
 *   const context = hoverCardContext.use("OpenState");
 *   return <span>{context.open() ? "Card open" : "Card closed"}</span>;
 * }
 * @since 1.0.0
 * @see {@link HoverCardRoot}
 */
export const hoverCardContext: PartContext<HoverCardContextValue> =
  createPartContext<HoverCardContextValue>("HoverCard");

/**
 * The default time the pointer must rest on the trigger before the card opens, in ms.
 *
 * @example
 * import { DEFAULT_OPEN_DELAY } from "@shadow-js/primitives";
 *
 * // Half the default, for a card that should open sooner.
 * export const fastOpenDelay: number = DEFAULT_OPEN_DELAY / 2;
 * @since 1.0.0
 * @see {@link HoverCardProps}
 */
export const DEFAULT_OPEN_DELAY = 700;
/**
 * The default time the pointer must stay away before the card closes, in ms.
 *
 * @example
 * import { DEFAULT_CLOSE_DELAY } from "@shadow-js/primitives";
 *
 * // Twice the default, for a card that stays open while the pointer wanders.
 * export const slowCloseDelay: number = DEFAULT_CLOSE_DELAY * 2;
 * @since 1.0.0
 * @see {@link HoverCardProps}
 */
export const DEFAULT_CLOSE_DELAY = 300;

/**
 * Builds the state every hover card part shares. Timers die with the owner.
 *
 * @param props The props of the root; `open`, `defaultOpen`, `onOpenChange`, `openDelay` and
 * `closeDelay` are read from it.
 * @returns The shared state: open flag, trigger and content elements, timers and holds.
 * @since 1.0.0
 * @see {@link HoverCardRoot}
 * @internal
 */
export function createHoverCardContext(props: HoverCardProps): HoverCardContextValue {
  const [open, setOpen] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => props.onOpenChange,
    name: "HoverCard open",
  });
  const [trigger, setTrigger] = useSignal<HTMLElement | undefined>(undefined);
  const [content, setContent] = useSignal<HTMLElement | undefined>(undefined);
  const [holds, setHolds] = useSignal(0);
  const selection = { hasSelection: false, isPointerDownOnContent: false };
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const clearTimers = (): void => {
    if (openTimer !== undefined) clearTimeout(openTimer);
    if (closeTimer !== undefined) clearTimeout(closeTimer);
    openTimer = undefined;
    closeTimer = undefined;
  };
  onCleanup(clearTimers);
  return {
    open,
    trigger,
    setTrigger: (element) => setTrigger(() => element),
    content,
    setContent: (element) => setContent(() => element),
    onOpen() {
      if (closeTimer !== undefined) clearTimeout(closeTimer);
      closeTimer = undefined;
      if (openTimer !== undefined) clearTimeout(openTimer);
      openTimer = undefined;
      // Already open: only the pending close needed canceling.
      if (open()) return;
      openTimer = setTimeout(() => {
        openTimer = undefined;
        setOpen(true);
      }, props.openDelay ?? DEFAULT_OPEN_DELAY);
    },
    onClose() {
      if (openTimer !== undefined) clearTimeout(openTimer);
      openTimer = undefined;
      if (selection.hasSelection || selection.isPointerDownOnContent) return;
      if (closeTimer !== undefined) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        closeTimer = undefined;
        setOpen(false);
      }, props.closeDelay ?? DEFAULT_CLOSE_DELAY);
    },
    onDismiss() {
      clearTimers();
      setOpen(false);
    },
    selection,
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
