import { onCleanup, onMount, splitProps, untrack, useEffect, useSignal } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  callHandler,
  composeRefs,
  DismissableLayer,
  type FocusOutsideEvent,
  hideOthers,
  lockScroll,
  mergeElementProps,
  type PointerDownOutsideEvent,
  type PolymorphicProps,
  type PolymorphicTarget,
  useDirection,
  useFocusScope,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  directionAbove,
  langAbove,
  portalDirAttribute,
  portalLangAttribute,
} from "../utils/portal-direction";
import { dialogContext } from "./context";

/**
 * Own props of {@link DialogContent}.
 *
 * Accessibility: `role="dialog"` (or `alertdialog` under `AlertDialog`), `tabindex="-1"`, and
 * `aria-modal="true"` when the dialog is modal. `aria-labelledby` names it through `Dialog.Title`
 * and `aria-describedby` points at `Dialog.Description`, each only while that part is mounted. In a
 * modal, Tab and Shift+Tab cycle inside it and focus that escapes is pulled back. Escape and the
 * outside events dismiss the top dialog unless the application calls `preventDefault()`. Data
 * attributes: `data-state` (`"open"` or `"closed"`). In development, a content with no accessible
 * name (no title, `aria-label` or `aria-labelledby`) logs a `DIALOG_LABEL` warning.
 * @see {@link DialogContent}
 * @since 1.0.0
 */
export interface DialogContentOwnProps {
  /** Keep the content mounted while closed (for animation libraries). @default false */
  readonly forceMount?: boolean | undefined;
  /** Focus is about to move into the dialog. `preventDefault()` to focus something yourself. @default none */
  readonly onOpenAutoFocus?: ((event: Event) => void) | undefined;
  /** Focus is about to return to the trigger. `preventDefault()` to focus something yourself. @default none */
  readonly onCloseAutoFocus?: ((event: Event) => void) | undefined;
  /** Escape was pressed. `preventDefault()` keeps the dialog open. @default none */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /** A pointer press happened outside the content. `preventDefault()` keeps the dialog open. @default none */
  readonly onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
  /** Focus moved outside the content. `preventDefault()` keeps the dialog open. @default none */
  readonly onFocusOutside?: ((event: FocusOutsideEvent) => void) | undefined;
  /** Pointer press or focus outside. `preventDefault()` keeps the dialog open. @default none */
  readonly onInteractOutside?:
    | ((event: PointerDownOutsideEvent | FocusOutsideEvent) => void)
    | undefined;
}

/**
 * Props of {@link DialogContent}.
 * @see {@link DialogContent}
 * @since 1.0.0
 */
export type DialogContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  DialogContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** The own props the content reads, pulled out of the loose props. */
const OWN_KEYS = [
  "as",
  "forceMount",
  "onOpenAutoFocus",
  "onCloseAutoFocus",
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "onFocusOutside",
  "onInteractOutside",
  "children",
] as const;

/**
 * The dialog itself: `role="dialog"` (or `alertdialog`), labeled by `Dialog.Title` and described
 * by `Dialog.Description` while those exist. While open and modal it traps focus, locks page
 * scroll without a layout shift, hides everything else from assistive technology and blocks
 * pointer events outside. It stays mounted until its exit animation ends. Keys: Tab and Shift+Tab
 * cycle inside a modal; Escape closes the top dialog. ARIA: `role`, `aria-modal`, `aria-labelledby`,
 * `aria-describedby`, `tabindex="-1"`.
 *
 * @param props See {@link DialogContentProps}.
 * @returns The rendered dialog, or nothing while it is unmounted.
 * @see {@link Dialog}
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function GuardedDialog() {
 *   const unsaved = true;
 *   return (
 *     <Dialog defaultOpen>
 *       <Dialog.Portal>
 *         <Dialog.Content
 *           onEscapeKeyDown={(event: KeyboardEvent) => {
 *             if (unsaved) event.preventDefault();
 *           }}
 *         >
 *           <Dialog.Title>Discard changes?</Dialog.Title>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @since 1.0.0
 */
export function DialogContent<T extends PolymorphicTarget = "div">(
  props: DialogContentProps<T>,
): JsxChild {
  const context = dialogContext.use("Dialog.Content");
  const [own, rest] = splitProps(partProps<Loose & DialogContentOwnProps>(props), OWN_KEYS);
  const presence = usePresence(() => context.open() || own.forceMount === true);
  return (
    <Show when={presence.mounted()}>
      <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
    </Show>
  );
}

