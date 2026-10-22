import { onCleanup, onMount, splitProps, useEffect, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { LayerElement } from "../popover/layer-element";
import { whileMounted } from "../popover/mounted";
import { PopperContent, type PopperContentOwnProps } from "../popper/index";
import {
  callHandler,
  composeRefs,
  createPartContext,
  type FocusOutsideEvent,
  mergeElementProps,
  type PartContext,
  type PointerDownOutsideEvent,
  type PolymorphicProps,
  type PolymorphicTarget,
  usePresence,
  VisuallyHidden,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { TOOLTIP_OPEN_EVENT, tooltipContext } from "./context";
import { createGraceArea, isPointInPolygon } from "./grace-area";

/**
 * Own props of {@link TooltipContent}: the placement options of `PopperContent` plus the accessible
 * label and the dismissal hooks.
 *
 * Accessibility: the visible element is not announced. The trigger's `aria-describedby` names a
 * visually hidden copy with `role="tooltip"` that holds the children as plain text, or the
 * `ariaLabel` when one is given. Data attributes: `data-state` (`"closed"`, `"delayed-open"` or
 * `"instant-open"`, the same as the trigger) on the visible element.
 * @since 1.0.0
 * @see {@link TooltipContent}
 */
export interface TooltipContentOwnProps extends PopperContentOwnProps {
  /**
   * Keeps the content mounted while closed, for animation libraries that control mounting.
   * @default `false`
   */
  readonly forceMount?: boolean | undefined;
  /**
   * The text assistive technology announces instead of the children, for content that is not plain
   * text. The visible content is unchanged. `aria-label` does the same.
   * @default none (the children are announced)
   */
  readonly ariaLabel?: string | undefined;
  /**
   * Called when Escape is pressed while the tooltip is open. Calling `preventDefault()` keeps it open.
   * @default none
   */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /**
   * Called on a pointer press outside the content and the trigger. Calling `preventDefault()` keeps
   * the tooltip open.
   * @default none
   */
  readonly onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
}

/**
 * Props of {@link TooltipContent}: the attributes of the chosen element (a `div` by default), plus
 * {@link TooltipContentOwnProps}.
 * @since 1.0.0
 * @see {@link TooltipContent}
 */
export type TooltipContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  TooltipContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN_KEYS = [
  "as",
  "forceMount",
  "ariaLabel",
  "aria-label",
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "children",
] as const;

/**
 * True inside the visually hidden copy of the content, where an arrow has no meaning. Not public API.
 * @internal
 */
export const hiddenContentContext: PartContext<true> = createPartContext<true>("TooltipContent");

/**
 * The tooltip's content. It renders the visible content, placed against the trigger by
 * `PopperContent` with a default `side` of `"top"`, and a visually hidden copy with `role="tooltip"`
 * that the trigger's `aria-describedby` names: the visible element can hold markup and styling, while
 * assistive technology gets plain text (or `ariaLabel`).
 *
 * Keyboard and dismissal: Escape closes it unless `onEscapeKeyDown` prevents it. A press outside the
 * content and the trigger closes it unless `onPointerDownOutside` prevents it, and so does a scroll of
 * the trigger's container. Focus leaving the content does not dismiss it; blurring the trigger does.
 * Unless `disableHoverableContent` is set, the pointer can travel from the trigger onto the content
 * without closing it: it may stay anywhere inside the grace area between them. The element carries
 * `data-state`. It stays mounted until its exit animation ends.
 *
 * @param props See {@link TooltipContentProps}.
 * @returns The content placed against the trigger, with its visually hidden copy.
 * @throws Error when rendered outside {@link TooltipRoot}: `[primitives] <Tooltip.Content> must be used within <Tooltip>.`
 * @example
 * import { Tooltip } from "@shadow-js/primitives";
 *
 * export function LibraryTip() {
 *   return (
 *     <Tooltip>
 *       <Tooltip.Trigger>Add</Tooltip.Trigger>
 *       <Tooltip.Portal>
 *         <Tooltip.Content sideOffset={6}>
 *           Add to library
 *           <Tooltip.Arrow />
 *         </Tooltip.Content>
 *       </Tooltip.Portal>
 *     </Tooltip>
 *   );
 * }
 * @see {@link TooltipContentOwnProps}
 * @see {@link TooltipPortal}
 * @since 1.0.0
 */
export function TooltipContent<T extends PolymorphicTarget = "div">(
  props: TooltipContentProps<T>,
): JsxChild {
  const context = tooltipContext.use("Tooltip.Content");
  const [own, rest] = splitProps(partProps<Loose & TooltipContentOwnProps>(props), OWN_KEYS);
  const presence = usePresence(() => context.open() || own.forceMount === true);
  return whileMounted(presence.mounted, () => (
    <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
  ));
}

interface ContentLayerProps {
  readonly own: Loose & TooltipContentOwnProps;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

/** The mounted part of the content: everything here lives exactly as long as the element. */
function ContentLayer(layer: ContentLayerProps): JsxChild {
  const context = tooltipContext.use("Tooltip.Content");
  const { own } = layer;
  const [node, setNode] = useSignal<HTMLElement | undefined>(undefined);
  // Registered after mount: a signal must not be written while the branch that builds this part computes.
  onMount(() => context.hold());

  // Opening another tooltip closes this one.
  useEffect(() => {
    const onOtherOpen = (event: Event): void => {
      if (event instanceof CustomEvent && event.detail !== context.id()) context.onClose();
    };
    document.addEventListener(TOOLTIP_OPEN_EVENT, onOtherOpen);
    onCleanup(() => document.removeEventListener(TOOLTIP_OPEN_EVENT, onOtherOpen));
  });

  // A tooltip must not float away from a trigger that scrolled.
  useEffect(() => {
    const trigger = context.trigger();
    if (trigger === undefined) return;
    const view = trigger.ownerDocument.defaultView ?? window;
    const onScroll = (event: Event): void => {
      const target = event.target;
      if (target instanceof Node && target.contains(trigger)) context.onClose();
    };
    view.addEventListener("scroll", onScroll, { capture: true });
    onCleanup(() => view.removeEventListener("scroll", onScroll, { capture: true }));
  });

  // Hoverable content: after the pointer leaves the trigger (or the content) it may cross the grace
  // area toward the other without closing; anywhere else closes.
  useEffect(() => {
    const trigger = context.trigger();
    const content = node();
    if (trigger === undefined || content === undefined || context.disableHoverableContent()) return;
    let tracking: ((event: PointerEvent) => void) | undefined;
    const stop = (): void => {
      if (tracking !== undefined)
        trigger.ownerDocument.removeEventListener("pointermove", tracking);
      tracking = undefined;
      context.group.setPointerInTransit(false);
    };
    const start = (event: PointerEvent, from: HTMLElement, to: HTMLElement): void => {
      if (event.pointerType === "touch") return;
      stop();
      const area = createGraceArea(
        { x: event.clientX, y: event.clientY },
        from.getBoundingClientRect(),
        to.getBoundingClientRect(),
      );
      context.group.setPointerInTransit(true);
      tracking = (move) => {
        const target = move.target;
        const enteredTarget =
          target instanceof Node && (trigger.contains(target) || content.contains(target));
        if (enteredTarget) {
          stop();
        } else if (!isPointInPolygon({ x: move.clientX, y: move.clientY }, area)) {
          stop();
          context.onClose();
        }
      };
      trigger.ownerDocument.addEventListener("pointermove", tracking);
    };
    const onTriggerLeave = (event: PointerEvent): void => start(event, trigger, content);
    const onContentLeave = (event: PointerEvent): void => start(event, content, trigger);
    trigger.addEventListener("pointerleave", onTriggerLeave);
    content.addEventListener("pointerleave", onContentLeave);
    onCleanup(() => {
      trigger.removeEventListener("pointerleave", onTriggerLeave);
      content.removeEventListener("pointerleave", onContentLeave);
      stop();
    });
  });

  const label = (): string | undefined =>
    own.ariaLabel ?? (own["aria-label"] as string | undefined);

  const elementProps = mergeElementProps(
    {
      // The tooltip pattern puts it above the trigger.
      get side() {
        return "top";
      },
      get "data-state"() {
        return context.stateAttribute();
      },
    },
    layer.rest,
    {
      ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => setNode(element)),
      // `PopperContent` hands `style` over from `{ animation: "none" }` to `undefined` once placed,
      // and `undefined` removes the whole attribute; an object keeps the diff per property.
      style: {},
    },
  );

  return (
    <PopperContent
      as={LayerElement}
      layerAs={own.as ?? "div"}
      {...elementProps}
      enabled={context.open()}
      branches={() => [context.trigger()]}
      onEscapeKeyDown={(event: KeyboardEvent) => callHandler(own.onEscapeKeyDown, event)}
      onPointerDownOutside={(event: PointerDownOutsideEvent) =>
        callHandler(own.onPointerDownOutside, event)
      }
      // Focus leaving is the trigger's blur, which already closes it; a tooltip must not trap or dismiss on focus.
      onFocusOutside={(event: FocusOutsideEvent) => event.preventDefault()}
      onDismiss={() => context.onClose()}
    >
      <ContentBody own={own} id={context.contentId()} label={label()} />
    </PopperContent>
  );
}

interface ContentBodyProps {
  readonly own: Loose & TooltipContentOwnProps;
  readonly id: string;
  readonly label: string | undefined;
}

/**
 * The visible children and their visually hidden copy. A component rather than two sibling JSX
 * expressions: siblings are wrapped in a memo by the compiler, and the children may contain parts
 * (an arrow) that register themselves with a signal write, which a memo forbids.
 */
function ContentBody(body: ContentBodyProps): JsxChild {
  const visible = body.own["children"] as JsxChild;
  return [
    visible,
    <hiddenContentContext.Provider value={true}>
      <VisuallyHidden id={body.id} role="tooltip">
        {body.label ?? (body.own["children"] as JsxChild)}
      </VisuallyHidden>
    </hiddenContentContext.Provider>,
  ];
}
