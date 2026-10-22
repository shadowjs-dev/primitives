import { type Accessor, mergeProps, splitProps, untrack, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createDialogContext,
  DialogClose,
  type DialogCloseProps,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
  dialogContext,
} from "../dialog/index";
import {
  callHandler,
  composeRefs,
  createPartContext,
  type PartContext,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";

/**
 * Props of {@link AlertDialog}: the dialog's props without `modal` (an alert dialog is always
 * modal). Accessibility and data attributes are those of {@link DialogProps}, with
 * `role="alertdialog"` on the content.
 * @see {@link AlertDialog}
 * @since 1.0.0
 */
export type AlertDialogProps = Omit<DialogProps, "modal">;

interface AlertContextValue {
  readonly cancel: Accessor<HTMLElement | undefined>;
  readonly setCancel: (element: HTMLElement | undefined) => void;
}

const alertContext: PartContext<AlertContextValue> =
  createPartContext<AlertContextValue>("AlertDialog");

/**
 * Root of an alert dialog: a modal dialog with `role="alertdialog"` that interrupts the user
 * with a message needing a response. It cannot be dismissed by pressing outside, and focus
 * starts on `AlertDialog.Cancel` (the least destructive action), per the WAI-ARIA alert dialog
 * pattern. Escape still closes it, and focus returns to the trigger. Keys: Enter and Space activate
 * the trigger, Cancel and Action (native buttons); Tab and Shift+Tab cycle inside the dialog. ARIA:
 * `role="alertdialog"` with `aria-modal="true"`, named by the title and described by the description.
 *
 * @param props See {@link AlertDialogProps}.
 * @returns The context provider around the parts; the root renders no element of its own.
 * @see {@link AlertDialog}
 * @example
 * import { AlertDialog } from "@shadow-js/primitives";
 *
 * export function DeleteAccount() {
 *   return (
 *     <AlertDialog>
 *       <AlertDialog.Trigger>Delete</AlertDialog.Trigger>
 *       <AlertDialog.Portal>
 *         <AlertDialog.Overlay />
 *         <AlertDialog.Content>
 *           <AlertDialog.Title>Delete account?</AlertDialog.Title>
 *           <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
 *           <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
 *           <AlertDialog.Action>Delete</AlertDialog.Action>
 *         </AlertDialog.Content>
 *       </AlertDialog.Portal>
 *     </AlertDialog>
 *   );
 * }
 * @since 1.0.0
 */
export function AlertDialogRoot(props: AlertDialogProps): JsxChild {
  const context = createDialogContext(props, "alertdialog", () => true);
  const [cancel, setCancel] = useSignal<HTMLElement | undefined>(undefined);
  return (
    <dialogContext.Provider value={context}>
      <alertContext.Provider value={{ cancel, setCancel: (element) => setCancel(() => element) }}>
        {props.children}
      </alertContext.Provider>
    </dialogContext.Provider>
  );
}

/**
 * Props of {@link AlertDialogContent}.
 * @see {@link AlertDialogContent}
 * @since 1.0.0
 */
export type AlertDialogContentProps<T extends PolymorphicTarget = "div"> = DialogContentProps<T>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The alert dialog's content: focus starts on `AlertDialog.Cancel`, and pressing or focusing
 * outside never dismisses it (an application `preventDefault()` cannot re-enable that). Escape
 * still closes it. Accessibility: `role="alertdialog"` with `aria-modal="true"`; the rest of the
 * page is hidden from assistive technology. Data attributes: `data-state`.
 *
 * @param props See {@link AlertDialogContentProps}.
 * @returns The rendered content, or nothing while it is unmounted.
 * @see {@link AlertDialog}
 * @example
 * import { AlertDialog } from "@shadow-js/primitives";
 *
 * export function ConfirmContent() {
 *   return (
 *     <AlertDialog defaultOpen>
 *       <AlertDialog.Portal>
 *         <AlertDialog.Content class="fixed inset-0">
 *           <AlertDialog.Title>Discard changes?</AlertDialog.Title>
 *           <AlertDialog.Cancel>Keep editing</AlertDialog.Cancel>
 *           <AlertDialog.Action>Discard</AlertDialog.Action>
 *         </AlertDialog.Content>
 *       </AlertDialog.Portal>
 *     </AlertDialog>
 *   );
 * }
 * @since 1.0.0
 */
export function AlertDialogContent<T extends PolymorphicTarget = "div">(
  props: AlertDialogContentProps<T>,
): JsxChild {
  const alert = alertContext.use("AlertDialog.Content");
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "onOpenAutoFocus",
    "onPointerDownOutside",
    "onInteractOutside",
  ]);
  const content = DialogContent as (props: Record<string, unknown>) => JsxChild;
  return content(
    mergeProps(rest, {
      get onOpenAutoFocus() {
        return (event: Event): void => {
          callHandler(own.onOpenAutoFocus, event);
          if (event.defaultPrevented) return;
          const cancel = untrack(alert.cancel);
          if (cancel === undefined) return;
          event.preventDefault();
          cancel.focus({ preventScroll: true });
        };
      },
      get onPointerDownOutside() {
        return (event: Event): void => {
          callHandler(own.onPointerDownOutside, event);
          event.preventDefault();
        };
      },
      get onInteractOutside() {
        return (event: Event): void => {
          callHandler(own.onInteractOutside, event);
          event.preventDefault();
        };
      },
    }),
  );
}

