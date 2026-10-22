import {
  MenuArrow,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuItemIndicator,
  MenuLabel,
  MenuPortal,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from "../menu/index";
import { ContextMenuContent } from "./content";
import { ContextMenuRoot } from "./root";
import { ContextMenuTrigger } from "./trigger";

export type { ContextMenuContentProps } from "./content";
export type { ContextMenuProps } from "./root";
export type { ContextMenuTriggerOwnProps, ContextMenuTriggerProps } from "./trigger";
export { ContextMenuContent, ContextMenuRoot, ContextMenuTrigger };

/**
 * Renders the menu into `document.body` (or `container`) while it is open. See `Menu.Portal`.
 *
 * @example
 * import { ContextMenu, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuItem>Copy</ContextMenuItem>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenu}
 */
export const ContextMenuPortal: typeof MenuPortal = MenuPortal;
/**
 * An action. Selecting it closes the menu unless `onSelect` calls `preventDefault()`. See `Menu.Item`.
 *
 * @example
 * import { ContextMenu, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas(props: { readonly onCopy: () => void }) {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuItem onSelect={props.onCopy}>Copy</ContextMenuItem>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuCheckboxItem}
 */
export const ContextMenuItem: typeof MenuItem = MenuItem;
/**
 * A toggle item: `role="menuitemcheckbox"` with `aria-checked`. See `Menu.CheckboxItem`.
 *
 * @example
 * import { ContextMenu, ContextMenuCheckboxItem, ContextMenuItemIndicator, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuCheckboxItem defaultChecked>
 *             <ContextMenuItemIndicator>*</ContextMenuItemIndicator> Show grid
 *           </ContextMenuCheckboxItem>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuItem}
 */
export const ContextMenuCheckboxItem: typeof MenuCheckboxItem = MenuCheckboxItem;
/**
 * A group of exclusive items: `role="group"`. See `Menu.RadioGroup`.
 *
 * @example
 * import { ContextMenu, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuRadioGroup defaultValue="small">
 *             <ContextMenuRadioItem value="small">Small</ContextMenuRadioItem>
 *             <ContextMenuRadioItem value="large">Large</ContextMenuRadioItem>
 *           </ContextMenuRadioGroup>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuRadioItem}
 */
export const ContextMenuRadioGroup: typeof MenuRadioGroup = MenuRadioGroup;
/**
 * An item of a radio group: `role="menuitemradio"` with `aria-checked`. See `Menu.RadioItem`.
 *
 * @example
 * import { ContextMenu, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuRadioGroup defaultValue="small">
 *             <ContextMenuRadioItem value="small">Small</ContextMenuRadioItem>
 *           </ContextMenuRadioGroup>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuRadioGroup}
 */
export const ContextMenuRadioItem: typeof MenuRadioItem = MenuRadioItem;
/**
 * Shown while the item is checked (or indeterminate). See `Menu.ItemIndicator`.
 *
 * @example
 * import { ContextMenu, ContextMenuCheckboxItem, ContextMenuItemIndicator, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuCheckboxItem defaultChecked>
 *             <ContextMenuItemIndicator>*</ContextMenuItemIndicator> Show grid
 *           </ContextMenuCheckboxItem>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuCheckboxItem}
 */
export const ContextMenuItemIndicator: typeof MenuItemIndicator = MenuItemIndicator;
/**
 * A heading for a group of items. It is not focusable and not an item. See `Menu.Label`.
 *
 * @example
 * import { ContextMenu, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuGroup>
 *             <ContextMenuLabel>Edit</ContextMenuLabel>
 *             <ContextMenuItem>Paste</ContextMenuItem>
 *           </ContextMenuGroup>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuGroup}
 */
export const ContextMenuLabel: typeof MenuLabel = MenuLabel;
/**
 * A group of items: `role="group"`. See `Menu.Group`.
 *
 * @example
 * import { ContextMenu, ContextMenuGroup, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuGroup>
 *             <ContextMenuItem>Cut</ContextMenuItem>
 *             <ContextMenuItem>Copy</ContextMenuItem>
 *           </ContextMenuGroup>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuLabel}
 */
export const ContextMenuGroup: typeof MenuGroup = MenuGroup;
/**
 * A visual divider between groups of items: `role="separator"` with `aria-orientation="horizontal"`.
 * See `Menu.Separator`.
 *
 * @example
 * import { ContextMenu, ContextMenuItem, ContextMenuPortal, ContextMenuSeparator, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuItem>Copy</ContextMenuItem>
 *           <ContextMenuSeparator />
 *           <ContextMenuItem>Delete</ContextMenuItem>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuGroup}
 */
export const ContextMenuSeparator: typeof MenuSeparator = MenuSeparator;
/**
 * An arrow pointing at the anchor (the point the menu opened at). See `Menu.Arrow`.
 *
 * @example
 * import { ContextMenu, ContextMenuArrow, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuArrow class="fill-white" />
 *           <ContextMenuItem>Copy</ContextMenuItem>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuContent}
 */
export const ContextMenuArrow: typeof MenuArrow = MenuArrow;
/**
 * Root of a submenu: holds the open state of one submenu. See `Menu.Sub`.
 *
 * @example
 * import { ContextMenu, ContextMenuItem, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuSub>
 *             <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
 *             <ContextMenuSubContent>
 *               <ContextMenuItem>Email</ContextMenuItem>
 *             </ContextMenuSubContent>
 *           </ContextMenuSub>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuSubTrigger}
 */
export const ContextMenuSub: typeof MenuSub = MenuSub;
/**
 * The item that opens a submenu: `role="menuitem"` with `aria-haspopup="menu"` and `aria-expanded`.
 * See `Menu.SubTrigger`.
 *
 * @example
 * import { ContextMenu, ContextMenuItem, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuSub>
 *             <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
 *             <ContextMenuSubContent>
 *               <ContextMenuItem>Email</ContextMenuItem>
 *             </ContextMenuSubContent>
 *           </ContextMenuSub>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuSub}
 */
export const ContextMenuSubTrigger: typeof MenuSubTrigger = MenuSubTrigger;
/**
 * The submenu: a `role="menu"` placed beside its trigger. See `Menu.SubContent`.
 *
 * @example
 * import { ContextMenu, ContextMenuItem, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@shadow-js/primitives";
 *
 * export function Canvas() {
 *   return (
 *     <ContextMenu>
 *       <ContextMenuTrigger>Right click here</ContextMenuTrigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuSub>
 *             <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
 *             <ContextMenuSubContent>
 *               <ContextMenuItem>Email</ContextMenuItem>
 *             </ContextMenuSubContent>
 *           </ContextMenuSub>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuSubTrigger}
 */
export const ContextMenuSubContent: typeof MenuSubContent = MenuSubContent;

/**
 * The context menu primitive: `ContextMenu`, `ContextMenu.Trigger`, `ContextMenu.Portal`,
 * `ContextMenu.Content` and every menu part. Each part is also exported by name
 * (`ContextMenuItem`, ...) for tree shaking.
 *
 * Keyboard and ARIA: the trigger is a focusable `span` (`tabindex="0"`). Shift+F10 or the ContextMenu
 * key opens the menu with its first item focused; a pointer or long press opens it with the menu
 * itself focused. The menu is `role="menu"` of `menuitem`, `menuitemcheckbox` and `menuitemradio`
 * items: arrow keys, Home, End and typeahead move between items, Enter and Space select, and Escape
 * or Tab close it.
 *
 * @example
 * import { ContextMenu, ContextMenuItem, ContextMenuPortal } from "@shadow-js/primitives";
 *
 * export function Canvas(props: { readonly onCopy: () => void }) {
 *   return (
 *     <ContextMenu>
 *       <ContextMenu.Trigger>Right click</ContextMenu.Trigger>
 *       <ContextMenuPortal>
 *         <ContextMenu.Content>
 *           <ContextMenuItem onSelect={props.onCopy}>Copy</ContextMenuItem>
 *         </ContextMenu.Content>
 *       </ContextMenuPortal>
 *     </ContextMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ContextMenuRoot}
 */
export const ContextMenu: typeof ContextMenuRoot & {
  readonly Trigger: typeof ContextMenuTrigger;
  readonly Portal: typeof MenuPortal;
  readonly Content: typeof ContextMenuContent;
  readonly Item: typeof MenuItem;
  readonly CheckboxItem: typeof MenuCheckboxItem;
  readonly RadioGroup: typeof MenuRadioGroup;
  readonly RadioItem: typeof MenuRadioItem;
  readonly ItemIndicator: typeof MenuItemIndicator;
  readonly Label: typeof MenuLabel;
  readonly Group: typeof MenuGroup;
  readonly Separator: typeof MenuSeparator;
  readonly Arrow: typeof MenuArrow;
  readonly Sub: typeof MenuSub;
  readonly SubTrigger: typeof MenuSubTrigger;
  readonly SubContent: typeof MenuSubContent;
} = Object.assign((props: Parameters<typeof ContextMenuRoot>[0]) => ContextMenuRoot(props), {
  Trigger: ContextMenuTrigger,
  Portal: MenuPortal,
  Content: ContextMenuContent,
  Item: MenuItem,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  ItemIndicator: MenuItemIndicator,
  Label: MenuLabel,
  Group: MenuGroup,
  Separator: MenuSeparator,
  Arrow: MenuArrow,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
  SubContent: MenuSubContent,
});
