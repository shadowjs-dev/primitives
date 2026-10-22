import { PopperAnchor } from "../popper/index";
import { MenuContent, MenuPortal } from "./content";
import {
  MenuArrow,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuItemIndicator,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
} from "./item";
import { MenuRoot } from "./root";
import { MenuSub, MenuSubContent, MenuSubTrigger } from "./sub";

export type { MenuContentOwnProps, MenuContentProps, MenuPortalProps } from "./content";
export type {
  GraceIntent,
  MenuContentContextValue,
  MenuContextValue,
  MenuEntry,
  MenuItemData,
  MenuRootContextValue,
} from "./context";
export { menuContentContext, menuContext, menuRootContext } from "./context";
export type { IntentBox, IntentPoint, SafeArea, SubmenuSide } from "./intent";
export { getSafeArea, isPointerHeadingToSubmenu, isPointInSafePolygon } from "./intent";
export type {
  MenuCheckboxItemOwnProps,
  MenuCheckboxItemProps,
  MenuGroupProps,
  MenuItemIndicatorProps,
  MenuItemOwnProps,
  MenuItemProps,
  MenuLabelProps,
  MenuRadioGroupOwnProps,
  MenuRadioGroupProps,
  MenuRadioItemOwnProps,
  MenuRadioItemProps,
  MenuSeparatorProps,
} from "./item";
export type { ModalityHandle } from "./modality";
export { trackModality } from "./modality";
export type { MenuProps } from "./root";
export type { MenuSubContentProps, MenuSubProps, MenuSubTriggerProps } from "./sub";
export {
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
  MenuRoot,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  PopperAnchor as MenuAnchor,
};

/**
 * The menu: a dropdown-style list of actions, checkable items, radio groups and submenus, built
 * from the parts `Menu.Anchor`, `Menu.Portal`, `Menu.Content`, `Menu.Item`, `Menu.CheckboxItem`,
 * `Menu.RadioGroup`, `Menu.RadioItem`, `Menu.ItemIndicator`, `Menu.Label`, `Menu.Group`,
 * `Menu.Separator`, `Menu.Arrow`, `Menu.Sub`, `Menu.SubTrigger` and `Menu.SubContent`. Each part is
 * also exported by name (`MenuItem`, ...). It renders no element of its own.
 *
 * Keyboard and ARIA: the content is `role="menu"`; items are `menuitem`, `menuitemcheckbox` or
 * `menuitemradio`; the arrow keys, Home, End and typeahead move between them; Enter and Space
 * activate an item; Escape closes the menu and returns focus to its trigger, or to the element that
 * had focus before the menu opened when there is no trigger part.
 *
 * @example
 * import { useSignal } from "@shadow-js/core";
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ActionsMenu() {
 *   const [open, setOpen] = useSignal(false);
 *   return (
 *     <Menu open={open()} onOpenChange={setOpen}>
 *       <Menu.Anchor>Actions</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Item onSelect={() => setOpen(false)}>Save</Menu.Item>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuRoot}
 * @since 1.0.0
 */
export const Menu: typeof MenuRoot & {
  readonly Anchor: typeof PopperAnchor;
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
} = Object.assign((props: Parameters<typeof MenuRoot>[0]) => MenuRoot(props), {
  Anchor: PopperAnchor,
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
