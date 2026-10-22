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
import { checkboxContext, stateOf } from "./context";

/**
 * Props of {@link CheckboxIndicator}. Accessibility: the indicator is a `span` with no role and no
 * keys; it is decorative and does not change what the checkbox announces. Data attributes:
 * `data-state` (`"checked"`, `"unchecked"` or `"indeterminate"`) and `data-disabled` (`""`, only
 * when the checkbox is disabled).
 * @see {@link CheckboxIndicator}
 * @since 1.0.0
 */
export type CheckboxIndicatorProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  {
    /** Keep the indicator mounted while unchecked (for animation libraries and CSS-only styling). @default false */
    readonly forceMount?: boolean | undefined;
  },
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Renders its children only while the checkbox is checked or indeterminate, and stays mounted
 * until an exit animation ends. Carries `data-state="checked" | "unchecked" | "indeterminate"` and
 * `data-disabled`. Accessibility: no role and no keys; the checkbox's `aria-checked` is what
 * assistive technology reads.
 *
 * @param props See {@link CheckboxIndicatorProps}.
 * @returns The rendered indicator, or nothing while it is unmounted.
 * @see {@link Checkbox}
 * @example
 * import { Checkbox } from "@shadow-js/primitives";
 *
 * export function MarkedBox() {
 *   return (
 *     <Checkbox defaultChecked>
 *       <Checkbox.Indicator>x</Checkbox.Indicator>
 *     </Checkbox>
 *   );
 * }
 * @since 1.0.0
 */
export function CheckboxIndicator<T extends PolymorphicTarget = "span">(
  props: CheckboxIndicatorProps<T>,
): JsxChild {
  const context = checkboxContext.use("Checkbox.Indicator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "forceMount"]);
  const presence = usePresence(() => context.checked() !== false || own.forceMount === true);
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return stateOf(context.checked());
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
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
