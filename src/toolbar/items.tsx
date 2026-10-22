import { splitProps, useId } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { ToggleImpl } from "../toggle/toggle";
import {
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { toolbarContext } from "./context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Own props shared by the items that can be disabled.
 *
 * Accessibility: a disabled item is skipped by the arrow keys and is not a tab stop. A pointer press
 * does not move focus to it, and a native `button` also gets the `disabled` attribute, so it cannot
 * take focus at all. Other elements get `aria-disabled="true"` instead.
 * @since 1.0.0
 * @see {@link ToolbarButton}
 */
export interface ToolbarItemOwnProps {
  /**
   * Disables the item: the arrow keys skip it and it is not a tab stop.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link ToolbarButton}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link ToolbarButton}
 */
export type ToolbarButtonProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  ToolbarItemOwnProps,
  T
>;

/**
 * A command in the toolbar: a `button` (`type="button"`) that is one roving item. Keyboard and ARIA:
 * the arrow, Home and End keys move between the items (see {@link ToolbarRoot}). The item carries
 * `tabindex="0"` when it is the current item and `tabindex="-1"` otherwise, and `data-orientation`.
 * Data attributes: `data-disabled` (present, value `""`) while disabled.
 *
 * @param props See {@link ToolbarButtonProps}.
 * @returns The `button` element (or the element named by `as`).
 * @throws Error when rendered outside {@link ToolbarRoot}: `[primitives] <Toolbar.Button> must be used within <Toolbar>.`
 * @example
 * import { Toolbar } from "@shadow-js/primitives";
 *
 * export function BoldCommand() {
 *   return (
 *     <Toolbar aria-label="Formatting">
 *       <Toolbar.Button aria-label="Bold" onClick={() => console.log("bold")}>B</Toolbar.Button>
 *     </Toolbar>
 *   );
 * }
 * @see {@link ToolbarButtonProps}
 * @see {@link ToolbarRoot}
 * @since 1.0.0
 */
export function ToolbarButton<T extends PolymorphicTarget = "button">(
  props: ToolbarButtonProps<T>,
): JsxChild {
  const context = toolbarContext.use("Toolbar.Button");
  const [own, rest] = splitProps(partProps<Loose & ToolbarItemOwnProps>(props), ["as", "disabled"]);
  const id = useId();
  const disabled = (): boolean => own.disabled === true;
  const roving = context.roving.item({ id: () => id, disabled });
  const merged = mergeElementProps(
    roving,
    {
      get type() {
        return (own.as ?? "button") === "button" ? "button" : undefined;
      },
      get disabled() {
        return disabled() && (own.as ?? "button") === "button" ? true : undefined;
      },
      get "aria-disabled"() {
        return disabled() && (own.as ?? "button") !== "button" ? true : undefined;
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * Props of {@link ToolbarLink}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link ToolbarLink}
 */
export type ToolbarLinkProps<T extends PolymorphicTarget = "a"> = PolymorphicProps<
  "a",
  ToolbarItemOwnProps,
  T
>;

/**
 * A navigation link in the toolbar: an `a` that is one roving item. Keyboard and ARIA: the arrow,
 * Home and End keys move between the items (see {@link ToolbarRoot}). The link carries
 * `tabindex="0"` when it is the current item and `tabindex="-1"` otherwise, and `data-orientation`.
 * A disabled link gets `aria-disabled="true"`.
 *
 * @param props See {@link ToolbarLinkProps}.
 * @returns The `a` element (or the element named by `as`).
 * @throws Error when rendered outside {@link ToolbarRoot}: `[primitives] <Toolbar.Link> must be used within <Toolbar>.`
 * @example
 * import { Toolbar } from "@shadow-js/primitives";
 *
 * export function DocsLinks() {
 *   return (
 *     <Toolbar aria-label="Site">
 *       <Toolbar.Link href="/docs">Docs</Toolbar.Link>
 *     </Toolbar>
 *   );
 * }
 * @see {@link ToolbarLinkProps}
 * @see {@link ToolbarRoot}
 * @since 1.0.0
 */
export function ToolbarLink<T extends PolymorphicTarget = "a">(
  props: ToolbarLinkProps<T>,
): JsxChild {
  const context = toolbarContext.use("Toolbar.Link");
  const [own, rest] = splitProps(partProps<Loose & ToolbarItemOwnProps>(props), ["as", "disabled"]);
  const id = useId();
  const disabled = (): boolean => own.disabled === true;
  const roving = context.roving.item({ id: () => id, disabled });
  const merged = mergeElementProps(
    roving,
    {
      get "aria-disabled"() {
        return disabled() ? true : undefined;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "a"} {...merged} />;
}

/**
 * Props of {@link ToolbarToggleItem}: the own props of a toggle item and the attributes of its
 * `button`.
 * @since 1.0.0
 * @see {@link ToolbarToggleItem}
 */
export interface ToolbarToggleItemProps extends ToolbarItemOwnProps {
  /**
   * Controlled pressed state. Controlled when set (not `undefined`): the item shows this value and
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
   * The content of the item.
   * @default none
   */
  readonly children?: JsxChild;
  readonly [prop: string]: unknown;
}

/**
 * A two-state command in the toolbar: a roving item that behaves like {@link Toggle}. It is a
 * `button` with `aria-pressed` (`"true"` or `"false"`) and `data-state` (`"on"` or `"off"`); a click,
 * Space or Enter flips it. Arrow, Home and End keys move between the items (see {@link ToolbarRoot}).
 * `data-disabled` is present while disabled, and a disabled button cannot take focus.
 *
 * @param props See {@link ToolbarToggleItemProps}.
 * @returns The `button` element.
 * @throws Error when rendered outside {@link ToolbarRoot}: `[primitives] <Toolbar.ToggleItem> must be used within <Toolbar>.`
 * @example
 * import { Toolbar } from "@shadow-js/primitives";
 *
 * export function ItalicToggle() {
 *   return (
 *     <Toolbar aria-label="Formatting">
 *       <Toolbar.ToggleItem aria-label="Italic" onPressedChange={(on) => console.log(on)}>
 *         I
 *       </Toolbar.ToggleItem>
 *     </Toolbar>
 *   );
 * }
 * @see {@link ToolbarRoot}
 * @see {@link ToolbarToggleItemProps}
 * @since 1.0.0
 */
export function ToolbarToggleItem(props: ToolbarToggleItemProps): JsxChild {
  const context = toolbarContext.use("Toolbar.ToggleItem");
  const [own, rest] = splitProps(props, ["disabled"]);
  const id = useId();
  const disabled = (): boolean => own.disabled === true;
  const roving = context.roving.item({ id: () => id, disabled });
  return ToggleImpl(
    mergeElementProps(
      roving,
      {
        get disabled() {
          return disabled() ? true : undefined;
        },
      },
      rest,
    ) as Loose,
    "pressed",
    "Toolbar toggle pressed",
  );
}

/**
 * Props of {@link ToolbarSeparator}: the attributes of the chosen element (a `div` by default).
 * @since 1.0.0
 * @see {@link ToolbarSeparator}
 */
export type ToolbarSeparatorProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * A visual and structural divider between groups of items. It renders a `div` with
 * `role="separator"`, and its `aria-orientation` and `data-orientation` are perpendicular to the
 * toolbar's (`"vertical"` in a horizontal toolbar, `"horizontal"` in a vertical one). It is not a
 * roving item and takes no keys.
 *
 * @param props See {@link ToolbarSeparatorProps}.
 * @returns The `div` element (or the element named by `as`).
 * @throws Error when rendered outside {@link ToolbarRoot}: `[primitives] <Toolbar.Separator> must be used within <Toolbar>.`
 * @example
 * import { Toolbar } from "@shadow-js/primitives";
 *
 * export function GroupedBar() {
 *   return (
 *     <Toolbar aria-label="Formatting">
 *       <Toolbar.Button>Bold</Toolbar.Button>
 *       <Toolbar.Separator />
 *       <Toolbar.Button>Copy</Toolbar.Button>
 *     </Toolbar>
 *   );
 * }
 * @see {@link ToolbarRoot}
 * @see {@link ToolbarSeparatorProps}
 * @since 1.0.0
 */
export function ToolbarSeparator<T extends PolymorphicTarget = "div">(
  props: ToolbarSeparatorProps<T>,
): JsxChild {
  const context = toolbarContext.use("Toolbar.Separator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const perpendicular = (): Orientation =>
    context.orientation() === "vertical" ? "horizontal" : "vertical";
  const merged = mergeElementProps(
    {
      role: "separator",
      get "aria-orientation"() {
        return perpendicular();
      },
      get "data-orientation"() {
        return perpendicular();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