/**
 * Props of {@link AlertDialogCancel}.
 * @see {@link AlertDialogCancel}
 * @since 1.0.0
 */
export type AlertDialogCancelProps<T extends PolymorphicTarget = "button"> = DialogCloseProps<T>;

/**
 * Closes the dialog without taking the action. It receives initial focus when the content opens.
 * Keyboard: Enter and Space activate it (a native button click). ARIA: it sets no ARIA attributes of
 * its own. Renders a `button` with `type="button"`.
 *
 * @param props See {@link AlertDialogCancelProps}.
 * @returns The rendered button.
 * @see {@link AlertDialog}
 * @example
 * import { AlertDialog } from "@shadow-js/primitives";
 *
 * export function KeepAccount() {
 *   return (
 *     <AlertDialog defaultOpen>
 *       <AlertDialog.Portal>
 *         <AlertDialog.Content>
 *           <AlertDialog.Title>Delete account?</AlertDialog.Title>
 *           <AlertDialog.Cancel>Keep my account</AlertDialog.Cancel>
 *         </AlertDialog.Content>
 *       </AlertDialog.Portal>
 *     </AlertDialog>
 *   );
 * }
 * @since 1.0.0
 */
export function AlertDialogCancel<T extends PolymorphicTarget = "button">(
  props: AlertDialogCancelProps<T>,
): JsxChild {
  const alert = alertContext.use("AlertDialog.Cancel");
  const [own, rest] = splitProps(partProps<Loose>(props), ["ref"]);
  const close = DialogClose as (props: Record<string, unknown>) => JsxChild;
  return close(
    mergeProps(rest, {
      ref: composeRefs<HTMLElement>(
        own["ref"] as ((element: HTMLElement) => void) | undefined,
        (element) => alert.setCancel(element),
      ),
    }),
  );
}

/**
 * Props of {@link AlertDialogAction}.
 * @see {@link AlertDialogAction}
 * @since 1.0.0
 */
export type AlertDialogActionProps<T extends PolymorphicTarget = "button"> = DialogCloseProps<T>;

/**
 * The confirming action. It closes the dialog; run the action itself from `onClick`. Keyboard:
 * Enter and Space activate it (a native button click). ARIA: it sets no ARIA attributes of its own.
 * Renders a `button` with `type="button"`.
 *
 * @param props See {@link AlertDialogActionProps}.
 * @returns The rendered button.
 * @see {@link AlertDialog}
 * @example
 * import { AlertDialog } from "@shadow-js/primitives";
 *
 * export function ConfirmDelete() {
 *   const deleteAccount = (): void => {
 *     // Perform the destructive action here.
 *   };
 *   return (
 *     <AlertDialog defaultOpen>
 *       <AlertDialog.Portal>
 *         <AlertDialog.Content>
 *           <AlertDialog.Title>Delete account?</AlertDialog.Title>
 *           <AlertDialog.Action onClick={deleteAccount}>Delete</AlertDialog.Action>
 *         </AlertDialog.Content>
 *       </AlertDialog.Portal>
 *     </AlertDialog>
 *   );
 * }
 * @since 1.0.0
 */
export function AlertDialogAction<T extends PolymorphicTarget = "button">(
  props: AlertDialogActionProps<T>,
): JsxChild {
  return (DialogClose as (props: Record<string, unknown>) => JsxChild)(
    partProps<Record<string, unknown>>(props),
  );
}

/**
 * The alert dialog primitive: `AlertDialog`, `AlertDialog.Trigger`, `AlertDialog.Portal`,
 * `AlertDialog.Overlay`, `AlertDialog.Content`, `AlertDialog.Title`, `AlertDialog.Description`,
 * `AlertDialog.Cancel` and `AlertDialog.Action`. It is a modal dialog with `role="alertdialog"`:
 * pressing outside never dismisses it, focus starts on `Cancel`, and Escape closes it. Keys: Enter
 * and Space activate the trigger, Cancel and Action; Tab and Shift+Tab cycle inside the dialog.
 * ARIA: `aria-modal="true"`, named by the title and described by the description.
 *
 * @example
 * import { AlertDialog } from "@shadow-js/primitives";
 *
 * export function ConfirmReset() {
 *   return (
 *     <AlertDialog>
 *       <AlertDialog.Trigger>Reset</AlertDialog.Trigger>
 *       <AlertDialog.Portal>
 *         <AlertDialog.Overlay />
 *         <AlertDialog.Content>
 *           <AlertDialog.Title>Reset settings?</AlertDialog.Title>
 *           <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
 *           <AlertDialog.Action>Reset</AlertDialog.Action>
 *         </AlertDialog.Content>
 *       </AlertDialog.Portal>
 *     </AlertDialog>
 *   );
 * }
 * @see {@link AlertDialogRoot}
 * @since 1.0.0
 */
export const AlertDialog: typeof AlertDialogRoot & {
  readonly Trigger: typeof DialogTrigger;
  readonly Portal: typeof DialogPortal;
  readonly Overlay: typeof DialogOverlay;
  readonly Content: typeof AlertDialogContent;
  readonly Title: typeof DialogTitle;
  readonly Description: typeof DialogDescription;
  readonly Cancel: typeof AlertDialogCancel;
  readonly Action: typeof AlertDialogAction;
} = Object.assign((props: AlertDialogProps) => AlertDialogRoot(props), {
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: AlertDialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Cancel: AlertDialogCancel,
  Action: AlertDialogAction,
});
