import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { createDialogContext, type DialogProps, dialogContext } from "./context";

/**
 * Root of a dialog: holds the open state and provides it to the parts. It renders no element.
 * Controlled with `open` / `onOpenChange`, or uncontrolled with `defaultOpen`.
 *
 * Follows the WAI-ARIA modal dialog pattern: focus moves into the dialog on open, Tab and
 * Shift+Tab cycle inside a modal, Escape closes the top dialog, and focus returns to the trigger on
 * close. Keys: Enter and Space activate the trigger and the close button (native buttons).
 *
 * @param props See {@link DialogProps}.
 * @returns The context provider around the parts; the root renders no element of its own.
 * @see {@link Dialog}
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function EditProfile() {
 *   return (
 *     <Dialog>
 *       <Dialog.Trigger>Edit profile</Dialog.Trigger>
 *       <Dialog.Portal>
 *         <Dialog.Overlay />
 *         <Dialog.Content>
 *           <Dialog.Title>Edit profile</Dialog.Title>
 *           <Dialog.Description>Make changes to your profile here.</Dialog.Description>
 *           <Dialog.Close>Done</Dialog.Close>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @since 1.0.0
 */
export function DialogRoot(props: DialogProps): JsxChild {
  const context = createDialogContext(props, "dialog", () => props.modal !== false);
  return <dialogContext.Provider value={context}>{props.children}</dialogContext.Provider>;
}
