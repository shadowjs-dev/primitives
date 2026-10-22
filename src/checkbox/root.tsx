import { onMount, splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  HiddenInput,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useControllableState,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { type CheckedState, checkboxContext, stateOf } from "./context";

/**
 * Own props of {@link CheckboxRoot}.
 *
 * Accessibility: the root is a `button` with `role="checkbox"` and `aria-checked` (`"true"`,
 * `"false"` or `"mixed"` for indeterminate). Space toggles it. Enter does nothing and does not
 * submit a surrounding form. A non-button `as` element gets `tabindex="0"` and is `aria-disabled`
 * when disabled. `required` sets `aria-required="true"`. Data attributes: `data-state` (`"checked"`,
 * `"unchecked"` or `"indeterminate"`) and `data-disabled` (`""`, only when disabled) on the root.
 * @see {@link CheckboxRoot}
 * @since 1.0.0
 */
export interface CheckboxOwnProps {
  /** Controlled state: `true`, `false` or `"indeterminate"`. `undefined` keeps it uncontrolled. @default none */
  readonly checked?: CheckedState | undefined;
  /** Initial state when uncontrolled. @default false */
  readonly defaultChecked?: CheckedState | undefined;
  /** Called with the new state when the user changes it. Clicking an indeterminate checkbox reports `true`. @default none */
  readonly onCheckedChange?: ((checked: CheckedState) => void) | undefined;
  /** Disables the checkbox and its form input; the root gets `data-disabled`. @default false */
  readonly disabled?: boolean | undefined;
  /** Makes the checkbox required for native form validation (it must be checked to submit). Exposed as `aria-required`. @default false */
  readonly required?: boolean | undefined;
  /** Name under which a checked checkbox is submitted. Without it no form input is rendered. @default none */
  readonly name?: string | undefined;
  /** Value submitted when checked. @default "on" */
  readonly value?: string | undefined;
  /** Id of the `<form>` the checkbox belongs to when it is not a descendant of one. @default none */
  readonly form?: string | undefined;
}

/**
 * Props of {@link Checkbox}: the own props and the attributes of the chosen element.
 * @see {@link CheckboxRoot}
 * @since 1.0.0
 */
export type CheckboxProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  CheckboxOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * A control that checks, unchecks or (tri-state) marks a choice as mixed. Follows the WAI-ARIA
 * checkbox pattern: a `button` with `role="checkbox"` and `aria-checked="true" | "false" |
 * "mixed"`, toggled with Space or a click. Keys: Space toggles; Enter does nothing, as the pattern
 * requires, so a checkbox inside a form never submits it by accident. Clicking an indeterminate
 * checkbox checks it.
 *
 * Controlled with `checked` / `onCheckedChange`, or uncontrolled with `defaultChecked`. With a
 * `name` it renders a visually hidden checkbox (with its `indeterminate` property set) so the
 * control takes part in native forms: `FormData`, `required`, `form="id"` and reset, which
 * restores `defaultChecked`.
 *
 * @param props See {@link CheckboxProps}.
 * @returns The rendered checkbox (and its hidden form input when it has a `name`).
 * @see {@link Checkbox}
 * @example
 * import { Checkbox } from "@shadow-js/primitives";
 *
 * export function TermsCheckbox() {
 *   return (
 *     <Checkbox name="terms" required>
 *       <Checkbox.Indicator>x</Checkbox.Indicator>
 *     </Checkbox>
 *   );
 * }
 * @since 1.0.0
 */
export function CheckboxRoot<T extends PolymorphicTarget = "button">(
  props: CheckboxProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "checked",
    "defaultChecked",
    "onCheckedChange",
    "disabled",
    "required",
    "name",
    "value",
    "form",
    "onClick",
    "onKeyDown",
  ]);
  const [checked, setChecked] = useControllableState<CheckedState>({
    value: () => own.checked as CheckedState | undefined,
    defaultValue: () => (own.defaultChecked as CheckedState | undefined) ?? false,
    onChange: () => own.onCheckedChange as ((checked: CheckedState) => void) | undefined,
    name: "Checkbox checked",
  });
  const disabled = (): boolean => own.disabled === true;
  const native = (): boolean => (own.as ?? "button") === "button";
  const toggle = (): void => {
    if (disabled()) return;
    // An indeterminate box becomes checked rather than unchecked: "mixed" is never the result of a click.
    const current = checked();
    setChecked(current === "indeterminate" ? true : !current);
  };

  let element: HTMLElement | undefined;
  // See Switch: the hidden input must know its default, or a native reset would uncheck it.
  onMount(() => {
    const hidden = element?.nextElementSibling;
    if (hidden instanceof HTMLInputElement) {
      hidden.defaultChecked = untrack(() => own.defaultChecked === true);
    }
  });

  const merged = mergeElementProps(
    {
      get type() {
        return native() ? "button" : undefined;
      },
      role: "checkbox",
      get "aria-checked"() {
        const current = checked();
        return current === "indeterminate" ? "mixed" : current;
      },
      get "aria-required"() {
        return own.required === true ? true : undefined;
      },
      get "aria-disabled"() {
        return !native() && disabled() ? true : undefined;
      },
      get "data-state"() {
        return stateOf(checked());
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      get disabled() {
        return native() && disabled() ? true : undefined;
      },
      get tabindex() {
        return native() ? undefined : disabled() ? undefined : 0;
      },
    },
    rest,
    {
      ref: (node: HTMLElement) => {
        element = node;
      },
      onClick: composeEventHandlers(() => own.onClick, toggle),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown,
        (event: KeyboardEvent) => {
          // WAI-ARIA: Enter must not toggle a checkbox (and must not submit the surrounding form).
          if (event.key === "Enter") {
            event.preventDefault();
            return;
          }
          // A native button already clicks on Space; handling the key as well would toggle twice.
          if (event.key !== " " || event.currentTarget instanceof HTMLButtonElement) return;
          event.preventDefault();
          toggle();
        },
      ),
    },
  );

  return (
    <checkboxContext.Provider value={{ checked, disabled }}>
      <Polymorphic as={own.as ?? "button"} {...merged} />
      <HiddenInput
        type="checkbox"
        name={own.name as string | undefined}
        value={own.value as string | undefined}
        checked={checked() === true}
        indeterminate={checked() === "indeterminate"}
        required={own.required as boolean | undefined}
        disabled={own.disabled as boolean | undefined}
        form={own.form as string | undefined}
        onReset={() => setChecked((own.defaultChecked as CheckedState | undefined) ?? false)}
      />
    </checkboxContext.Provider>
  );
}
