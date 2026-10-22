import { onMount, splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  HiddenInput,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { radioGroupContext, radioItemContext } from "./context";

/**
 * Own props of {@link RadioGroupItem}.
 *
 * Accessibility: each item is `role="radio"` with `aria-checked`; a non-button item (`as` other
 * than `button`) also gets `aria-disabled` when disabled. Keys: Space and click check the item; Enter
 * is canceled, so it neither checks nor submits the form; the arrow keys, Home and End are handled by
 * the group (see {@link RadioGroupRoot}). Data attributes: `data-state` (`"checked"` or
 * `"unchecked"`) and `data-disabled` (empty, when disabled).
 * @see {@link RadioGroupItem}
 * @since 1.0.0
 */
export interface RadioGroupItemOwnProps {
  /**
   * The group's value while this item is checked. Unique within the group.
   * @default none (required)
   */
  readonly value: string;
  /**
   * Disables this item.
   * @default false
   */
  readonly disabled?: boolean | undefined;
  /**
   * Marks this item's native radio as required (the group's `required` already does).
   * @default false
   */
  readonly required?: boolean | undefined;
}

/**
 * Props of {@link RadioGroupItem}.
 * @see {@link RadioGroupItem}
 * @since 1.0.0
 */
export type RadioGroupItemProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  RadioGroupItemOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const ARROWS: ReadonlySet<string> = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

/**
 * One radio of a group: a `button` with `role="radio"`, `aria-checked` and
 * `data-state="checked" | "unchecked"`. Keyboard: Space or click checks it; Enter is canceled and
 * does nothing; arrow keys move focus to the neighbor and check it (see {@link RadioGroupRoot}).
 * A checked radio stays checked (a radio is never unchecked by pressing it again). Renders a hidden
 * native radio after itself when the group has a `name`.
 *
 * @param props See {@link RadioGroupItemProps}.
 * @returns The item element, followed by its hidden native input when the group has a `name`.
 * @example
 * import { RadioGroup } from "@shadow-js/primitives";
 *
 * export function ProPlan() {
 *   return (
 *     <RadioGroup.Item value="pro" aria-label="Pro plan">
 *       <RadioGroup.Indicator />
 *     </RadioGroup.Item>
 *   );
 * }
 * @since 1.0.0
 * @see {@link RadioGroupRoot}
 * @see {@link RadioGroupIndicator}
 */
export function RadioGroupItem<T extends PolymorphicTarget = "button">(
  props: RadioGroupItemProps<T>,
): JsxChild {
  const group = radioGroupContext.use("RadioGroup.Item");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "value", "disabled", "required"]);
  const value = (): string => own.value as string;
  const disabled = (): boolean => group.disabled() || own.disabled === true;
  const checked = (): boolean => group.value() === value();
  const native = (): boolean => (own.as ?? "button") === "button";
  const roving = group.roving.item({ id: value, disabled, active: checked });
  const check = (): void => {
    if (!disabled() && !checked()) group.check(value());
  };

  let element: HTMLElement | undefined;
  // See Switch: the hidden radio must know its default, or a native reset would uncheck it.
  onMount(() => {
    const hidden = element?.nextElementSibling;
    if (hidden instanceof HTMLInputElement) {
      hidden.defaultChecked = untrack(() => group.defaultValue() === value());
    }
  });

  const merged = mergeElementProps(
    roving,
    {
      get type() {
        return native() ? "button" : undefined;
      },
      role: "radio",
      get value() {
        return value();
      },
      get "aria-checked"() {
        return checked();
      },
      get "aria-disabled"() {
        return !native() && disabled() ? true : undefined;
      },
      get "data-state"() {
        return checked() ? "checked" : "unchecked";
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      get disabled() {
        return native() && disabled() ? true : undefined;
      },
      ref: (node: HTMLElement) => {
        element = node;
      },
      onClick: (event: MouseEvent) => {
        if (!event.defaultPrevented) check();
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (event.defaultPrevented) return;
        // WAI-ARIA: radios are not activated by Enter, so Enter must not submit the form either.
        if (event.key === "Enter") {
          event.preventDefault();
          return;
        }
        if (ARROWS.has(event.key) && !event.shiftKey && !event.ctrlKey && !event.altKey) {
          group.arrow.set(true);
          return;
        }
        // A native button already clicks on Space; handling the key as well would check twice.
        if (event.key === " " && !(event.currentTarget instanceof HTMLButtonElement)) {
          event.preventDefault();
          check();
        }
      },
      onKeyUp: () => group.arrow.set(false),
      onFocus: () => {
        // Selection follows focus, but only when the arrow keys moved it here.
        if (!group.arrow.active()) return;
        group.arrow.set(false);
        check();
      },
    },
    rest,
  );

  return (
    <radioItemContext.Provider value={{ checked, disabled }}>
      <Polymorphic as={own.as ?? "button"} {...merged} />
      <HiddenInput
        type="radio"
        name={group.name()}
        value={value()}
        checked={checked()}
        required={group.required() || own.required === true}
        disabled={disabled()}
        form={group.form()}
        onReset={group.reset}
      />
    </radioItemContext.Provider>
  );
}
