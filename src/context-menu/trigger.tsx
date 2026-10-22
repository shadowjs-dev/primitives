import { onCleanup, splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { menuContext } from "../menu/index";
import { usePopperContext } from "../popper/index";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  type VirtualElement,
} from "../utils/index";
import { partProps } from "../utils/part-props";

/** How long a touch or pen has to stay down to count as a long press, in milliseconds. */
const LONG_PRESS_MS = 700;

/**
 * Own props of {@link ContextMenuTrigger}.
 *
 * Accessibility: the trigger has no role and is a Tab stop (`tabindex="0"`); Shift+F10 and the
 * ContextMenu key open the menu from it. Data attributes: `data-state` is `"open"` or `"closed"`,
 * and `data-disabled` is present (empty value) while disabled.
 * @since 1.0.0
 * @see {@link ContextMenuTrigger}
 */
export interface ContextMenuTriggerOwnProps {
  /** A disabled trigger leaves the browser's own context menu alone. @default `false` */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link ContextMenuTrigger}: the attributes of the chosen element (`span` by default).
 * @since 1.0.0
 * @see {@link ContextMenuTrigger}
 */
export type ContextMenuTriggerProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  ContextMenuTriggerOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** A zero-size anchor at a point. */
function pointAnchor(x: number, y: number, context: Element | undefined): VirtualElement {
  const rect = () => ({ x, y, width: 0, height: 0 });
  // The trigger is the context element: it is where a `dir` attribute above the menu is found.
  return context === undefined
    ? { getBoundingClientRect: rect }
    : { getBoundingClientRect: rect, contextElement: context };
}

/**
 * The area that opens the menu. Renders a focusable `span` (pass `as` for another element). A
 * `contextmenu` event opens the menu at the pointer and cancels the browser's menu; a touch or pen
 * held down for 700ms does the same (the timer is canceled by movement, release and cancel). The
 * ContextMenu key and Shift+F10 open it at the trigger with its first item focused. `data-state` is
 * `open` / `closed`.
 *
 * @param props See {@link ContextMenuTriggerProps}.
 * @returns The rendered trigger element.
 * @example
 * import { ContextMenu, ContextMenuPortal, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger as="div" class="canvas">
 *         Drawing area
 *       </ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenuContent>
 *           <ContextMenuItem>Clear</ContextMenuItem>
 *         </ContextMenuContent>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuRoot}
 */
export function ContextMenuTrigger<T extends PolymorphicTarget = "span">(
  props: ContextMenuTriggerProps<T>,
): JsxChild {
  const menu = menuContext.use("ContextMenu.Trigger");
  const popper = usePopperContext();
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "disabled",
    "onContextMenu",
    "onPointerDown",
    "onPointerMove",
    "onPointerUp",
    "onPointerCancel",
    "onKeyDown",
  ]);
  const disabled = (): boolean => own["disabled"] === true;
  let triggerElement: Element | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clearLongPress = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  onCleanup(clearLongPress);

  /** A new anchor for every opening, so the content is placed again at the new point. */
  const openAt = (x: number, y: number, entry?: "first" | undefined): void => {
    popper.setAnchor(pointAnchor(x, y, triggerElement));
    menu.entry.value = entry;
    menu.setOpen(true);
  };
  const whenTouchOrPen =
    (handler: (event: PointerEvent) => void) =>
    (event: PointerEvent): void => {
      if (event.pointerType !== "mouse") handler(event);
    };

  const merged = mergeElementProps(
    {
      get "data-state"() {
        return menu.open() ? "open" : "closed";
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      // Keeps iOS from showing its own callout over ours. Focusable, so the keyboard can open it.
      style: { "-webkit-touch-callout": "none" },
      tabindex: 0,
      ref: (element: HTMLElement) => {
        triggerElement = element;
      },
    },
    rest,
    {
      // A disabled trigger lets the browser's menu through.
      onContextMenu: composeEventHandlers(
        () => own["onContextMenu"],
        (event: MouseEvent) => {
          if (untrack(disabled)) return;
          // Some platforms turn a long press into `contextmenu` themselves.
          clearLongPress();
          openAt(event.clientX, event.clientY);
          event.preventDefault();
        },
      ),
      // The menu key and Shift+F10 open the menu at the trigger, first item focused (as the
      // browser's own context menu does). A disabled trigger lets the keys through.
      onKeyDown: composeEventHandlers(
        () => own["onKeyDown"],
        (event: KeyboardEvent) => {
          if (untrack(disabled)) return;
          if (event.key !== "ContextMenu" && !(event.key === "F10" && event.shiftKey)) return;
          const target = event.currentTarget;
          const rect = target instanceof Element ? target.getBoundingClientRect() : undefined;
          openAt(
            rect === undefined ? 0 : rect.left + rect.width / 2,
            rect === undefined ? 0 : rect.top + rect.height / 2,
            "first",
          );
          event.preventDefault();
        },
      ),
      onPointerDown: composeEventHandlers(
        () => own["onPointerDown"],
        whenTouchOrPen((event) => {
          if (untrack(disabled)) return;
          clearLongPress();
          const { clientX, clientY } = event;
          timer = setTimeout(() => {
            timer = undefined;
            openAt(clientX, clientY);
          }, LONG_PRESS_MS);
        }),
      ),
      onPointerMove: composeEventHandlers(
        () => own["onPointerMove"],
        whenTouchOrPen(clearLongPress),
      ),
      onPointerUp: composeEventHandlers(() => own["onPointerUp"], whenTouchOrPen(clearLongPress)),
      onPointerCancel: composeEventHandlers(
        () => own["onPointerCancel"],
        whenTouchOrPen(clearLongPress),
      ),
    },
  );
  return <Polymorphic as={own.as ?? "span"} {...merged} />;
}
