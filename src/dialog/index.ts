import { DialogContent } from "./content";
import { DialogOverlay } from "./overlay";
import { DialogClose, DialogDescription, DialogTitle } from "./parts";
import { DialogPortal } from "./portal";
import { DialogRoot } from "./root";
import { DialogTrigger } from "./trigger";

export type { DialogContentOwnProps, DialogContentProps } from "./content";
export type { DialogContextValue, DialogProps } from "./context";
export { createDialogContext, dialogContext } from "./context";
export type { DialogOverlayProps } from "./overlay";
export type { DialogCloseProps, DialogDescriptionProps, DialogTitleProps } from "./parts";
export type { DialogPortalProps } from "./portal";
export type { DialogTriggerProps } from "./trigger";
export {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
};

/**
 * The dialog primitive: `Dialog`, `Dialog.Trigger`, `Dialog.Portal`, `Dialog.Overlay`,
 * `Dialog.Content`, `Dialog.Title`, `Dialog.Description` and `Dialog.Close`. Each part is also
 * exported by name (`DialogTrigger`, ...) for tree shaking. Keys: Enter and Space activate the
 * trigger and the close button; Tab and Shift+Tab cycle inside a modal; Escape closes the top
 * dialog. ARIA: `role="dialog"` (`aria-modal` when modal) named by the title and described by the
 * description; the trigger has `aria-haspopup`, `aria-expanded` and `aria-controls`.
 *
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function HelloDialog() {
 *   return (
 *     <Dialog>
 *       <Dialog.Trigger>Open</Dialog.Trigger>
 *       <Dialog.Portal>
 *         <Dialog.Overlay />
 *         <Dialog.Content>
 *           <Dialog.Title>Hello</Dialog.Title>
 *           <Dialog.Close>Close</Dialog.Close>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @see {@link DialogRoot}
 * @since 1.0.0
 */
export const Dialog: typeof DialogRoot & {
  readonly Trigger: typeof DialogTrigger;
  readonly Portal: typeof DialogPortal;
  readonly Overlay: typeof DialogOverlay;
  readonly Content: typeof DialogContent;
  readonly Title: typeof DialogTitle;
  readonly Description: typeof DialogDescription;
  readonly Close: typeof DialogClose;
} = Object.assign((props: Parameters<typeof DialogRoot>[0]) => DialogRoot(props), {
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});
