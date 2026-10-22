import { ComboboxContent } from "./content";
import { ComboboxInput } from "./input";
import { ComboboxItem } from "./item";
import {
  ComboboxAnchor,
  ComboboxArrow,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxLoading,
  ComboboxSeparator,
  ComboboxTrigger,
} from "./parts";
import { ComboboxPortal } from "./portal";
import { ComboboxRoot } from "./root";

export type { ComboboxContentOwnProps, ComboboxContentProps } from "./content";
export type {
  ComboboxInputChangeDetails,
  ComboboxInputChangeReason,
  ComboboxMultipleProps,
  ComboboxProps,
  ComboboxSingleProps,
} from "./context";
export type { ComboboxFilter, ComboboxFilterItem } from "./filter";
export { comboboxDefaultFilter, filterComboboxItems, normalizeSearchText } from "./filter";
export type { ComboboxInputProps } from "./input";
export type { ComboboxItemOwnProps, ComboboxItemProps } from "./item";
export type {
  ComboboxAnchorProps,
  ComboboxArrowProps,
  ComboboxChipData,
  ComboboxChipProps,
  ComboboxChipRemoveProps,
  ComboboxChipsProps,
  ComboboxClearProps,
  ComboboxEmptyProps,
  ComboboxGroupProps,
  ComboboxLabelProps,
  ComboboxLoadingProps,
  ComboboxSeparatorProps,
  ComboboxTriggerProps,
} from "./parts";
export type { ComboboxPortalProps } from "./portal";
export {
  ComboboxAnchor,
  ComboboxArrow,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxLoading,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxTrigger,
};

/**
 * The combobox primitive (WAI-ARIA 1.2 combobox with a listbox popup and list autocomplete):
 * `Combobox`, `Combobox.Input`, `Combobox.Trigger`, `Combobox.Clear`, `Combobox.Anchor`,
 * `Combobox.Portal`, `Combobox.Content`, `Combobox.Item`, `Combobox.Group`, `Combobox.Label`,
 * `Combobox.Separator`, `Combobox.Empty`, `Combobox.Loading`, `Combobox.Chips`, `Combobox.Chip`,
 * `Combobox.ChipRemove` and `Combobox.Arrow`. Each part is also exported by name
 * (`ComboboxInput`, ...) for tree shaking.
 *
 * Keyboard and ARIA (WAI-ARIA 1.2 combobox with a listbox popup): the input is `role="combobox"` and
 * keeps focus, pointing at the highlighted option with `aria-activedescendant`. ArrowDown and ArrowUp
 * open the list and move the highlight, Home and End jump to the ends, Enter selects the highlighted
 * option, Escape closes the list (a second Escape clears the field) and Tab closes it. The list is
 * `role="listbox"` of `role="option"` items.
 *
 * Highlight rule while the list changes under an open list (async results): the highlight stays
 * on the same value for as long as an item with that value is still rendered, and otherwise falls
 * back to the first item (`autoHighlight`) or to none. Typing always resets it.
 *
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Portal>
 *         <Combobox.Content>
 *           <Combobox.Item value="apple">Apple</Combobox.Item>
 *           <Combobox.Empty>No results</Combobox.Empty>
 *         </Combobox.Content>
 *       </Combobox.Portal>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxRoot}
 */
export const Combobox: typeof ComboboxRoot & {
  readonly Input: typeof ComboboxInput;
  readonly Trigger: typeof ComboboxTrigger;
  readonly Clear: typeof ComboboxClear;
  readonly Anchor: typeof ComboboxAnchor;
  readonly Portal: typeof ComboboxPortal;
  readonly Content: typeof ComboboxContent;
  readonly Item: typeof ComboboxItem;
  readonly Group: typeof ComboboxGroup;
  readonly Label: typeof ComboboxLabel;
  readonly Separator: typeof ComboboxSeparator;
  readonly Empty: typeof ComboboxEmpty;
  readonly Loading: typeof ComboboxLoading;
  readonly Chips: typeof ComboboxChips;
  readonly Chip: typeof ComboboxChip;
  readonly ChipRemove: typeof ComboboxChipRemove;
  readonly Arrow: typeof ComboboxArrow;
} = Object.assign((props: Parameters<typeof ComboboxRoot>[0]) => ComboboxRoot(props), {
  Input: ComboboxInput,
  Trigger: ComboboxTrigger,
  Clear: ComboboxClear,
  Anchor: ComboboxAnchor,
  Portal: ComboboxPortal,
  Content: ComboboxContent,
  Item: ComboboxItem,
  Group: ComboboxGroup,
  Label: ComboboxLabel,
  Separator: ComboboxSeparator,
  Empty: ComboboxEmpty,
  Loading: ComboboxLoading,
  Chips: ComboboxChips,
  Chip: ComboboxChip,
  ChipRemove: ComboboxChipRemove,
  Arrow: ComboboxArrow,
});
