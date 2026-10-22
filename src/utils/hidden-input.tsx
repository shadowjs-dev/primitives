/**
 * Native form integration for custom controls. A switch, checkbox, radio, select or slider is
 * rendered as ARIA markup; this renders the real `<input>` next to it so the control takes part
 * in `<form>` submission, `FormData`, `required` validation, `form="id"` association and
 * form reset. The input is visually hidden, ignored by assistive technology and out of the tab
 * order; the custom control stays the only thing the user interacts with.
 * @packageDocumentation
 */
import { onCleanup, untrack, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";

/**
 * Props of {@link HiddenInput}. Accessibility: the rendered input has `aria-hidden="true"` and
 * `tabindex="-1"`, so it is out of the tab order and invisible to assistive technology; the custom
 * control stays the accessible element. Data attributes: none are set. The input has no keys.
 * @see {@link HiddenInput}
 * @since 1.0.0
 */
export interface HiddenInputProps {
  /**
   * The input type that matches the control's value: `checkbox` and `radio` use `checked`.
   * @default none (required)
   */
  readonly type: "checkbox" | "radio" | "text" | "number" | "hidden";
  /**
   * Field name. Without a name the input would not be submitted, so nothing is rendered.
   * @default none
   */
  readonly name?: string | undefined;
  /**
   * Submitted value. For checkboxes and radios the value sent when checked.
   * @default `"on"` for checkbox and radio; none otherwise
   */
  readonly value?: string | number | undefined;
  /**
   * Checked state (checkbox, radio). Only the `checked` state of the native input follows it.
   * @default `false`
   */
  readonly checked?: boolean | undefined;
  /**
   * Makes the native input required, so form validation fails while it is empty or unchecked.
   * @default none
   */
  readonly required?: boolean | undefined;
  /**
   * Disables the native input, which excludes it from `FormData`.
   * @default none
   */
  readonly disabled?: boolean | undefined;
  /**
   * Id of the `<form>` the control belongs to when it is not inside one (the `form` attribute).
   * @default none
   */
  readonly form?: string | undefined;
  /**
   * Marks a checkbox as indeterminate (a native `indeterminate` property, not an attribute).
   * @default `false`
   */
  readonly indeterminate?: boolean | undefined;
  /**
   * Called when the input's value or checked state is reset by its form.
   * @default none
   */
  readonly onReset?: (() => void) | undefined;
}

const HIDDEN_STYLE =
  "position:absolute;pointer-events:none;opacity:0;margin:0;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);transform:translateX(-100%)";

/**
 * Renders the form-participating `<input>` for a custom control. Renders nothing when `name` is
 * missing. Keyboard: none; the input is out of the tab order (`tabindex="-1"`). ARIA: the input has
 * `aria-hidden="true"`, and its inline style hides it visually. When the controlled value or checked
 * state changes after mount, the input receives `input` and `change` events (bubbling), so
 * `<form onChange>` and form libraries see the change; the first render dispatches none. A form
 * reset returns the input to the state it was first rendered with and calls `onReset`.
 *
 * @param props See {@link HiddenInputProps}.
 * @returns The hidden input, or nothing when `name` is missing.
 * @example
 * import { HiddenInput } from "@shadow-js/primitives";
 *
 * export function Agreement(props: { checked: () => boolean }) {
 *   return <HiddenInput type="checkbox" name="terms" value="yes" checked={props.checked()} />;
 * }
 * @see {@link HiddenInputProps}
 * @since 1.0.0
 */
export function HiddenInput(props: HiddenInputProps): JsxChild {
  if (props.name === undefined) return null;
  let element: HTMLInputElement | undefined;
  let mounted = false;
  let lastChecked: boolean | undefined;
  let lastValue: string | undefined;

  useEffect(() => {
    const input = element;
    if (input === undefined) return;
    const checked = props.checked === true;
    const value = props.value === undefined ? undefined : String(props.value);
    const changed = mounted && (checked !== lastChecked || value !== lastValue);
    // The first state is also the default a form reset returns to.
    if (!mounted) {
      if (props.type === "checkbox" || props.type === "radio") input.defaultChecked = checked;
      else if (value !== undefined) input.defaultValue = value;
    }
    input.indeterminate = props.indeterminate === true;
    if (props.type === "checkbox" || props.type === "radio") input.checked = checked;
    if (value !== undefined && props.type !== "checkbox" && props.type !== "radio") {
      input.value = value;
    }
    lastChecked = checked;
    lastValue = value;
    mounted = true;
    if (changed) {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  useEffect(() => {
    const form = element?.form;
    if (form === null || form === undefined) return;
    const onReset = (): void => untrack(() => props.onReset?.());
    form.addEventListener("reset", onReset);
    onCleanup(() => form.removeEventListener("reset", onReset));
  });

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: the native input only carries form data; tabindex -1 keeps it out of the tab order and the custom control is the accessible one
    <input
      ref={(node: HTMLInputElement) => {
        element = node;
      }}
      type={props.type}
      name={props.name}
      value={
        props.type === "checkbox" || props.type === "radio" ? (props.value ?? "on") : props.value
      }
      checked={
        props.type === "checkbox" || props.type === "radio" ? props.checked === true : undefined
      }
      required={props.required}
      disabled={props.disabled}
      form={props.form}
      aria-hidden="true"
      tabindex={-1}
      style={HIDDEN_STYLE}
    />
  );
}
