import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { switchContext } from "./context";

/**
 * Props of {@link SwitchThumb}: the attributes of the chosen element (a `span` by default).
 * @since 1.0.0
 * @see {@link SwitchThumb}
 */
export type SwitchThumbProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The part of the switch that moves. Renders a `span` with `data-state` (`"checked"` or
 * `"unchecked"`) and `data-disabled` (present, value `""`, while the switch is disabled) so a
 * stylesheet can translate it. It has no role and handles no keys: the root owns both. Must be
 * rendered inside {@link SwitchRoot}.
 *
 * @param props See {@link SwitchThumbProps}.
 * @returns The `span` element (or the element named by `as`).
 * @throws Error when rendered outside {@link SwitchRoot}: `<Switch.Thumb> must be used within <Switch>.`
 * @example
 * import { Switch } from "@shadow-js/primitives";
 *
 * export function ToggleKnob() {
 *   return (
 *     <Switch defaultChecked>
 *       <Switch.Thumb class="knob" />
 *     </Switch>
 *   );
 * }
 * @see {@link SwitchRoot}
 * @since 1.0.0
 */
export function SwitchThumb<T extends PolymorphicTarget = "span">(
  props: SwitchThumbProps<T>,
): JsxChild {
  const context = switchContext.use("Switch.Thumb");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return context.checked() ? "checked" : "unchecked";
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "span"} {...merged} />;
}
