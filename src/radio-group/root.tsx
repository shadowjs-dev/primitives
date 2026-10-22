import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  type Direction,
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useControllableState,
  useRefSignal,
  useRovingFocus,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import { radioGroupContext } from "./context";

/**
 * Own props of {@link RadioGroupRoot}.
 *
 * Accessibility: the root is `role="radiogroup"`. It sets `aria-required="true"` when `required` and
 * `aria-orientation` when `orientation` is set. The items handle the keys (see
 * {@link RadioGroupRoot}). Data attributes: `data-orientation` (when `orientation` is set),
 * `data-disabled` (empty, when `disabled`), and the `dir` attribute (when `dir` is set).
 * @see {@link RadioGroupRoot}
 * @since 1.0.0
 */
export interface RadioGroupOwnProps {
  /**
   * Controlled value: the checked item's value, or `""` for none. Controlled whenever it is not
   * `undefined`.
   * @default none (uncontrolled)
   */
  readonly value?: string | undefined;
  /**
   * Initial value when uncontrolled.
   * @default none (nothing checked)
   */
  readonly defaultValue?: string | undefined;
  /**
   * Called with the new value when the checked item changes: when the user checks an item (click,
   * Space or an arrow key), or when a form reset restores the default. Not called when the `value`
   * prop changes.
   * @default none
   */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /**
   * Name under which the checked value is submitted. Without it no form inputs are rendered.
   * @default none
   */
  readonly name?: string | undefined;
  /**
   * A value must be chosen before the form can be submitted. Also sets `aria-required`.
   * @default false
   */
  readonly required?: boolean | undefined;
  /**
   * Disables every item.
   * @default false
   */
  readonly disabled?: boolean | undefined;
  /**
   * Axis of the group: the arrow keys of that axis move focus (Left and Right when horizontal, Up
   * and Down when vertical).
   * @default none (all four arrow keys move focus)
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Reading direction; Left and Right swap in `rtl`.
   * @default inherited: the nearest `DirectionProvider`, else the `dir` attribute of `<html>`, else `"ltr"`
   */
  readonly dir?: Direction | undefined;
  /**
   * Wrap from the last item to the first and back.
   * @default true
   */
  readonly loop?: boolean | undefined;
  /**
   * Id of the `<form>` the group belongs to when it is not a descendant of one.
   * @default none
   */
  readonly form?: string | undefined;
}

/**
 * Props of {@link RadioGroup}.
 * @see {@link RadioGroupRoot}
 * @since 1.0.0
 */
export type RadioGroupProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  RadioGroupOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * A set of radio buttons of which exactly one can be checked. Follows the WAI-ARIA radio group
 * pattern: a `role="radiogroup"` of `role="radio"` buttons. The group is one tab stop (the
 * checked item, else the first enabled one); the arrow keys move focus and check the focused
 * item (selection follows focus), Home and End move focus to the first and last enabled item
 * without checking it, Space checks the focused item, Enter does nothing, and Tab leaves the
 * group.
 *
 * Controlled with `value` / `onValueChange`, or uncontrolled with `defaultValue`. With a `name`
 * every item renders a visually hidden radio input of that name, so `FormData` carries the
 * checked value and `required`, `form="id"` and reset (back to `defaultValue`) work natively.
 *
 * @param props See {@link RadioGroupProps}.
 * @returns The group element with its items inside.
 * @example
 * import { RadioGroup } from "@shadow-js/primitives";
 *
 * export function Plan() {
 *   return (
 *     <RadioGroup name="plan" defaultValue="pro" aria-label="Plan">
 *       <RadioGroup.Item value="free">
 *         <RadioGroup.Indicator />
 *       </RadioGroup.Item>
 *       <RadioGroup.Item value="pro">
 *         <RadioGroup.Indicator />
 *       </RadioGroup.Item>
 *     </RadioGroup>
 *   );
 * }
 * @since 1.0.0
 * @see {@link RadioGroupItem}
 */
export function RadioGroupRoot<T extends PolymorphicTarget = "div">(
  props: RadioGroupProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "value",
    "defaultValue",
    "onValueChange",
    "name",
    "required",
    "disabled",
    "orientation",
    "dir",
    "loop",
    "form",
  ]);
  const [value, setValue] = useControllableState<string>({
    value: () => own.value as string | undefined,
    defaultValue: () => (own.defaultValue as string | undefined) ?? "",
    onChange: () => own.onValueChange as ((value: string) => void) | undefined,
    name: "RadioGroup value",
  });
  const [root, setRoot] = useRefSignal<HTMLElement>();
  const dir = useDirectionAround(() => own.dir as Direction | undefined, root);
  const orientation = (): Orientation | undefined => own.orientation as Orientation | undefined;
  const roving = useRovingFocus({
    orientation,
    dir,
    loop: () => own.loop !== false,
    currentTabStopId: () => {
      const checked = value();
      return checked === "" ? undefined : checked;
    },
    // The WAI-ARIA radio group is entered on its checked radio, else its first one, never on the
    // radio that had focus last.
    rememberFocus: () => false,
  });

  // A form reset reaches every item's hidden input; the group must restore its default once.
  let resetting = false;
  let arrowKey = false;

  const merged = mergeElementProps(
    {
      role: "radiogroup",
      get "aria-required"() {
        return own.required === true ? true : undefined;
      },
      get "aria-orientation"() {
        return orientation();
      },
      get "data-orientation"() {
        return orientation();
      },
      get "data-disabled"() {
        return own.disabled === true ? "" : undefined;
      },
      get dir() {
        return own.dir as Direction | undefined;
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>((element) => setRoot(element)) },
  );

  return (
    <radioGroupContext.Provider
      value={{
        value,
        check: (next) => setValue(next),
        reset: () => {
          if (resetting) return;
          resetting = true;
          queueMicrotask(() => {
            resetting = false;
          });
          setValue((own.defaultValue as string | undefined) ?? "");
        },
        defaultValue: () => own.defaultValue as string | undefined,
        name: () => own.name as string | undefined,
        form: () => own.form as string | undefined,
        required: () => own.required === true,
        disabled: () => own.disabled === true,
        roving,
        arrow: {
          active: () => arrowKey,
          set: (active) => {
            arrowKey = active;
          },
        },
      }}
    >
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </radioGroupContext.Provider>
  );
}
