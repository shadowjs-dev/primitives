import { type Accessor, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createPartContext,
  type PartContext,
  type PartRegistration,
  partId,
  useBaseId,
  useControllableState,
  usePartRegistration,
} from "../utils/index";

/**
 * Props of {@link Popover}: the root holds the open state and renders no element.
 *
 * Accessibility: the trigger is a button with `aria-haspopup="dialog"` and `aria-expanded`; the content
 * is a `role="dialog"` labeled by the title and described by the description when those are
 * rendered. Focus moves into the content on open and back to the trigger on close. Modal mode
 * (`modal`) adds `aria-modal="true"` on the content. Data attributes: `data-state` (`"open"` or
 * `"closed"`) on the trigger and the content.
 * @since 1.0.0
 * @see {@link Popover}
 */
export interface PopoverProps {
  /**
   * Controlled open state. The popover opens and closes only when the application changes this.
   * @default none (uncontrolled)
   */
  readonly open?: boolean | undefined;
  /**
   * Initial open state when uncontrolled.
   * @default false
   */
  readonly defaultOpen?: boolean | undefined;
  /**
   * Called when the popover asks to open or close (a trigger click, Escape, an outside press, a
   * `Popover.Close`).
   * @default none
   */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * A modal popover traps focus, locks page scroll, hides the rest of the page from assistive
   * technology and blocks pointer events outside.
   * @default false
   */
  readonly modal?: boolean | undefined;
  /**
   * Base id; the ids of the parts derive from it. Generated when omitted, and the same on the server
   * and the client.
   * @default none (generated)
   */
  readonly id?: string | undefined;
  /**
   * The parts of the popover: the trigger, the portal (or the content), the anchor and the rest.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/**
 * What every popover part reads from its root. @internal
 * @see {@link Popover}
 */
export interface PopoverContextValue {
  readonly open: Accessor<boolean>;
  readonly setOpen: (open: boolean) => void;
  readonly modal: Accessor<boolean>;
  readonly triggerId: Accessor<string>;
  readonly contentId: Accessor<string>;
  readonly titleId: Accessor<string>;
  readonly descriptionId: Accessor<string>;
  readonly trigger: Accessor<HTMLElement | undefined>;
  readonly setTrigger: (element: HTMLElement | undefined) => void;
  readonly title: PartRegistration;
  readonly description: PartRegistration;
  /** Keeps the portal alive while content is still animating out; returns the release function. */
  readonly hold: () => () => void;
  /** Whether any content is being held. Tracked. */
  readonly held: Accessor<boolean>;
}

/**
 * The context the popover root provides to its parts. Read it only to build a custom part of a
 * popover; `use` throws when the part is outside a `Popover`.
 * @since 1.0.0
 * @example
 * import { popoverContext } from "@shadow-js/primitives";
 *
 * export function PopoverStateLabel() {
 *   const popover = popoverContext.use("PopoverStateLabel");
 *   return <span>{popover.open() ? "Open" : "Closed"}</span>;
 * }
 * @see {@link PopoverContextValue}
 */
export const popoverContext: PartContext<PopoverContextValue> =
  createPartContext<PopoverContextValue>("Popover");

/**
 * Builds the state every popover part shares. @internal
 * @see {@link Popover}
 */
export function createPopoverContext(
  props: PopoverProps,
  modal: () => boolean,
): PopoverContextValue {
  const [open, setOpenState] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => props.onOpenChange,
    name: "Popover open",
  });
  const base = useBaseId(() => props.id);
  const [trigger, setTrigger] = useSignal<HTMLElement | undefined>(undefined);
  const [holds, setHolds] = useSignal(0);
  return {
    open,
    setOpen: (next) => setOpenState(next),
    modal,
    triggerId: () => partId(base(), "trigger"),
    contentId: () => partId(base(), "content"),
    titleId: () => partId(base(), "title"),
    descriptionId: () => partId(base(), "description"),
    trigger,
    setTrigger: (element) => setTrigger(() => element),
    title: usePartRegistration(),
    description: usePartRegistration(),
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
