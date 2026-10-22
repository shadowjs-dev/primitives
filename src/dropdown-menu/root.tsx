import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { MenuRoot } from "../menu/index";

/**
 * Props of {@link DropdownMenu}.
 *
 * Accessibility: the root sets no ARIA attributes itself. The trigger (`aria-haspopup="menu"`,
 * `aria-expanded`, `aria-controls` while open) and the content (`role="menu"`, `aria-labelledby` the
 * trigger) carry the relationships. Data attributes: none on the root; `data-state` is set on the
 * trigger and the content.
 * @since 1.0.0
 * @see {@link DropdownMenuRoot}
 */
export interface DropdownMenuProps {
  /** Controlled open state. @default none */
  readonly open?: boolean | undefined;
  /** Initial open state when uncontrolled. @default `false` */
  readonly defaultOpen?: boolean | undefined;
  /** Called when the menu asks to open or close. @default none */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * A modal menu hides the rest of the page from assistive technology, locks scroll and blocks
   * pointer events outside; pressing outside closes it. @default `true`
   */
  readonly modal?: boolean | undefined;
  /**
   * Reading direction (flips ArrowLeft / ArrowRight and the submenu side).
   * @default the surrounding direction
   */
  readonly dir?: "ltr" | "rtl" | undefined;
  /** Base id; the ids of the trigger and content derive from it. @default generated */
  readonly id?: string | undefined;
  /** The `DropdownMenu.Trigger`, `DropdownMenu.Portal` and any other parts. @default none */
  readonly children?: JsxChild | undefined;
}

/**
 * Root of a dropdown menu: a menu opened from a button. It renders no element.
 *
 * Follows the WAI-ARIA menu button pattern: Enter and Space on the trigger toggle the menu, ArrowDown
 * opens it and focuses its first item (ArrowUp focuses the last), a pointer press opens it with focus
 * on the menu itself, Escape closes it and focus returns to the trigger.
 *
 * @param props See {@link DropdownMenuProps}.
 * @returns The provider around the children; it renders no element of its own.
 * @example
 * import { DropdownMenu, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator } from "@shadow-js/primitives";
 *
 * export function FileOptions(props: {
 *   readonly onRename: () => void;
 *   readonly onDelete: () => void;
 * }) {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenu.Content sideOffset={4}>
 *           <DropdownMenuItem onSelect={props.onRename}>Rename</DropdownMenuItem>
 *           <DropdownMenuSeparator />
 *           <DropdownMenuItem onSelect={props.onDelete}>Delete</DropdownMenuItem>
 *         </DropdownMenu.Content>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuProps}
 */
export function DropdownMenuRoot(props: DropdownMenuProps): JsxChild {
  return (
    <MenuRoot
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
      modal={props.modal}
      dir={props.dir}
      id={props.id}
    >
      {props.children}
    </MenuRoot>
  );
}
