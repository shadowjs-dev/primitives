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
  useRefSignal,
  useRovingFocus,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import { toolbarContext } from "./context";

/**
 * Own props of {@link ToolbarRoot}, on top of the attributes of the `div` element.
 *
 * Accessibility: the root has `role="toolbar"` and `aria-orientation`; give it an `aria-label`. The
 * keys follow {@link ToolbarRoot}.
 *
 * Data attributes: `data-orientation` (`"horizontal"` or `"vertical"`) on the root; `dir` on the root
 * when it is passed.
 * @since 1.0.0
 * @see {@link ToolbarRoot}
 */
export interface ToolbarOwnProps {
  /**
   * Axis of the toolbar. It decides which arrow keys move between items: Left and Right on a
   * horizontal toolbar, Up and Down on a vertical one.
   * @default `"horizontal"`
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Reading direction. `"rtl"` swaps the horizontal arrow keys.
   * @default the surrounding direction (the nearest `DirectionProvider`, else the `dir` of `<html>`, else `"ltr"`)
   */
  readonly dir?: Direction | undefined;
  /**
   * Wraps focus from the last item to the first and back. `false` stops at the ends.
   * @default `true`
   */
  readonly loop?: boolean | undefined;
}

/**
 * Props of {@link ToolbarRoot}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link ToolbarOwnProps}
 */
export type ToolbarProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  ToolbarOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * A set of controls grouped on one row (or column), following the WAI-ARIA toolbar pattern. It is
 * one tab stop: Tab reaches the current item and leaves the toolbar.
 *
 * Keyboard and ARIA: the arrow keys move focus between the enabled items (per `orientation` and
 * `dir`; Left and Right on a horizontal toolbar, Up and Down on a vertical one), Home and End move
 * to the first and last enabled items, and `loop` decides whether focus wraps at the ends. Only the
 * current item is a tab stop (`tabindex="0"`); the others are `tabindex="-1"`. Renders a `div` with
 * `role="toolbar"`, `aria-orientation` and `data-orientation`. Give it an `aria-label`.
 *
 * @param props See {@link ToolbarProps}.
 * @returns The `div` element with the items inside.
 * @example
 * import { Toolbar } from "@shadow-js/primitives";
 *
 * export function TextToolbar() {
 *   return (
 *     <Toolbar aria-label="Text formatting">
 *       <Toolbar.Button>Bold</Toolbar.Button>
 *       <Toolbar.Separator />
 *       <Toolbar.ToggleItem>Italic</Toolbar.ToggleItem>
 *     </Toolbar>
 *   );
 * }
 * @see {@link ToolbarOwnProps}
 * @since 1.0.0
 */
export function ToolbarRoot<T extends PolymorphicTarget = "div">(props: ToolbarProps<T>): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & ToolbarOwnProps>(props), [
    "as",
    "orientation",
    "dir",
    "loop",
  ]);
  const orientation = (): Orientation =>
    (own.orientation as Orientation | undefined) ?? "horizontal";
  const [root, setRoot] = useRefSignal<HTMLElement>();
  const dir = useDirectionAround(() => own.dir as Direction | undefined, root);
  const roving = useRovingFocus({
    orientation,
    dir,
    loop: () => own.loop !== false,
  });
  const merged = mergeElementProps(
    {
      role: "toolbar",
      get "aria-orientation"() {
        return orientation();
      },
      get "data-orientation"() {
        return orientation();
      },
      get dir() {
        return own.dir;
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>((element) => setRoot(element)) },
  );
  return (
    <toolbarContext.Provider value={{ orientation, dir, roving }}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </toolbarContext.Provider>
  );
}
