import { Portal, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { dialogContext } from "./context";

/**
 * Props of {@link DialogPortal}. Accessibility: none of its own; it only moves the overlay and the
 * content out of the page's flow, so the dialog is a direct child of the container.
 * @see {@link DialogPortal}
 * @since 1.0.0
 */
export interface DialogPortalProps {
  /** Where to render the dialog. @default document.body */
  readonly container?: Element | null | (() => Element | null | undefined);
  /** Keep the content mounted while closed (for animation libraries that control mounting). @default false */
  readonly forceMount?: boolean | undefined;
  /** The overlay and content to render in the container. @default none */
  readonly children?: JsxChild | undefined;
}

/** The element to render into: the application's container, or the body. */
function resolveContainer(container: DialogPortalProps["container"]): Element | null | undefined {
  if (container === undefined) return document.body;
  return typeof container === "function" ? container() : container;
}

/**
 * Renders the overlay and content into `document.body` (or `container`) while the dialog is open,
 * and keeps them there until their exit animation has finished. A dialog open at render time is
 * server-rendered too: its markup goes to the render's `portals` collector and the document emits it
 * at the end of `<body>` (see `createServerPortals`), and hydration adopts it. Keyboard: the portal
 * handles no keys. ARIA: it sets no role or ARIA attribute of its own; the overlay and content keep
 * the dialog's behavior.
 *
 * @param props See {@link DialogPortalProps}.
 * @returns The portal, or nothing while the dialog is closed and not held open by an exit animation.
 * @see {@link Dialog}
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function PortaledDialog() {
 *   return (
 *     <Dialog>
 *       <Dialog.Trigger>Open</Dialog.Trigger>
 *       <Dialog.Portal>
 *         <Dialog.Overlay />
 *         <Dialog.Content>
 *           <Dialog.Title>Hello</Dialog.Title>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @since 1.0.0
 */
export function DialogPortal(props: DialogPortalProps): JsxChild {
  const context = dialogContext.use("Dialog.Portal");
  return (
    <Show when={context.open() || context.held() || props.forceMount === true}>
      <Portal mount={() => resolveContainer(props.container)}>{props.children}</Portal>
    </Show>
  );
}
