import { onCleanup, onMount, splitProps, untrack, useEffect, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperContent, type PopperContentOwnProps } from "../popper/index";
import {
  callHandler,
  composeRefs,
  type FocusOutsideEvent,
  getTabbables,
  hideOthers,
  lockScroll,
  mergeElementProps,
  type PointerDownOutsideEvent,
  type PolymorphicProps,
  type PolymorphicTarget,
  useFocusScope,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { popoverContext } from "./context";
import { LayerElement } from "./layer-element";
import { whileMounted } from "./mounted";

/**
 * Own props of {@link PopoverContent}: the placement options of `PopperContent` (inherited, such as
 * `side`, `align` and `sideOffset`) plus the dismissal and focus hooks.
 *
 * Accessibility: `role="dialog"`; `aria-labelledby` names the `Popover.Title` and `aria-describedby`
 * the `Popover.Description` while those are rendered, otherwise give the content an `aria-label`.
 * `aria-modal="true"` in modal mode. Escape closes unless `onEscapeKeyDown` prevents it. Data
 * attributes: `data-state` (`"open"` or `"closed"`), `data-side` and `data-align` (the side and
 * alignment it ended up on after flipping), and the positioning CSS variables.
 * @since 1.0.0
 * @see {@link PopoverContent}
 */
export interface PopoverContentOwnProps extends PopperContentOwnProps {
  /**
   * Keep the content mounted while closed (for animation libraries that control the removal).
   * @default false
   */
  readonly forceMount?: boolean | undefined;
  /**
   * Focus is about to move into the popover. `preventDefault()` to focus something yourself.
   * @default none
   */
  readonly onOpenAutoFocus?: ((event: Event) => void) | undefined;
  /**
   * Focus is about to return to the trigger. `preventDefault()` to focus something yourself.
   * @default none
   */
  readonly onCloseAutoFocus?: ((event: Event) => void) | undefined;
  /**
   * Escape was pressed. `preventDefault()` keeps the popover open.
   * @default none
   */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /**
   * A pointer press happened outside the content. `preventDefault()` keeps the popover open.
   * @default none
   */
  readonly onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
  /**
   * Focus moved outside the content. `preventDefault()` keeps the popover open.
   * @default none
   */
  readonly onFocusOutside?: ((event: FocusOutsideEvent) => void) | undefined;
  /**
   * Pointer press or focus outside. `preventDefault()` keeps the popover open.
   * @default none
   */
  readonly onInteractOutside?:
    | ((event: PointerDownOutsideEvent | FocusOutsideEvent) => void)
    | undefined;
}

/**
 * Props of {@link PopoverContent}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link PopoverContentOwnProps}
 */
export type PopoverContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  PopoverContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** The own props the content reads itself; everything else (placement, attributes) passes through. */
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
 * The popover itself: `role="dialog"`, labeled by `Popover.Title` while that exists (otherwise
 * give it an `aria-label`), placed against the anchor by `PopperContent`. Non-modal by default:
 * focus moves in on open, Escape or a press or focus outside closes it, and the trigger counts as
 * inside so pressing it toggles instead of closing and reopening. With `modal` on the root it
 * traps focus, locks scroll, hides the rest of the page and blocks outside pointer events. It stays
 * mounted until its exit animation ends. The positioning engine's CSS variables
 * (`--primitives-available-width`, `--primitives-transform-origin`, ...) are available to it.
 *
 * Keys: in non-modal mode Tab moves through the content and, from its last control, on to what
 * follows the trigger (Shift+Tab from the first control returns to the trigger); in modal mode Tab
 * stays trapped inside. Escape closes it and returns focus to the trigger. ARIA: `role="dialog"`,
 * `aria-labelledby` and `aria-describedby` while the title and the description are rendered.
 *
 * @param props See {@link PopoverContentProps}.
 * @returns The `div` element while mounted, otherwise nothing.
 * @throws Error when rendered outside {@link PopoverRoot}.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function DetailsPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger>Details</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content side="bottom" align="start" sideOffset={8} aria-label="Details">
 *           <p>Shown below the trigger.</p>
 *           <Popover.Close>Close</Popover.Close>
 *         </Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverContentOwnProps}
 */
export function PopoverContent<T extends PolymorphicTarget = "div">(
  props: PopoverContentProps<T>,
): JsxChild {
  const context = popoverContext.use("Popover.Content");
  const [own, rest] = splitProps(partProps<Loose & PopoverContentOwnProps>(props), OWN_KEYS);
  const presence = usePresence(() => context.open() || own.forceMount === true);
  return whileMounted(presence.mounted, () => (
    <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
  ));
}

