import { onCleanup, onMount, splitProps, untrack, useEffect, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { LayerElement } from "../popover/layer-element";
import { whileMounted } from "../popover/mounted";
import { PopperContent, type PopperContentOwnProps } from "../popper/index";
import {
  callHandler,
  composeEventHandlers,
  composeRefs,
  type FocusOutsideEvent,
  getTabbables,
  mergeElementProps,
  type PointerDownOutsideEvent,
  type PolymorphicProps,
  type PolymorphicTarget,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { hoverCardContext } from "./context";

/**
 * Own props of {@link HoverCardContent}: the placement options of `PopperContent` plus the
 * dismissal hooks.
 *
 * Accessibility: no role or ARIA attribute is set and the card does not take focus or trap it.
 * Data attributes: `data-state` is `"open"` or `"closed"`.
 * @since 1.0.0
 * @see {@link HoverCardContent}
 */
export interface HoverCardContentOwnProps extends PopperContentOwnProps {
  /** Keep the content mounted while closed (for animation libraries). @default `false` */
  readonly forceMount?: boolean | undefined;
  /** Escape was pressed. `preventDefault()` keeps the card open. @default none */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /** A pointer press happened outside the card. `preventDefault()` keeps it open. @default none */
  readonly onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
  /** Pointer press or focus outside. `preventDefault()` keeps the card open. @default none */
  readonly onInteractOutside?:
    | ((event: PointerDownOutsideEvent | FocusOutsideEvent) => void)
    | undefined;
}

/**
 * Props of {@link HoverCardContent}: the attributes of the chosen element (`div` by default).
 * @since 1.0.0
 * @see {@link HoverCardContent}
 */
export type HoverCardContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  HoverCardContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN_KEYS = [
  "as",
  "forceMount",
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "onInteractOutside",
  "onPointerEnter",
  "onPointerLeave",
  "onPointerDown",
  "children",
] as const;

/**
 * The card. It stays open while the pointer is over the trigger or over the card, and a close
 * delay lets the pointer cross the gap between them. While text is being selected inside it the
 * card does not close when the pointer leaves, and the selection stays inside the card. Escape and
 * a press outside close it; focus moving away does not (the trigger's blur handles that).
 *
 * Its controls stay in the tab order: Tab from the trigger of an open card enters it, Shift+Tab
 * from its first control and Escape return to the trigger, and focus leaving the card closes it.
 * The card does not trap focus. It is placed by `PopperContent`; the CSS variables
 * `--primitives-available-width` and `--primitives-transform-origin` are available to it. Keyboard: Escape and Shift+Tab from the first control return focus to the
 * trigger, and focus leaving the card closes it. ARIA: none; no role or ARIA attribute is set.
 *
 * @param props See {@link HoverCardContentProps}.
 * @returns The card while it is mounted, otherwise nothing.
 * @example
 * import { HoverCard } from "@shadow-js/primitives";
 *
 * export function AuthorLink() {
 *   return (
 *     <HoverCard>
 *       <HoverCard.Trigger href="/users/ada">@ada</HoverCard.Trigger>
 *       <HoverCard.Portal>
 *         <HoverCard.Content side="top" sideOffset={8} class="card">
 *           Ada Lovelace, mathematician.
 *         </HoverCard.Content>
 *       </HoverCard.Portal>
 *     </HoverCard>
 *   );
 * }
 * @since 1.0.0
 * @see {@link HoverCardPortal}
 */
export function HoverCardContent<T extends PolymorphicTarget = "div">(
  props: HoverCardContentProps<T>,
): JsxChild {
  const context = hoverCardContext.use("HoverCard.Content");
  const [own, rest] = splitProps(partProps<Loose & HoverCardContentOwnProps>(props), OWN_KEYS);
  const presence = usePresence(() => context.open() || own.forceMount === true);
  return whileMounted(presence.mounted, () => (
    <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
  ));
}

interface ContentLayerProps {
  readonly own: Loose & HoverCardContentOwnProps;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

/** The mounted part of the content: everything here lives exactly as long as the element. */
function ContentLayer(layer: ContentLayerProps): JsxChild {
  const context = hoverCardContext.use("HoverCard.Content");
  const { own } = layer;
  const [node, setNode] = useSignal<HTMLElement | undefined>(undefined);
  const [containSelection, setContainSelection] = useSignal(false);
  // Registered after mount: a signal must not be written while the branch that builds this part computes.
  onMount(() => context.hold());

  // While the user selects text in the card, the rest of the page must not become selected too.
  useEffect(() => {
    if (!containSelection()) return;
    const body = document.body;
    const previous = body.style.userSelect;
    body.style.userSelect = "none";
    onCleanup(() => {
      body.style.userSelect = previous;
    });
  });

  // Releasing the pointer ends a selection drag; whether anything is selected decides if leaving closes the card.
  useEffect(() => {
    if (node() === undefined) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onPointerUp = (): void => {
      setContainSelection(false);
      context.selection.isPointerDownOnContent = false;
      // The selection is updated after pointerup, not during it.
      timer = setTimeout(() => {
        timer = undefined;
        if (document.getSelection()?.toString() !== "") context.selection.hasSelection = true;
      });
    };
    document.addEventListener("pointerup", onPointerUp);
    onCleanup(() => {
      document.removeEventListener("pointerup", onPointerUp);
      if (timer !== undefined) clearTimeout(timer);
      context.selection.hasSelection = false;
      context.selection.isPointerDownOnContent = false;
    });
  });

  // Keyboard: Shift+Tab from the first control and Escape return focus to the trigger; focus that
  // leaves the card (not to the trigger) closes it.
  useEffect(() => {
    const element = node();
    if (element === undefined) return;
    context.setContent(element);
    const onKeyDown = (event: KeyboardEvent): void => {
      const trigger = untrack(context.trigger);
      if (event.key === "Escape") {
        if (element.contains(document.activeElement)) trigger?.focus();
        return;
      }
      if (
        event.key === "Tab" &&
        event.shiftKey &&
        getTabbables(element)[0] === document.activeElement
      ) {
        event.preventDefault();
        trigger?.focus();
      }
    };
    const onFocusOut = (event: FocusEvent): void => {
      const next = event.relatedTarget;
      const trigger = untrack(context.trigger);
      if (next instanceof Node && (element.contains(next) || trigger?.contains(next) === true))
        return;
      context.onClose();
    };
    element.addEventListener("keydown", onKeyDown);
    element.addEventListener("focusout", onFocusOut);
    onCleanup(() => {
      element.removeEventListener("keydown", onKeyDown);
      element.removeEventListener("focusout", onFocusOut);
      context.setContent(undefined);
    });
  });
  const elementProps = mergeElementProps(
    {
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      get style() {
        // Selection inside the card stays selectable even while the page is not.
        return containSelection() ? { "user-select": "text", "-webkit-user-select": "text" } : {};
      },
    },
    layer.rest,
    { ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => setNode(element)) },
    {
      onPointerEnter: composeEventHandlers(
        () => own["onPointerEnter"],
        (event: PointerEvent) => {
          if (event.pointerType !== "touch") context.onOpen();
        },
      ),
      onPointerLeave: composeEventHandlers(
        () => own["onPointerLeave"],
        (event: PointerEvent) => {
          if (event.pointerType !== "touch") context.onClose();
        },
      ),
      onPointerDown: composeEventHandlers(
        () => own["onPointerDown"],
        (event: PointerEvent) => {
          const element = node();
          if (
            element !== undefined &&
            event.target instanceof Node &&
            element.contains(event.target)
          ) {
            setContainSelection(true);
          }
          context.selection.hasSelection = false;
          context.selection.isPointerDownOnContent = true;
        },
      ),
    },
  );

  return (
    <PopperContent
      as={LayerElement}
      layerAs={own.as ?? "div"}
      {...elementProps}
      enabled={context.open()}
      onEscapeKeyDown={(event: KeyboardEvent) => callHandler(own.onEscapeKeyDown, event)}
      onPointerDownOutside={(event: PointerDownOutsideEvent) =>
        callHandler(own.onPointerDownOutside, event)
      }
      // Focus leaving is the trigger's blur, which closes after the delay; it must not dismiss at once.
      onFocusOutside={(event: FocusOutsideEvent) => event.preventDefault()}
      onInteractOutside={(event: PointerDownOutsideEvent | FocusOutsideEvent) =>
        callHandler(own.onInteractOutside, event)
      }
      onDismiss={() => context.onDismiss()}
    >
      {own["children"] as JsxChild}
    </PopperContent>
  );
}
