import { splitProps } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { radioItemContext } from "./context";

/**
 * Props of {@link RadioGroupIndicator}. Accessibility: none; the indicator is decorative and the
 * item's `aria-checked` is what is announced. Data attributes: `data-state` (`"checked"` or
 * `"unchecked"`) and `data-disabled` (empty, when the item is disabled).
 * @see {@link RadioGroupIndicator}
 * @since 1.0.0
 */
export type RadioGroupIndicatorProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  {
    /**
     * Keep the indicator mounted while unchecked (for animation libraries and CSS-only styling).
     * @default false
     */
    readonly forceMount?: boolean | undefined;
  },
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Renders only while its radio is checked, and stays mounted until an exit animation ends.
 * Carries `data-state="checked" | "unchecked"` and `data-disabled`. Keyboard: none; it is not
 * focusable. ARIA: none; the item's `aria-checked` carries the state.
 *
 * @param props See {@link RadioGroupIndicatorProps}.
 * @returns The indicator element while mounted, else nothing.
 * @example
 * import { RadioGroup } from "@shadow-js/primitives";
 *
 * export function Dot() {
 *   return (
 *     <RadioGroup.Item value="a">
 *       <RadioGroup.Indicator class="dot" />
 *     </RadioGroup.Item>
 *   );
 * }
 * @since 1.0.0
 * @see {@link RadioGroupItem}
 */
export function RadioGroupIndicator<T extends PolymorphicTarget = "span">(
  props: RadioGroupIndicatorProps<T>,
): JsxChild {
  const item = radioItemContext.use("RadioGroup.Indicator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "forceMount"]);
  const presence = usePresence(() => item.checked() || own.forceMount === true);
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return item.checked() ? "checked" : "unchecked";
      },
      get "data-disabled"() {
        return item.disabled() ? "" : undefined;
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>(presence.ref) },
  );
  return (
    <Show when={presence.mounted()}>
      <Polymorphic as={own.as ?? "span"} {...merged} />
    </Show>
  );
}
