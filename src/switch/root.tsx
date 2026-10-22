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
import { switchContext } from "./context";

/**
 * Own props of {@link SwitchRoot}, on top of the attributes of the chosen element (a `button` by
 * default).
 *
 * Accessibility: the root has `role="switch"` and `aria-checked` (`"true"` or `"false"`), and
 * `aria-required="true"` while `required` is set. A click, Space or Enter toggles it; see
 * {@link SwitchRoot} for the keys on other elements.
 *
 * Data attributes: `data-state` (`"checked"` or `"unchecked"`) on the root and on {@link SwitchThumb};
 * `data-disabled` (present, value `""`) on both while the switch is disabled.
 * @since 1.0.0
 * @see {@link SwitchRoot}
 */
export interface SwitchOwnProps {
  /**
   * Controlled checked state. Controlled when set (not `undefined`): the switch shows this value and
   * reports each change only through `onCheckedChange`.
   * @default none (uncontrolled)
   */
  readonly checked?: boolean | undefined;
  /**
   * Initial checked state when uncontrolled. A form reset returns to this value.
   * @default `false`
   */
  readonly defaultChecked?: boolean | undefined;
  /**
   * Called with the new state each time it changes: after a click or key press, and when a form
   * reset changes it.
   * @default none
   */
  readonly onCheckedChange?: ((checked: boolean) => void) | undefined;
  /**
   * Disables the switch and its form input. Clicks and keys do nothing.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
  /**
   * Makes the switch required for native form validation: the form does not submit until the
   * switch is on.
   * @default `false`
   */
  readonly required?: boolean | undefined;
  /**
   * Name under which a checked switch is submitted. Without it no form input is rendered.
   * @default none
   */
  readonly name?: string | undefined;
  /**
   * Value submitted when checked.
   * @default `"on"`
   */
  readonly value?: string | undefined;
  /**
   * Id of the `<form>` the switch belongs to when it is not a descendant of one.
   * @default none
   */
  readonly form?: string | undefined;
}

/**
 * Props of {@link SwitchRoot}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link SwitchOwnProps}
 */
export type SwitchProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  SwitchOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * A control that switches one setting on or off. Follows the WAI-ARIA switch pattern: a `button`
 * with `role="switch"` and `aria-checked`, toggled by a click, Space or Enter.
 *
 * Keyboard and ARIA: on a native `button` the browser turns Space and Enter into a click, so the
 * switch listens only to `click`. When `as` renders another element, the switch handles Space and
 * Enter itself (and never toggles twice), gets `tabindex="0"` unless disabled, and reports
 * `aria-disabled="true"` while disabled. A `click` handler that calls `preventDefault` vetoes the toggle. Data attributes:
 * `data-state` and `data-disabled` on the root (see {@link SwitchOwnProps}).
 *
 * Controlled with `checked` / `onCheckedChange`, or uncontrolled with `defaultChecked`. With a
 * `name` it renders a visually hidden checkbox so the switch takes part in native forms (`FormData`,
 * `required`, `form="id"`; a form reset restores `defaultChecked`).
 *
 * @param props See {@link SwitchProps}.
 * @returns The rendered switch root, followed by its hidden checkbox when `name` is set.
 * @example
 * import { Switch } from "@shadow-js/primitives";
 *
 * export function AirplaneMode() {
 *   return (
 *     <Switch name="airplane" defaultChecked onCheckedChange={(on) => console.log(on)}>
 *       <Switch.Thumb />
 *     </Switch>
 *   );
 * }
 * @see {@link Switch}
 * @see {@link SwitchThumb}
 * @since 1.0.0
 */
export function SwitchRoot<T extends PolymorphicTarget = "button">(
  props: SwitchProps<T>,
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
  const [checked, setChecked] = useControllableState<boolean>({
    value: () => own.checked as boolean | undefined,
    defaultValue: () => own.defaultChecked === true,
    onChange: () => own.onCheckedChange as ((checked: boolean) => void) | undefined,
    name: "Switch checked",
  });
  const disabled = (): boolean => own.disabled === true;
  const native = (): boolean => (own.as ?? "button") === "button";
  const toggle = (): void => {
    if (!disabled()) setChecked(!checked());
  };

  let element: HTMLElement | undefined;
  // The hidden input is created with its checked state as a property, so a native form reset would
  // fall back to "unchecked" even when the switch defaults to on. Telling the input its default
  // keeps the two in agreement; the reset handler below then only has to restore the state.
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
      role: "switch",
      get "aria-checked"() {
        return checked();
      },
      get "aria-required"() {
        return own.required === true ? true : undefined;
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
          // A native button already clicks on Space and Enter; handling the key as well would toggle twice.
          if (event.currentTarget instanceof HTMLButtonElement) return;
          if (event.key !== " " && event.key !== "Enter") return;
          event.preventDefault();
          toggle();
        },
      ),
    },
  );

  return (
    <switchContext.Provider value={{ checked, disabled }}>
      <Polymorphic as={own.as ?? "button"} {...merged} />
      <HiddenInput
        type="checkbox"
        name={own.name as string | undefined}
        value={own.value as string | undefined}
        checked={checked()}
        required={own.required as boolean | undefined}
        disabled={own.disabled as boolean | undefined}
        form={own.form as string | undefined}
        onReset={() => setChecked(own.defaultChecked === true)}
      />
    </switchContext.Provider>
  );
}
