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
import { MenubarContent } from "./content";
import { MenubarMenu } from "./menu";
import { MenubarRoot } from "./root";
import { MenubarTrigger } from "./trigger";

export type { MenubarContentProps } from "./content";
export type { MenubarMenuProps } from "./menu";
export type { MenubarOwnProps, MenubarProps } from "./root";
export type { MenubarTriggerOwnProps, MenubarTriggerProps } from "./trigger";
export { MenubarContent, MenubarMenu, MenubarRoot, MenubarTrigger };

/**
 * Renders the menu of a `Menubar.Menu` into `document.body` (or `container`) while it is open, and
 * keeps it there until its exit animation has finished. It is the menu's `Menu.Portal` under the
 * menubar name; it renders no element and handles no keys of its own.
 *
 * @example
 * import { Menubar, MenubarPortal } from "@shadow-js/primitives/menubar";
 *
 * function FileMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="file">
 *         <Menubar.Trigger>File</Menubar.Trigger>
 *         <MenubarPortal>
 *           <Menubar.Content>
 *             <Menubar.Item>New</Menubar.Item>
 *           </Menubar.Content>
 *         </MenubarPortal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuPortal}
 * @since 1.0.0
 */
export const MenubarPortal: typeof MenuPortal = MenuPortal;
/**
 * An action in a menubar menu: `role="menuitem"`, activated by Enter, Space or a click. Selecting it
 * closes the menu unless `onSelect` calls `preventDefault()`. Same behavior as `Menu.Item`.
 *
 * @example
 * import { Menubar, MenubarItem } from "@shadow-js/primitives/menubar";
 *
 * function EditMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="edit">
 *         <Menubar.Trigger>Edit</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarItem>Undo</MenubarItem>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuItem}
 * @since 1.0.0
 */
export const MenubarItem: typeof MenuItem = MenuItem;
/**
 * A toggle item in a menubar menu: `role="menuitemcheckbox"` with `aria-checked` and `data-state`.
 * Same behavior as `Menu.CheckboxItem`.
 *
 * @example
 * import { Menubar, MenubarCheckboxItem } from "@shadow-js/primitives/menubar";
 *
 * function ViewMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="view">
 *         <Menubar.Trigger>View</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarCheckboxItem defaultChecked>
 *               <Menubar.ItemIndicator>On</Menubar.ItemIndicator> Grid
 *             </MenubarCheckboxItem>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuCheckboxItem}
 * @since 1.0.0
 */
export const MenubarCheckboxItem: typeof MenuCheckboxItem = MenuCheckboxItem;
/**
 * A group of mutually exclusive `MenubarRadioItem`s: `role="group"`. Same behavior as
 * `Menu.RadioGroup`.
 *
 * @example
 * import { Menubar, MenubarRadioGroup } from "@shadow-js/primitives/menubar";
 *
 * function LayoutMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="view">
 *         <Menubar.Trigger>View</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarRadioGroup defaultValue="list">
 *               <Menubar.RadioItem value="list">List</Menubar.RadioItem>
 *               <Menubar.RadioItem value="grid">Grid</Menubar.RadioItem>
 *             </MenubarRadioGroup>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuRadioGroup}
 * @since 1.0.0
 */
export const MenubarRadioGroup: typeof MenuRadioGroup = MenuRadioGroup;
/**
 * An item of a `MenubarRadioGroup`: `role="menuitemradio"` with `aria-checked` and `data-state`.
 * Same behavior as `Menu.RadioItem`.
 *
 * @example
 * import { Menubar, MenubarRadioItem } from "@shadow-js/primitives/menubar";
 *
 * function LayoutMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="view">
 *         <Menubar.Trigger>View</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <Menubar.RadioGroup defaultValue="list">
 *               <MenubarRadioItem value="list">List</MenubarRadioItem>
 *             </Menubar.RadioGroup>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuRadioItem}
 * @since 1.0.0
 */
export const MenubarRadioItem: typeof MenuRadioItem = MenuRadioItem;
/**
 * Renders its children while the enclosing checkbox or radio item is checked (or indeterminate).
 * It has no role and handles no keys; `data-state` mirrors the item. Same behavior as
 * `Menu.ItemIndicator`.
 *
 * @example
 * import { Menubar, MenubarItemIndicator } from "@shadow-js/primitives/menubar";
 *
 * function ViewMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="view">
 *         <Menubar.Trigger>View</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <Menubar.CheckboxItem defaultChecked>
 *               <MenubarItemIndicator>On</MenubarItemIndicator> Grid
 *             </Menubar.CheckboxItem>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuItemIndicator}
 * @since 1.0.0
 */
export const MenubarItemIndicator: typeof MenuItemIndicator = MenuItemIndicator;
/**
 * A heading in a menubar menu: no role, not focusable, and skipped by the keyboard. Same behavior
 * as `Menu.Label`.
 *
 * @example
 * import { Menubar, MenubarLabel } from "@shadow-js/primitives/menubar";
 *
 * function ViewMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="view">
 *         <Menubar.Trigger>View</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarLabel>Layout</MenubarLabel>
 *             <Menubar.Item>Zoom in</Menubar.Item>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuLabel}
 * @since 1.0.0
 */
