import { onCleanup, onMount, splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { passwordToggleFieldContext } from "./root";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link PasswordToggleFieldInput}: the attributes of the `input`.
 * @since 1.0.0
 * @see {@link PasswordToggleFieldInput}
 */
export type PasswordToggleFieldInputProps<T extends PolymorphicTarget = "input"> = PolymorphicProps<
  "input",
  object,
  T
>;

/**
 * The password input: `type="password"`, or `type="text"` while shown. `autocomplete` defaults to
 * `current-password`; pass `new-password` on a sign-up form. The input gets a generated `id` that
 * the toggle's `aria-controls` names; an `id` you pass replaces it, and `aria-controls` follows.
 * Must be rendered inside {@link PasswordToggleFieldRoot}.
 *
 * @param props See {@link PasswordToggleFieldInputProps}.
 * @returns The `input` element.
 * @throws Error when rendered outside {@link PasswordToggleFieldRoot}.
 * @example
 * import { PasswordToggleField } from "@shadow-js/primitives";
 *
 * export function NewPassword() {
 *   return (
 *     <PasswordToggleField>
 *       <PasswordToggleField.Input autocomplete="new-password" />
 *       <PasswordToggleField.Toggle />
 *     </PasswordToggleField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PasswordToggleFieldToggle}
 */
export function PasswordToggleFieldInput<T extends PolymorphicTarget = "input">(
  props: PasswordToggleFieldInputProps<T>,
): JsxChild {
  const context = passwordToggleFieldContext.use("PasswordToggleField.Input");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  // The id the input renders with. The toggle reads it through the connection made here while the
  // input renders, so the server markup names the id the input really has, whatever the markup order.
  // It is disconnected when the input unmounts, so the toggle stops naming a missing element.
  const currentId = (): string => (rest["id"] as string | undefined) ?? context.generatedInputId();
  context.connectInput(currentId);
  onMount(() => context.refreshInput());
  onCleanup(() => {
    context.connectInput(undefined);
    context.refreshInput();
  });
  const merged = mergeElementProps(
    {
      get id() {
        return currentId();
      },
      get type() {
        return context.visible() ? "text" : "password";
      },
      autocomplete: "current-password",
      get disabled() {
        return context.disabled() ? true : undefined;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "input"} {...merged} />;
}

/**
 * Props of {@link PasswordToggleFieldToggle}: the attributes of the `button`.
 * @since 1.0.0
 * @see {@link PasswordToggleFieldToggle}
 */
export type PasswordToggleFieldToggleProps<T extends PolymorphicTarget = "button"> =
  PolymorphicProps<"button", object, T>;

/**
 * The button that shows and hides the password. A toggle button: `aria-pressed` is the visibility,
 * the label stays "Show password" (override it with `aria-label`), and `aria-controls` names the input
 * (absent while no input is rendered).
 * Keys: Enter or Space (a click) flips the visibility. Its `data-state` is `"visible"` or `"hidden"`.
 * An `id` passed to {@link PasswordToggleFieldInput} is the id `aria-controls` names as well.
 * Must be rendered inside {@link PasswordToggleFieldRoot}.
 *
 * @param props See {@link PasswordToggleFieldToggleProps}.
 * @returns The `button` element.
 * @throws Error when rendered outside {@link PasswordToggleFieldRoot}.
 * @example
 * import { PasswordToggleField } from "@shadow-js/primitives";
 *
 * export function RevealToggle() {
 *   return (
 *     <PasswordToggleField>
 *       <PasswordToggleField.Input />
 *       <PasswordToggleField.Toggle aria-label="Show the password" />
 *     </PasswordToggleField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PasswordToggleFieldInput}
 */
export function PasswordToggleFieldToggle<T extends PolymorphicTarget = "button">(
  props: PasswordToggleFieldToggleProps<T>,
): JsxChild {
  const context = passwordToggleFieldContext.use("PasswordToggleField.Toggle");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const merged = mergeElementProps(
    {
      type: "button",
      "aria-label": "Show password",
      get "aria-pressed"() {
        return context.visible();
      },
      get "aria-controls"() {
        return context.inputId();
      },
      get "data-state"() {
        return context.visible() ? "visible" : "hidden";
      },
      get disabled() {
        return context.disabled() ? true : undefined;
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          if (!context.disabled()) context.setVisible(!context.visible());
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
