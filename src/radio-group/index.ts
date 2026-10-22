import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTarget } from "../utils/index";
import { RadioGroupIndicator } from "./indicator";
import { RadioGroupItem } from "./item";
import { type RadioGroupProps, RadioGroupRoot } from "./root";

export type { RadioGroupContextValue, RadioItemContextValue } from "./context";
export { radioGroupContext, radioItemContext } from "./context";
export type { RadioGroupIndicatorProps } from "./indicator";
export type { RadioGroupItemOwnProps, RadioGroupItemProps } from "./item";
export type { RadioGroupOwnProps, RadioGroupProps } from "./root";
export { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot };

/**
 * The radio group primitive: `RadioGroup`, `RadioGroup.Item` and `RadioGroup.Indicator`. Each
 * part is also exported by name (`RadioGroupRoot`, `RadioGroupItem`, `RadioGroupIndicator`) for
 * tree shaking. Keyboard: one tab stop; arrow keys move focus and check the item; Home and End
 * move focus without checking; Space checks; Enter does nothing; Tab leaves. ARIA:
 * `role="radiogroup"` on the root and `role="radio"` with `aria-checked` on each item.
 *
 * @example
 * import { RadioGroup } from "@shadow-js/primitives";
 *
 * export function Density() {
 *   return (
 *     <RadioGroup defaultValue="comfortable" name="density" aria-label="Density">
 *       <RadioGroup.Item value="compact">
 *         <RadioGroup.Indicator />
 *       </RadioGroup.Item>
 *       <RadioGroup.Item value="comfortable">
 *         <RadioGroup.Indicator />
 *       </RadioGroup.Item>
 *     </RadioGroup>
 *   );
 * }
 * @since 1.0.0
 * @see {@link RadioGroupRoot}
 * @see {@link RadioGroupItem}
 * @see {@link RadioGroupIndicator}
 */
export const RadioGroup: typeof RadioGroupRoot & {
  readonly Item: typeof RadioGroupItem;
  readonly Indicator: typeof RadioGroupIndicator;
} = Object.assign(
  <T extends PolymorphicTarget = "div">(props: RadioGroupProps<T>): JsxChild =>
    RadioGroupRoot(props),
  { Item: RadioGroupItem, Indicator: RadioGroupIndicator },
);
