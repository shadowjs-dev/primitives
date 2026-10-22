import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTarget } from "../utils/index";
import { ToggleGroupItem } from "./item";
import { type ToggleGroupProps, ToggleGroupRoot } from "./root";

export type { ToggleGroupContextValue } from "./context";
export { toggleGroupContext } from "./context";
export type { ToggleGroupItemOwnProps, ToggleGroupItemProps } from "./item";
export type {
  ToggleGroupCommonProps,
  ToggleGroupMultipleProps,
  ToggleGroupOwnProps,
  ToggleGroupProps,
  ToggleGroupSingleProps,
} from "./root";
export { ToggleGroupItem, ToggleGroupRoot };

/**
 * The toggle group primitive: `ToggleGroup` and `ToggleGroup.Item`. Each part is also exported by
 * name (`ToggleGroupRoot`, `ToggleGroupItem`) for tree shaking.
 *
 * Keyboard and ARIA: the group is a `role="group"` and, with roving focus (the default), one tab stop.
 * The arrow keys for its orientation, Home and End move focus between enabled items. Single-select
 * items are `role="radio"` with `aria-checked`; multiple-select items keep `aria-pressed`.
 *
 * @example
 * import { ToggleGroup } from "@shadow-js/primitives";
 *
 * export function AlignmentPicker() {
 *   return (
 *     <ToggleGroup type="single" defaultValue="center" aria-label="Alignment">
 *       <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
 *       <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
 *       <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
 *     </ToggleGroup>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ToggleGroupRoot}
 * @see {@link ToggleGroupItem}
 */
export const ToggleGroup: typeof ToggleGroupRoot & {
  readonly Item: typeof ToggleGroupItem;
} = Object.assign(
  <T extends PolymorphicTarget = "div">(props: ToggleGroupProps<T>): JsxChild =>
    ToggleGroupRoot(props),
  { Item: ToggleGroupItem },
);