interface ContentLayerProps {
  readonly own: Loose & DialogContentOwnProps;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

/**
 * Development check that the dialog has a name: a Dialog.Title in its DOM, or the application's
 * aria-label or aria-labelledby. A Dialog.Title registers its id in its own mount hook, which can
 * run after this one in the same flush, so the check waits a microtask for that flush to finish.
 * It warns once per mounted content, and not at all when the content was unmounted in the meantime.
 */
function DialogNameCheck(props: { readonly node: () => HTMLElement | undefined }): JsxChild {
  const context = dialogContext.use("Dialog.Content");
  onMount(() => {
    const element = untrack(props.node);
    if (element === undefined) return;
    queueMicrotask(() => {
      if (!element.isConnected) return;
      if (element.hasAttribute("aria-label") || element.hasAttribute("aria-labelledby")) return;
      if (element.querySelector(`[id="${untrack(context.titleId)}"]`) !== null) return;
      console.warn(
        "[primitives DIALOG_LABEL] <Dialog.Content> has no accessible name. Render a <Dialog.Title> or pass aria-label or aria-labelledby.",
      );
    });
  });
  return null;
}

/** The mounted part of the content: everything here lives exactly as long as the element. */
function ContentLayer(layer: ContentLayerProps): JsxChild {
  const context = dialogContext.use("Dialog.Content");
  const { own } = layer;
  const [node, setNode] = useSignal<HTMLElement | undefined>(undefined);
  // Registered after mount: a signal must not be written while the branch that builds this part computes.
  onMount(() => context.hold());

  // Modal side effects live as long as the content is mounted, so the page does not jump while it fades out.
  useEffect(() => {
    if (!context.modal()) return;
    onCleanup(lockScroll());
  });
  useFocusScope({
    container: node,
    onActivated: (element) => (context.modal() ? hideOthers(element) : undefined),
    trapped: () => context.modal(),
    loop: () => context.modal(),
    enabled: () => context.open(),
    onMountAutoFocus: () => (event) => callHandler(own.onOpenAutoFocus, event),
    onUnmountAutoFocus: () => (event) => {
      callHandler(own.onCloseAutoFocus, event);
      if (event.defaultPrevented) return;
      // Safari does not focus buttons on click, so the browser's own "previous focus" can be body.
      const trigger = untrack(context.trigger);
      if (trigger?.isConnected !== true) return; // No trigger (an `open` set by the application): the scope restores the previous focus.
      event.preventDefault();
      trigger.focus();
    },
  });

  const modal = context.modal;
  // The content renders in a portal: it takes the direction of the place the trigger sits in.
  const dir = useDirection(undefined, () => directionAbove(context.trigger()));
  const elementProps = mergeElementProps(
    {
      get dir() {
        return portalDirAttribute(dir());
      },
      get lang() {
        return portalLangAttribute(langAbove(context.trigger()));
      },
      get id() {
        return context.contentId();
      },
      get role() {
        return context.role;
      },
      // A getter: `modal` may change while the dialog is open, and the attribute must follow it.
      get "aria-modal"() {
        return modal() ? "true" : undefined;
      },
      get "aria-labelledby"() {
        return context.title.present() ? context.titleId() : undefined;
      },
      get "aria-describedby"() {
        return context.description.present() ? context.descriptionId() : undefined;
      },
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      tabindex: -1,
    },
    layer.rest,
    { ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => setNode(element)) },
  );

  return (
    <DismissableLayer
      as={own.as ?? "div"}
      {...elementProps}
      enabled={context.open()}
      disableOutsidePointerEvents={context.modal()}
      branches={() => (context.modal() ? [] : [context.trigger()])}
      onEscapeKeyDown={(event: KeyboardEvent) => callHandler(own.onEscapeKeyDown, event)}
      onPointerDownOutside={(event: PointerDownOutsideEvent) => {
        callHandler(own.onPointerDownOutside, event);
        if (event.defaultPrevented || !context.modal()) return;
        // A right click (or ctrl+click on macOS) opens the browser's menu; it must not close a modal.
        const original = event.detail.originalEvent;
        if (original.button === 2 || (original.button === 0 && original.ctrlKey)) {
          event.preventDefault();
        }
      }}
      onFocusOutside={(event: FocusOutsideEvent) => {
        callHandler(own.onFocusOutside, event);
        // The focus trap owns focus in a modal dialog.
        if (context.modal()) event.preventDefault();
      }}
      onInteractOutside={(event: PointerDownOutsideEvent | FocusOutsideEvent) => {
        callHandler(own.onInteractOutside, event);
      }}
      onDismiss={() => context.setOpen(false)}
    >
      {own["children"] as JsxChild}
      {__DEV__ ? <DialogNameCheck node={node} /> : null}
    </DismissableLayer>
  );
}
