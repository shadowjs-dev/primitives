import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { ToggleImpl } from "../toggle/toggle";
import { mergeElementProps, type PolymorphicProps, type PolymorphicTarget } from "../utils/index";
import { partProps } from "../utils/part-props";
import { toggleGroupContext } from "./context";

/**
 * Own props of {@link ToggleGroupItem}, on top of the attributes of the chosen element (a `button` by
 * default).
 *
 * Accessibility: in a `type="single"` group the item is a `role="radio"` with `aria-checked`; in a
 * `type="multiple"` group it keeps `aria-pressed`. Space and Enter press it (a native button turns them
 * into a click; another element is handled by the item), and a disabled item on another element gets
 * `aria-disabled="true"`. With roving focus the arrow keys, Home and End move focus between items.
 *
 * Data attributes: `data-state` (`"on"` or `"off"`), `data-disabled` (present, value `""`) while
 * disabled, and `data-orientation` when the group has an orientation and roving focus is on.
 * @since 1.0.0
 * @see {@link ToggleGroupItem}
 */
export interface ToggleGroupItemOwnProps {
  /**
   * The value this item adds to the group when pressed. Unique within the group.
   * @default none (required)
   */
  readonly value: string;
  /**
   * Disables this item: it cannot be pressed and the arrow keys skip it. A disabled group disables every item.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link ToggleGroupItem}: the own props and the attributes of the chosen element (a `button`
 * by default).
 * @since 1.0.0
 * @see {@link ToggleGroupItemOwnProps}
 */
export type ToggleGroupItemProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  ToggleGroupItemOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * One toggle of a group. In a `type="single"` group it is a `role="radio"` with `aria-checked`; in a
 * `type="multiple"` group it keeps `aria-pressed`. Both carry `data-state="on" | "off"`.
 *
 * Keyboard and ARIA: Space and Enter press the focused item, and a click does too. With roving focus
 * only one item of the group is in the tab order, and the arrow keys, Home and End move focus between
 * enabled items. A click handler that calls `preventDefault` vetoes the press.
 *
 * @param props See {@link ToggleGroupItemProps}.
 * @returns The rendered item.
 * @throws Error when rendered outside {@link ToggleGroupRoot}, with the message `[primitives] <ToggleGroup.Item> must be used within <ToggleGroup>.`
 * @example
 * import { ToggleGroup } from "@shadow-js/primitives";
 *
 * export function TextStyle() {
 *   return (
 *     <ToggleGroup type="multiple" aria-label="Text style">
 *       <ToggleGroup.Item value="bold" aria-label="Bold">
 *         B
 *       </ToggleGroup.Item>
 *       <ToggleGroup.Item value="italic" aria-label="Italic">
 *         I
 *       </ToggleGroup.Item>
 *     </ToggleGroup>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ToggleGroupRoot}
 * @see {@link ToggleGroupItemOwnProps}
 */
export function ToggleGroupItem<T extends PolymorphicTarget = "button">(
  props: ToggleGroupItemProps<T>,
): JsxChild {
  const context = toggleGroupContext.use("ToggleGroup.Item");
  const [own, rest] = splitProps(partProps<Loose>(props), ["value", "disabled"]);
  const value = (): string => own.value as string;
  const disabled = (): boolean => context.disabled() || own.disabled === true;
  const pressed = (): boolean => context.value().includes(value());
  const roving = context.roving.item({ id: value, disabled, active: pressed });

  const merged = mergeElementProps(
    // Roving focus gives the item its tab stop and arrow keys; without it every item is a tab stop.
    () => (context.rovingFocus() ? roving : undefined),
    rest,
    {
      get pressed() {
        return pressed();
      },
      onPressedChange: (next: boolean) => {
        if (next) context.activate(value());
        else context.deactivate(value());
      },
      get disabled() {
        return disabled();
      },
    },
  );
  return ToggleImpl(
    merged,
    context.type() === "single" ? "checked" : "pressed",
    "ToggleGroup.Item pressed",
  );
}
