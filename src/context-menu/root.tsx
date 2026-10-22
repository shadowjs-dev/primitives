import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { MenuRoot } from "../menu/index";

/**
 * Props of {@link ContextMenu}.
 *
 * Accessibility: the root sets no ARIA attributes itself. The trigger and the menu carry the
 * relationships and roles described on their parts; a modal menu hides the rest of the page from
 * assistive technology while it is open. Data attributes: none on the root (`data-state` is set on
 * the trigger and the content).
 * @since 1.0.0
 * @see {@link ContextMenuRoot}
 */
export interface ContextMenuProps {
  /** Called when the menu opens or closes. @default none */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * A modal menu hides the rest of the page from assistive technology, locks scroll and blocks
   * pointer events outside. @default `true`
   */
  readonly modal?: boolean | undefined;
  /** Reading direction. @default the surrounding direction */
  readonly dir?: "ltr" | "rtl" | undefined;
  /** The `ContextMenu.Trigger`, `ContextMenu.Portal` and any other parts. @default none */
  readonly children?: JsxChild | undefined;
}

/**
 * Root of a context menu: a menu opened at the pointer by the browser's `contextmenu` event (right
 * click, the keyboard's menu key, Shift+F10) or by a long press on touch and pen. It renders no
 * element.
 *
 * Keyboard and ARIA: Shift+F10 or the ContextMenu key on the focused trigger opens the menu with its
 * first item focused; the menu is `role="menu"` of `menuitem` items, navigated with the arrow keys,
 * Home, End and typeahead, selected with Enter or Space, and closed with Escape or Tab.
 *
 * @param props See {@link ContextMenuProps}.
 * @returns The provider around the children; it renders no element of its own.
 * @example
 * import { ContextMenu, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Back() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger class="area">Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuItem>Back</ContextMenuItem>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuProps}
 */
export function ContextMenuRoot(props: ContextMenuProps): JsxChild {
  return (
    <MenuRoot onOpenChange={props.onOpenChange} modal={props.modal} dir={props.dir}>
      {props.children}
    </MenuRoot>
  );
}
