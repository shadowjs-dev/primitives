import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useControllableState,
} from "../utils/index";
import { partProps } from "../utils/part-props";

/**
 * Own props of {@link Toggle}, on top of the attributes of the chosen element (a `button` by
 * default).
 *
 * Accessibility: the button has `aria-pressed` (`"true"` or `"false"`). A click, Space or Enter
 * toggles it; see {@link Toggle} for the keys on other elements.
 *
 * Data attributes: `data-state` (`"on"` or `"off"`) and `data-disabled` (present, value `""`) while
 * the toggle is disabled.
 * @since 1.0.0
 * @see {@link Toggle}
 */
export interface ToggleOwnProps {
  /**
   * Controlled pressed state. Controlled when set (not `undefined`): the toggle shows this value and
   * reports each change only through `onPressedChange`.
   * @default none (uncontrolled)
   */
  readonly pressed?: boolean | undefined;
  /**
   * Initial pressed state when uncontrolled.
   * @default `false`
   */
  readonly defaultPressed?: boolean | undefined;
  /**
   * Called with the new state each time it changes: after a click or key press.
   * @default none
   */
  readonly onPressedChange?: ((pressed: boolean) => void) | undefined;
  /**
   * Disables the toggle. Clicks and keys do nothing.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link Toggle}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link ToggleOwnProps}
 */
export type ToggleProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  ToggleOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * How the pressed state is exposed to assistive technology. A lone toggle is a two-state button
 * (`aria-pressed`); a toggle inside a single-select group is a radio (`role="radio"` with
 * `aria-checked`), as in Radix.
 * @internal
 */
export type ToggleAria = "pressed" | "checked";

/**
 * The implementation shared by {@link Toggle} and `ToggleGroup.Item`. Not public API.
 * @internal
 */
export function ToggleImpl(props: Loose, aria: ToggleAria, name: string): JsxChild {
  const [own, rest] = splitProps(props, [
    "as",
    "pressed",
    "defaultPressed",
    "onPressedChange",
    "disabled",
    "onClick",
    "onKeyDown",
  ]);
  const [pressed, setPressed] = useControllableState<boolean>({
    value: () => own.pressed as boolean | undefined,
    defaultValue: () => own.defaultPressed === true,
    onChange: () => own.onPressedChange as ((pressed: boolean) => void) | undefined,
    name,
  });
  const disabled = (): boolean => own.disabled === true;
  const native = (): boolean => (own.as ?? "button") === "button";
  const toggle = (): void => {
    if (!disabled()) setPressed(!pressed());
  };

  const merged = mergeElementProps(
    {
      get type() {
        return native() ? "button" : undefined;
      },
      get role() {
        return aria === "checked" ? "radio" : undefined;
      },
      get "aria-pressed"() {
        return aria === "pressed" ? pressed() : undefined;
      },
      get "aria-checked"() {
        return aria === "checked" ? pressed() : undefined;
      },
      get "aria-disabled"() {
        return !native() && disabled() ? true : undefined;
      },
      get "data-state"() {
        return pressed() ? "on" : "off";
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
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * A two-state button that can be on or off. Renders a `button` with `aria-pressed` set to `"true"`
 * or `"false"` and `data-state` set to `"on"` or `"off"`.
 *
 * Keyboard and ARIA: a click, Space or Enter toggles it. A native `button` turns Space and Enter into
 * a click, so the toggle listens only to `click`. When `as` renders another element, the toggle
 * handles Space and Enter itself, gets `tabindex="0"` unless disabled, and reports
 * `aria-disabled="true"` while disabled. A `click` handler that calls `preventDefault` vetoes the
 * toggle.
 *
 * Controlled with `pressed` / `onPressedChange`, or uncontrolled with `defaultPressed`.
 *
 * @param props See {@link ToggleProps}.
 * @returns The rendered toggle element.
 * @example
 * import { Toggle } from "@shadow-js/primitives";
 *
 * export function BoldButton() {
 *   return (
 *     <Toggle aria-label="Bold" onPressedChange={(on) => console.log(on)}>
 *       B
 *     </Toggle>
 *   );
 * }
 * @see {@link ToggleOwnProps}
 * @since 1.0.0
 */
export function Toggle<T extends PolymorphicTarget = "button">(props: ToggleProps<T>): JsxChild {
  return ToggleImpl(partProps<Loose>(props), "pressed", "Toggle pressed");
}
