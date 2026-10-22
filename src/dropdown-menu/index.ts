import {
  MenuArrow,
  MenuCheckboxItem,
  MenuContent,
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
import { DropdownMenuRoot } from "./root";
import { DropdownMenuTrigger } from "./trigger";

export type { DropdownMenuProps } from "./root";
export type { DropdownMenuTriggerOwnProps, DropdownMenuTriggerProps } from "./trigger";
export { DropdownMenuRoot, DropdownMenuTrigger };

/**
 * Renders the menu into `document.body` (or `container`) while it is open. See `Menu.Portal`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuItem, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function Options() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenu.Content>
 *           <DropdownMenuItem>New file</DropdownMenuItem>
 *         </DropdownMenu.Content>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenu}
 */
export const DropdownMenuPortal: typeof MenuPortal = MenuPortal;
/**
 * The menu itself: `role="menu"`, placed against the trigger. See `Menu.Content`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function Options() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent sideOffset={4}>
 *           <DropdownMenuItem>New file</DropdownMenuItem>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuPortal}
 */
export const DropdownMenuContent: typeof MenuContent = MenuContent;
/**
 * An action: `role="menuitem"`. Selecting it closes the menu and returns focus to the trigger,
 * unless `onSelect` calls `preventDefault()`. See `Menu.Item`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function Options(props: { readonly onRename: () => void }) {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuItem onSelect={props.onRename}>Rename</DropdownMenuItem>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuCheckboxItem}
 */
export const DropdownMenuItem: typeof MenuItem = MenuItem;
/**
 * A toggle item: `role="menuitemcheckbox"` with `aria-checked`. See `Menu.CheckboxItem`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItemIndicator, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function View() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>View</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuCheckboxItem defaultChecked>
 *             <DropdownMenuItemIndicator>*</DropdownMenuItemIndicator> Show grid
 *           </DropdownMenuCheckboxItem>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuItem}
 */
export const DropdownMenuCheckboxItem: typeof MenuCheckboxItem = MenuCheckboxItem;
/**
 * A group of exclusive items: `role="group"`. See `Menu.RadioGroup`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@shadow-js/primitives";
 *
 * export function Density() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Density</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuRadioGroup defaultValue="comfortable">
 *             <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
 *             <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
 *           </DropdownMenuRadioGroup>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuRadioItem}
 */
export const DropdownMenuRadioGroup: typeof MenuRadioGroup = MenuRadioGroup;
/**
 * An item of a radio group: `role="menuitemradio"` with `aria-checked`. See `Menu.RadioItem`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@shadow-js/primitives";
 *
 * export function Density() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Density</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuRadioGroup defaultValue="compact">
 *             <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
 *           </DropdownMenuRadioGroup>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuRadioGroup}
 */
export const DropdownMenuRadioItem: typeof MenuRadioItem = MenuRadioItem;
/**
 * Shown while the item is checked (or indeterminate). See `Menu.ItemIndicator`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItemIndicator, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function View() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>View</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuCheckboxItem defaultChecked>
 *             <DropdownMenuItemIndicator>*</DropdownMenuItemIndicator> Show grid
 *           </DropdownMenuCheckboxItem>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuCheckboxItem}
 */
export const DropdownMenuItemIndicator: typeof MenuItemIndicator = MenuItemIndicator;
/**
 * A heading for a group of items. It is not focusable and not an item. See `Menu.Label`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function Edit() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Edit</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuGroup>
 *             <DropdownMenuLabel>Clipboard</DropdownMenuLabel>
 *             <DropdownMenuItem>Paste</DropdownMenuItem>
 *           </DropdownMenuGroup>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuGroup}
 */
export const DropdownMenuLabel: typeof MenuLabel = MenuLabel;
/**
 * A group of items: `role="group"`. See `Menu.Group`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function Edit() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Edit</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuGroup>
 *             <DropdownMenuItem>Cut</DropdownMenuItem>
 *             <DropdownMenuItem>Copy</DropdownMenuItem>
 *           </DropdownMenuGroup>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuLabel}
 */
export const DropdownMenuGroup: typeof MenuGroup = MenuGroup;
/**
 * A visual divider between groups of items: `role="separator"` with `aria-orientation="horizontal"`.
 * See `Menu.Separator`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator } from "@shadow-js/primitives";
 *
 * export function Options() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuItem>Rename</DropdownMenuItem>
 *           <DropdownMenuSeparator />
 *           <DropdownMenuItem>Delete</DropdownMenuItem>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuGroup}
 */
export const DropdownMenuSeparator: typeof MenuSeparator = MenuSeparator;
/**
 * An arrow pointing at the trigger. See `Menu.Arrow`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuArrow, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function Options() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuArrow class="fill-white" />
 *           <DropdownMenuItem>Rename</DropdownMenuItem>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuContent}
 */
export const DropdownMenuArrow: typeof MenuArrow = MenuArrow;
/**
 * Root of a submenu: holds the open state of one submenu. See `Menu.Sub`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@shadow-js/primitives";
 *
 * export function Share() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Share</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuSub>
 *             <DropdownMenuSubTrigger>Send to</DropdownMenuSubTrigger>
 *             <DropdownMenuSubContent>
 *               <DropdownMenuItem>Email</DropdownMenuItem>
 *             </DropdownMenuSubContent>
 *           </DropdownMenuSub>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuSubTrigger}
 */
export const DropdownMenuSub: typeof MenuSub = MenuSub;
/**
 * The item that opens a submenu: `role="menuitem"` with `aria-haspopup="menu"` and `aria-expanded`.
 * See `Menu.SubTrigger`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@shadow-js/primitives";
 *
 * export function Share() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Share</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuSub>
 *             <DropdownMenuSubTrigger>Send to</DropdownMenuSubTrigger>
 *             <DropdownMenuSubContent>
 *               <DropdownMenuItem>Email</DropdownMenuItem>
 *             </DropdownMenuSubContent>
 *           </DropdownMenuSub>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuSub}
 */
export const DropdownMenuSubTrigger: typeof MenuSubTrigger = MenuSubTrigger;
/**
 * The submenu: a `role="menu"` placed beside its trigger. See `Menu.SubContent`.
 *
 * @example
 * import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@shadow-js/primitives";
 *
 * export function Share() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Share</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenuContent>
 *           <DropdownMenuSub>
 *             <DropdownMenuSubTrigger>Send to</DropdownMenuSubTrigger>
 *             <DropdownMenuSubContent>
 *               <DropdownMenuItem>Email</DropdownMenuItem>
 *             </DropdownMenuSubContent>
 *           </DropdownMenuSub>
 *         </DropdownMenuContent>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuSubTrigger}
 */
export const DropdownMenuSubContent: typeof MenuSubContent = MenuSubContent;

/**
 * The dropdown menu primitive: `DropdownMenu`, `DropdownMenu.Trigger`, `DropdownMenu.Portal`,
 * `DropdownMenu.Content` and every menu part (`Item`, `CheckboxItem`, `RadioGroup`, `RadioItem`,
 * `ItemIndicator`, `Label`, `Group`, `Separator`, `Arrow`, `Sub`, `SubTrigger`, `SubContent`).
 * Each part is also exported by name (`DropdownMenuItem`, ...) for tree shaking.
 *
 * Keyboard and ARIA (WAI-ARIA menu button pattern): the trigger is a `button` with `aria-haspopup="menu"`
 * and `aria-expanded`. Enter or Space toggle the menu, ArrowDown opens it with the first item focused and
 * ArrowUp with the last. The menu is `role="menu"` of `menuitem` items: arrow keys, Home, End and typeahead
 * move between them, Enter and Space select, and Escape or Tab close it, returning focus to the trigger.
 *
 * @example
 * import { DropdownMenu, DropdownMenuItem, DropdownMenuPortal } from "@shadow-js/primitives";
 *
 * export function Options() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
 *       <DropdownMenuPortal>
 *         <DropdownMenu.Content>
 *           <DropdownMenuItem>New file</DropdownMenuItem>
 *         </DropdownMenu.Content>
 *       </DropdownMenuPortal>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuRoot}
 */
export const DropdownMenu: typeof DropdownMenuRoot & {
  readonly Trigger: typeof DropdownMenuTrigger;
  readonly Portal: typeof MenuPortal;
  readonly Content: typeof MenuContent;
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
} = Object.assign((props: Parameters<typeof DropdownMenuRoot>[0]) => DropdownMenuRoot(props), {
  Trigger: DropdownMenuTrigger,
  Portal: MenuPortal,
  Content: MenuContent,
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
