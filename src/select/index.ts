import { SelectContent } from "./content";
import { SelectItem, SelectItemIndicator, SelectItemText } from "./item";
import {
  SelectArrow,
  SelectGroup,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
} from "./parts";
import { SelectPortal } from "./portal";
import { SelectRoot } from "./root";
import { SelectTrigger } from "./trigger";
import { SelectIcon, SelectValue } from "./value";
import { SelectViewport } from "./viewport";

export type { SelectContentOwnProps, SelectContentProps } from "./content";
export type { SelectContextValue, SelectItemData, SelectProps } from "./context";
export { createSelectContext, selectContext } from "./context";
export type {
  SelectItemIndicatorProps,
  SelectItemOwnProps,
  SelectItemProps,
  SelectItemTextProps,
} from "./item";
export type { SelectItemAlignedContentProps } from "./item-aligned";
export { SelectItemAlignedContent } from "./item-aligned";
export type { SelectTargetInput } from "./logic";
export {
  getInitialSelectIndex,
  getSelectScrollDelta,
  getSelectTarget,
  SELECT_PAGE_SIZE,
} from "./logic";
export type {
  SelectArrowProps,
  SelectGroupProps,
  SelectLabelProps,
  SelectScrollButtonProps,
  SelectSeparatorProps,
} from "./parts";
export type { SelectPortalProps } from "./portal";
export type { SelectTriggerProps } from "./trigger";
export type { SelectIconProps, SelectValueOwnProps, SelectValueProps } from "./value";
export type { SelectViewportProps } from "./viewport";
export {
  SelectArrow,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
};

/**
 * The select primitive: `Select`, `Select.Trigger`, `Select.Value`, `Select.Icon`,
 * `Select.Portal`, `Select.Content`, `Select.Viewport`, `Select.Group`, `Select.Label`,
 * `Select.Item`, `Select.ItemText`, `Select.ItemIndicator`, `Select.Separator`,
 * `Select.ScrollUpButton`, `Select.ScrollDownButton` and `Select.Arrow`. Each part is also
 * exported by name (`SelectTrigger`, ...) for tree shaking.
 *
 * Keyboard: on the closed trigger, Enter, Space, ArrowDown and ArrowUp open the listbox, and typing
 * selects the matching item without opening it. In the open listbox ArrowDown, ArrowUp, Home, End,
 * PageDown and PageUp move focus, Enter and Space select the focused item, typing jumps to a match,
 * Escape and Tab close it (Tab without selecting). ARIA: the trigger is a `combobox` with
 * `aria-haspopup="listbox"` and `aria-expanded` (plus `aria-controls` while open); the listbox is a
 * `listbox` of `option` elements with `aria-selected`.
 *
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select defaultValue="apple" name="fruit">
 *   <Select.Trigger><Select.Value placeholder="Pick a fruit" /><Select.Icon /></Select.Trigger>
 *   <Select.Portal>
 *     <Select.Content>
 *       <Select.Viewport>
 *         <Select.Item value="apple"><Select.ItemText>Apple</Select.ItemText></Select.Item>
 *         <Select.Item value="pear"><Select.ItemText>Pear</Select.ItemText></Select.Item>
 *       </Select.Viewport>
 *     </Select.Content>
 *   </Select.Portal>
 * </Select>;
 * @see {@link SelectRoot}
 * @see {@link SelectContent}
 * @since 1.0.0
 */
export const Select: typeof SelectRoot & {
  readonly Trigger: typeof SelectTrigger;
  readonly Value: typeof SelectValue;
  readonly Icon: typeof SelectIcon;
  readonly Portal: typeof SelectPortal;
  readonly Content: typeof SelectContent;
  readonly Viewport: typeof SelectViewport;
  readonly Group: typeof SelectGroup;
  readonly Label: typeof SelectLabel;
  readonly Item: typeof SelectItem;
  readonly ItemText: typeof SelectItemText;
  readonly ItemIndicator: typeof SelectItemIndicator;
  readonly Separator: typeof SelectSeparator;
  readonly ScrollUpButton: typeof SelectScrollUpButton;
  readonly ScrollDownButton: typeof SelectScrollDownButton;
  readonly Arrow: typeof SelectArrow;
} = Object.assign((props: Parameters<typeof SelectRoot>[0]) => SelectRoot(props), {
  Trigger: SelectTrigger,
  Value: SelectValue,
  Icon: SelectIcon,
  Portal: SelectPortal,
  Content: SelectContent,
  Viewport: SelectViewport,
  Group: SelectGroup,
  Label: SelectLabel,
  Item: SelectItem,
  ItemText: SelectItemText,
  ItemIndicator: SelectItemIndicator,
  Separator: SelectSeparator,
  ScrollUpButton: SelectScrollUpButton,
  ScrollDownButton: SelectScrollDownButton,
  Arrow: SelectArrow,
});