export const MenubarLabel: typeof MenuLabel = MenuLabel;
/**
 * A group of items in a menubar menu: `role="group"`. Same behavior as `Menu.Group`.
 *
 * @example
 * import { Menubar, MenubarGroup } from "@shadow-js/primitives/menubar";
 *
 * function EditMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="edit">
 *         <Menubar.Trigger>Edit</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarGroup aria-label="Clipboard">
 *               <Menubar.Item>Cut</Menubar.Item>
 *               <Menubar.Item>Copy</Menubar.Item>
 *             </MenubarGroup>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuGroup}
 * @since 1.0.0
 */
export const MenubarGroup: typeof MenuGroup = MenuGroup;
/**
 * A divider in a menubar menu: `role="separator"` with `aria-orientation="horizontal"`. Same
 * behavior as `Menu.Separator`.
 *
 * @example
 * import { Menubar, MenubarSeparator } from "@shadow-js/primitives/menubar";
 *
 * function EditMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="edit">
 *         <Menubar.Trigger>Edit</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <Menubar.Item>Cut</Menubar.Item>
 *             <MenubarSeparator />
 *             <Menubar.Item>Paste</Menubar.Item>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuSeparator}
 * @since 1.0.0
 */
export const MenubarSeparator: typeof MenuSeparator = MenuSeparator;
/**
 * An arrow pointing at the trigger, for a `Menubar.Content`. Style it with `fill`. Same behavior as
 * `Menu.Arrow`.
 *
 * @example
 * import { Menubar, MenubarArrow } from "@shadow-js/primitives/menubar";
 *
 * function FileMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="file">
 *         <Menubar.Trigger>File</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarArrow class="fill-white" />
 *             <Menubar.Item>New</Menubar.Item>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuArrow}
 * @since 1.0.0
 */
export const MenubarArrow: typeof MenuArrow = MenuArrow;
/**
 * The root of a submenu inside a `Menubar.Content`. It renders no element and holds the submenu's
 * open state. Same behavior as `Menu.Sub`.
 *
 * @example
 * import { Menubar, MenubarSub } from "@shadow-js/primitives/menubar";
 *
 * function FileMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="file">
 *         <Menubar.Trigger>File</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarSub>
 *               <Menubar.SubTrigger>Share</Menubar.SubTrigger>
 *               <Menubar.SubContent>
 *                 <Menubar.Item>Email</Menubar.Item>
 *               </Menubar.SubContent>
 *             </MenubarSub>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuSub}
 * @since 1.0.0
 */
export const MenubarSub: typeof MenuSub = MenuSub;
/**
 * The item that opens a submenu in a menubar menu: `role="menuitem"` with `aria-haspopup="menu"`.
 * Same behavior as `Menu.SubTrigger`: ArrowRight (ArrowLeft in RTL) opens it.
 *
 * @example
 * import { Menubar, MenubarSub, MenubarSubTrigger } from "@shadow-js/primitives/menubar";
 *
 * function FileMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="file">
 *         <Menubar.Trigger>File</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarSub>
 *               <MenubarSubTrigger>Share</MenubarSubTrigger>
 *               <Menubar.SubContent>
 *                 <Menubar.Item>Email</Menubar.Item>
 *               </Menubar.SubContent>
 *             </MenubarSub>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuSubTrigger}
 * @since 1.0.0
 */
export const MenubarSubTrigger: typeof MenuSubTrigger = MenuSubTrigger;
/**
 * The submenu of a `MenubarSub`: `role="menu"`, placed beside its trigger. ArrowLeft (ArrowRight in
 * RTL) and Escape close it. Same behavior as `Menu.SubContent`.
 *
 * @example
 * import { Menubar, MenubarSub, MenubarSubContent } from "@shadow-js/primitives/menubar";
 *
 * function FileMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="file">
 *         <Menubar.Trigger>File</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <MenubarSub>
 *               <Menubar.SubTrigger>Share</Menubar.SubTrigger>
 *               <MenubarSubContent sideOffset={2}>
 *                 <Menubar.Item>Email</Menubar.Item>
 *               </MenubarSubContent>
 *             </MenubarSub>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuSubContent}
 * @since 1.0.0
 */
export const MenubarSubContent: typeof MenuSubContent = MenuSubContent;

/**
 * A horizontal bar of menus: `Menubar`, `Menubar.Menu`, `Menubar.Trigger`, `Menubar.Portal`,
 * `Menubar.Content` and every menu part. Each part is also exported by name (`MenubarItem`, ...)
 * for tree shaking. The bar itself renders the `role="menubar"` element.
 *
 * Keyboard and ARIA: the triggers are `menuitem` buttons that share one tab stop; ArrowLeft and
 * ArrowRight (swapped in RTL) move between them, and ArrowDown, Enter or Space open the focused
 * menu. Inside an open menu, ArrowLeft and ArrowRight move to the neighboring menu, and Escape
 * closes it.
 *
 * @example
 * import { Menubar } from "@shadow-js/primitives/menubar";
 *
 * function AppMenubar() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="file">
 *         <Menubar.Trigger>File</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <Menubar.Item>New</Menubar.Item>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenubarRoot}
 * @since 1.0.0
 */
export const Menubar: typeof MenubarRoot & {
  readonly Menu: typeof MenubarMenu;
  readonly Trigger: typeof MenubarTrigger;
  readonly Portal: typeof MenuPortal;
  readonly Content: typeof MenubarContent;
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
} = Object.assign((props: Parameters<typeof MenubarRoot>[0]) => MenubarRoot(props), {
  Menu: MenubarMenu,
  Trigger: MenubarTrigger,
  Portal: MenuPortal,
  Content: MenubarContent,
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
