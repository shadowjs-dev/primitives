import { ToastAction, ToastClose, ToastDescription, ToastTitle } from "./parts";
import { ToastProvider } from "./provider";
import { ToastRoot } from "./root";
import { ToastViewport } from "./viewport";

export type { ToastContextValue, ToastProviderContextValue, ToastProviderProps } from "./context";
export {
  DEFAULT_SWIPE_THRESHOLD,
  DEFAULT_TOAST_DURATION,
  DEFAULT_TOAST_LABEL,
  toastContext,
  toastProviderContext,
} from "./context";
export type {
  ToastActionOwnProps,
  ToastActionProps,
  ToastCloseProps,
  ToastDescriptionProps,
  ToastTitleProps,
} from "./parts";
export type {
  ToastContent,
  Toaster,
  ToasterOptions,
  ToastItem,
  ToastOptions,
  ToastPatch,
  ToastPromiseHandle,
  ToastPromiseMessages,
  ToastType,
} from "./queue";
export { createToaster } from "./queue";
export type { ToastRootOwnProps, ToastRootProps, ToastSwipeEvent } from "./root";
export type { SwipeDirection, SwipePoint } from "./swipe";
export {
  getSwipeDelta,
  getSwipeMoveBuffer,
  hasLeftDeadZone,
  isDeltaInDirection,
  isHorizontalSwipe,
} from "./swipe";
export type { ToastViewportOwnProps, ToastViewportProps } from "./viewport";
export {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
};

/**
 * The toast primitive: `Toast.Provider`, `Toast.Viewport`, `Toast` (the root), `Toast.Title`, `Toast.Description`, `Toast.Action` and `Toast.Close`, plus {@link createToaster} for an imperative queue. Each part is also exported by name (`ToastViewport`, ...) for tree shaking.
 *
 * Keyboard: the hotkey (F8 by default) focuses the viewport region, Tab walks through the toasts, and Escape closes the focused toast. ARIA: the viewport is a `region` named "Notification (F8)" by default; each toast announces its text through a live region (`alert` for foreground, `status` for background), and its action and close buttons are replaced in that text by `altText` or left out.
 *
 * @example
 * import { Toast } from "@shadow-js/primitives";
 * import { useSignal } from "@shadow-js/core";
 *
 * export function SavedNotice() {
 *   const [open, setOpen] = useSignal(true);
 *   return (
 *     <Toast.Provider>
 *       <Toast open={open()} onOpenChange={setOpen}>
 *         <Toast.Title>Saved</Toast.Title>
 *         <Toast.Description>Your changes were saved.</Toast.Description>
 *         <Toast.Action altText="Undo the save">Undo</Toast.Action>
 *         <Toast.Close aria-label="Dismiss">x</Toast.Close>
 *       </Toast>
 *       <Toast.Viewport />
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link ToastRoot}
 * @see {@link createToaster}
 * @since 1.0.0
 */
export const Toast: typeof ToastRoot & {
  readonly Provider: typeof ToastProvider;
  readonly Viewport: typeof ToastViewport;
  readonly Title: typeof ToastTitle;
  readonly Description: typeof ToastDescription;
  readonly Action: typeof ToastAction;
  readonly Close: typeof ToastClose;
} = Object.assign((props: Parameters<typeof ToastRoot>[0]) => ToastRoot(props), {
  Provider: ToastProvider,
  Viewport: ToastViewport,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
});
