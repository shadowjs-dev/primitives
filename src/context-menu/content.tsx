import { mergeProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { MenuContent, type MenuContentProps } from "../menu/index";
import type { PolymorphicTarget } from "../utils/index";

/**
 * Props of {@link ContextMenuContent}: the attributes of the chosen element (`div` by default) plus
 * the options of `Menu.Content`.
 *
 * Accessibility: the content is `role="menu"` with `aria-orientation="vertical"` and takes focus
 * itself when opened with the pointer. Data attributes: `data-state` is `"open"` or `"closed"` and
 * `data-orientation` is `"vertical"`.
 * @since 1.0.0
 * @see {@link ContextMenuContent}
 */
export type ContextMenuContentProps<T extends PolymorphicTarget = "div"> = MenuContentProps<T>;

type Render = (props: Record<string, unknown>) => JsxChild;

/**
 * The menu itself, placed beside the point that opened it (`side="right"`, `align="start"`,
 * `sideOffset` 2). Everything `Menu.Content` offers applies. Focus returns to what had it before
 * the menu opened, unless the user pressed somewhere else. Keyboard: the keys are those of
 * `Menu.Content`: ArrowDown and ArrowUp move between enabled items, Home, End, PageUp and PageDown
 * jump to the ends, printable keys run typeahead, and Escape and Tab close the menu. ARIA:
 * `role="menu"` with `aria-orientation="vertical"`; opened with the pointer, focus moves to the menu
 * itself, and opened with the keyboard, to its first item.
 *
 * @param props See {@link ContextMenuContentProps}.
 * @returns The menu element while it is mounted, otherwise nothing.
 * @example
 * import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenuContent class="menu">
 *           <ContextMenuItem>Paste</ContextMenuItem>
 *         </ContextMenuContent>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuPortal}
 */
export function ContextMenuContent<T extends PolymorphicTarget = "div">(
  props: ContextMenuContentProps<T>,
): JsxChild {
  const Content = MenuContent as unknown as Render;
  return <Content {...mergeProps({ side: "right", sideOffset: 2, align: "start" }, props)} />;
}
