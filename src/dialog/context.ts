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
 * Props of {@link Dialog} (and of `AlertDialog`, which fixes `modal` and `role`).
 *
 * Accessibility: the WAI-ARIA modal dialog pattern. The content is `role="dialog"` (or
 * `alertdialog`) with `aria-modal` when modal, named by the title and described by the description
 * while those are mounted. Focus moves into the dialog on open, Tab and Shift+Tab cycle inside a
 * modal, Escape closes the top dialog, and focus returns to the trigger on close. The trigger has
 * `aria-haspopup="dialog"` and `aria-expanded`. Data attributes: `data-state` (`"open"` or
 * `"closed"`) on the trigger, the overlay and the content; the root renders no element.
 * @see {@link Dialog}
 * @since 1.0.0
 */
export interface DialogProps {
  /** Controlled open state. `undefined` keeps the dialog uncontrolled. @default none */
  readonly open?: boolean | undefined;
  /** Initial open state when uncontrolled. @default false */
  readonly defaultOpen?: boolean | undefined;
  /** Called with the requested open state when the dialog asks to open or close (a trigger, Escape, an outside press or `Dialog.Close`). The `open` prop decides the actual state. @default none */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Modal dialogs trap focus, lock page scroll, hide the rest of the page from assistive
   * technology and block pointer events outside. A non-modal dialog renders no overlay and leaves
   * the page alone. @default true
   */
  readonly modal?: boolean | undefined;
  /** Base id; the ids of the parts derive from it. @default none (generated) */
  readonly id?: string | undefined;
  /** The dialog's parts (`Dialog.Trigger`, `Dialog.Portal`, ...). @default none */
  readonly children?: JsxChild | undefined;
}

/**
 * What every dialog part reads from its root. @internal
 * @see {@link Dialog}
 */
export interface DialogContextValue {
  readonly open: Accessor<boolean>;
  readonly setOpen: (open: boolean) => void;
  readonly modal: Accessor<boolean>;
  readonly role: "dialog" | "alertdialog";
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
 * The context a `Dialog` root provides to its parts. Read it in a custom part rendered inside the
 * root; reading it anywhere else throws. Accessibility: the context carries no ARIA of its own; the
 * built-in parts use it for the ids that `aria-labelledby`, `aria-describedby` and `aria-controls`
 * point at.
 *
 * @example
 * import { dialogContext } from "@shadow-js/primitives";
 *
 * export function OpenState() {
 *   const root = dialogContext.use("OpenState");
 *   return <span>{root.open() ? "open" : "closed"}</span>;
 * }
 * @see {@link Dialog}
 * @since 1.0.0
 */
export const dialogContext: PartContext<DialogContextValue> =
  createPartContext<DialogContextValue>("Dialog");

/**
 * Builds the state every dialog root shares; `role` distinguishes the alert dialog. @internal
 * @see {@link Dialog}
 */
export function createDialogContext(
  props: DialogProps,
  role: "dialog" | "alertdialog",
  modal: () => boolean,
): DialogContextValue {
  const [open, setOpenState] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => props.onOpenChange,
    name: "Dialog open",
  });
  const base = useBaseId(() => props.id);
  const [trigger, setTrigger] = useSignal<HTMLElement | undefined>(undefined);
  const [holds, setHolds] = useSignal(0);
  return {
    open,
    setOpen: (next) => setOpenState(next),
    modal,
    role,
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