interface ContentLayerProps {
  readonly own: Loose & PopoverContentOwnProps;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

/** The mounted part of the content: everything here lives exactly as long as the element. */
function ContentLayer(layer: ContentLayerProps): JsxChild {
  const context = popoverContext.use("Popover.Content");
  const { own } = layer;
  const [node, setNode] = useSignal<HTMLElement | undefined>(undefined);
  // Set by an outside interaction: focus then belongs to whatever the user picked, not the trigger.
  let interactedOutside = false;
  // Registered after mount: a signal must not be written while the branch that builds this part computes.
  onMount(() => context.hold());

  useEffect(() => {
    if (!context.modal()) return;
    onCleanup(lockScroll());
  });

  const elementProps = mergeElementProps(
    {
      get id() {
        return context.contentId();
      },
      role: "dialog",
      get "aria-modal"() {
        return context.modal() ? "true" : undefined;
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
    {
      ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => setNode(element)),
      // `PopperContent` hands `style` over from `{ animation: "none" }` to `undefined` once placed,
      // and `undefined` removes the whole attribute, taking the layer's `pointer-events` with it.
      style: {},
    },
  );

  return (
    <PopperContent
      as={LayerElement}
      layerAs={own.as ?? "div"}
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
        // The focus trap owns focus in a modal popover.
        if (context.modal()) event.preventDefault();
      }}
      onInteractOutside={(event: PointerDownOutsideEvent | FocusOutsideEvent) => {
        callHandler(own.onInteractOutside, event);
        if (!event.defaultPrevented) interactedOutside = true;
      }}
      onDismiss={() => context.setOpen(false)}
    >
      <FocusManager
        node={node}
        own={own}
        interactedOutside={() => interactedOutside}
        resetInteraction={() => {
          interactedOutside = false;
        }}
      >
        {own["children"] as JsxChild}
      </FocusManager>
    </PopperContent>
  );
}

/** The first tabbable element after `trigger` in the page that is neither inside it nor inside `content`. */
function tabbableAfter(trigger: HTMLElement, content: HTMLElement): HTMLElement | undefined {
  return getTabbables(trigger.ownerDocument.body).find(
    (candidate) =>
      !content.contains(candidate) &&
      !trigger.contains(candidate) &&
      (trigger.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
  );
}

interface FocusManagerProps {
  readonly node: () => HTMLElement | undefined;
  readonly own: Loose & PopoverContentOwnProps;
  readonly interactedOutside: () => boolean;
  readonly resetInteraction: () => void;
  readonly children?: JsxChild;
}

/**
 * Owns the focus scope. It is a child of the dismissable layer on purpose: effects run in creation
 * order, so the layer is registered before focus moves into the content. The other way round, a
 * popover opened from inside another one moves focus while the outer layer cannot yet tell that the
 * new content is a descendant, and dismisses itself for "focus outside".
 */
function FocusManager(manager: FocusManagerProps): JsxChild {
  const context = popoverContext.use("Popover.Content");
  const { own } = manager;

  // A non-modal popover is portaled to the end of the page, so the browser's Tab order would carry
  // focus from its last control to the start of the document (the page jumps to the top). Follow the
  // order of the page instead: Tab leaves toward what comes after the trigger, Shift+Tab goes back
  // to the trigger.
  useEffect(() => {
    const content = manager.node();
    if (content === undefined || context.modal()) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.defaultPrevented) return;
      const trigger = untrack(context.trigger);
      if (trigger?.isConnected !== true || content.contains(trigger)) return;
      const tabbables = getTabbables(content);
      const first = tabbables[0] ?? content;
      const last = tabbables.at(-1) ?? content;
      const active = content.ownerDocument.activeElement;
      if (!event.shiftKey && active === last) {
        const next = tabbableAfter(trigger, content);
        if (next === undefined) return;
        event.preventDefault();
        next.focus();
      } else if (event.shiftKey && (active === first || active === content)) {
        event.preventDefault();
        trigger.focus();
      }
    };
    content.addEventListener("keydown", onKeyDown);
    onCleanup(() => content.removeEventListener("keydown", onKeyDown));
  });

  useFocusScope({
    container: manager.node,
    onActivated: (element) => (context.modal() ? hideOthers(element) : undefined),
    trapped: () => context.modal(),
    loop: () => context.modal(),
    enabled: () => context.open(),
    onMountAutoFocus: () => (event) => {
      manager.resetInteraction();
      callHandler(own.onOpenAutoFocus, event);
    },
    onUnmountAutoFocus: () => (event) => {
      callHandler(own.onCloseAutoFocus, event);
      if (event.defaultPrevented) return;
      // The scope would hand focus back to whatever was focused before; the trigger is what we mean
      // (Safari does not focus buttons on click, so "before" can be the body).
      if (manager.interactedOutside() && !context.modal()) {
        event.preventDefault();
        return;
      }
      const trigger = untrack(context.trigger);
      // Without a trigger (an anchor only, or an `open` set by the application) the scope restores the previous focus.
      if (trigger?.isConnected !== true) return;
      event.preventDefault();
      trigger.focus();
    },
  });
  return manager.children;
}
