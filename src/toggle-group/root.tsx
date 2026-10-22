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
import { toggleGroupContext } from "./context";

/**
 * Props shared by both kinds of {@link ToggleGroup}: the disabled flag, the axis and direction for the
 * arrow keys, looping, and roving focus.
 *
 * Accessibility: the group sets `role="group"`; label it with `aria-label` or `aria-labelledby`. With
 * roving focus the group is one tab stop, and the arrow keys move focus between items (see
 * {@link ToggleGroupRoot}).
 *
 * Data attributes: `data-orientation` (`"horizontal"` or `"vertical"`) when `orientation` is set,
 * `data-disabled` (present, value `""`) while disabled, and `dir` when the `dir` prop is passed.
 * @since 1.0.0
 * @see {@link ToggleGroupRoot}
 */
export interface ToggleGroupCommonProps {
  /**
   * Disables every item.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
  /**
   * Axis of the group: the arrow keys follow it. Without it all four arrows move focus.
   * @default none
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Reading direction; Left and Right swap in `rtl`.
   * @default none (the surrounding direction: the nearest direction provider, else the document's `dir`, else `"ltr"`)
   */
  readonly dir?: Direction | undefined;
  /**
   * Wraps focus from the last item to the first and back with the arrow keys. Home and End are not affected.
   * @default `true`
   */
  readonly loop?: boolean | undefined;
  /**
   * Moves focus between items with the arrow keys, with one tab stop for the group. With `false` every
   * item is a tab stop and the arrow keys do nothing.
   * @default `true`
   */
  readonly rovingFocus?: boolean | undefined;
}

/**
 * Props of a group that allows at most one pressed item. Its items are `role="radio"` with
 * `aria-checked`, and pressing the pressed item again clears the value to `""`.
 * @since 1.0.0
 * @see {@link ToggleGroupRoot}
 */
export interface ToggleGroupSingleProps extends ToggleGroupCommonProps {
  /**
   * Selects the single kind: at most one item is pressed. It is the discriminant of
   * {@link ToggleGroupOwnProps}.
   * @default none (required)
   */
  readonly type: "single";
  /**
   * Controlled value: the pressed item's value, or `""` for none. Controlled when not `undefined`.
   * Switching between controlled and uncontrolled warns once per switch in development.
   * @default none (uncontrolled)
   */
  readonly value?: string | undefined;
  /**
   * Initial value when uncontrolled. `""`, or omitting it, presses nothing.
   * @default none
   */
  readonly defaultValue?: string | undefined;
  /**
   * Called with the new value; `""` when the pressed item was pressed again.
   * @default none
   */
  readonly onValueChange?: ((value: string) => void) | undefined;
}

/**
 * Props of a group that allows any number of pressed items. Its items keep `aria-pressed`, and each
 * item toggles independently.
 * @since 1.0.0
 * @see {@link ToggleGroupRoot}
 */
export interface ToggleGroupMultipleProps extends ToggleGroupCommonProps {
  /**
   * Selects the multiple kind: any number of items can be pressed. It is the discriminant of
   * {@link ToggleGroupOwnProps}.
   * @default none (required)
   */
  readonly type: "multiple";
  /**
   * Controlled values: the pressed items' values. Controlled when not `undefined`. Switching between
   * controlled and uncontrolled warns once per switch in development.
   * @default none (uncontrolled)
   */
  readonly value?: readonly string[] | undefined;
  /**
   * Initial values when uncontrolled.
   * @default none
   */
  readonly defaultValue?: readonly string[] | undefined;
  /**
   * Called with a new array of the pressed values after each change.
   * @default none
   */
  readonly onValueChange?: ((value: string[]) => void) | undefined;
}

/**
 * The own props of {@link ToggleGroup}: a discriminated union on `type`, so a single group takes a
 * string value and a multiple group an array, and mixing them is a compile error.
 * @since 1.0.0
 * @see {@link ToggleGroupSingleProps}
 * @see {@link ToggleGroupMultipleProps}
 */
export type ToggleGroupOwnProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

/**
 * Props of {@link ToggleGroup}: the own props and the attributes of the chosen element (a `div` by
 * default).
 * @since 1.0.0
 * @see {@link ToggleGroupOwnProps}
 */
export type ToggleGroupProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  ToggleGroupOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const NONE: readonly string[] = [];

function sameValues(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((entry, index) => entry === b[index]);
}

/**
 * A set of toggle buttons. `type="single"` allows one pressed item, and pressing the pressed item again
 * clears the value to `""`. `type="multiple"` allows any number, each toggling on its own. The root is
 * a `role="group"`; label it with `aria-label` or `aria-labelledby`.
 *
 * Keyboard and ARIA: with `rovingFocus` (the default) the group is one tab stop, on the item that was
 * focused last, else the first pressed item, else the first enabled one. The arrow keys follow
 * `orientation` and `dir`; Home and PageUp go to the first enabled item, End and PageDown to the last,
 * and disabled items are skipped. Items are `role="radio"` with `aria-checked` in a single group and
 * keep `aria-pressed` in a multiple group.
 *
 * @param props See {@link ToggleGroupProps}.
 * @returns The rendered group.
 * @example
 * import { ToggleGroup } from "@shadow-js/primitives";
 *
 * export function TextStyle() {
 *   return (
 *     <ToggleGroup type="multiple" aria-label="Text style" onValueChange={(values) => console.log(values)}>
 *       <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
 *       <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
 *     </ToggleGroup>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ToggleGroup}
 * @see {@link ToggleGroupItem}
 */
export function ToggleGroupRoot<T extends PolymorphicTarget = "div">(
  props: ToggleGroupProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "type",
    "value",
    "defaultValue",
    "onValueChange",
    "disabled",
    "orientation",
    "dir",
    "loop",
    "rovingFocus",
  ]);
  const type = (): "single" | "multiple" => (own.type === "multiple" ? "multiple" : "single");
  const toList = (value: unknown): readonly string[] | undefined => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) return value as readonly string[];
    return value === "" ? NONE : [String(value)];
  };
  const [value, setValue] = useControllableState<readonly string[]>({
    value: () => toList(own.value),
    defaultValue: () => toList(own.defaultValue) ?? NONE,
    onChange: () => {
      // The application receives one string for a single group, a list for a multiple group.
      const handler = own.onValueChange as ((value: string | string[]) => void) | undefined;
      if (handler === undefined) return undefined;
      return (next: readonly string[]) => {
        // A single group reports one string, "" when nothing is pressed (Radix).
        if (type() === "single") handler(next[0] ?? "");
        else handler([...next]);
      };
    },
    equals: sameValues,
    name: "ToggleGroup value",
  });

  const [root, setRoot] = useRefSignal<HTMLElement>();
  const dir = useDirectionAround(() => own.dir as Direction | undefined, root);
  const orientation = (): Orientation | undefined => own.orientation as Orientation | undefined;
  const roving = useRovingFocus({
    orientation,
    dir,
    loop: () => own.loop !== false,
  });

  const merged = mergeElementProps(
    {
      role: "group",
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
    <toggleGroupContext.Provider
      value={{
        type,
        value,
        activate: (item) => {
          if (type() === "single") setValue([item]);
          else if (!value().includes(item)) setValue([...value(), item]);
        },
        deactivate: (item) => setValue(value().filter((entry) => entry !== item)),
        disabled: () => own.disabled === true,
        rovingFocus: () => own.rovingFocus !== false,
        roving,
      }}
    >
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </toggleGroupContext.Provider>
  );
}
