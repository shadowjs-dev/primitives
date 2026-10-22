import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";

/**
 * Own props of {@link Separator}.
 *
 * Accessibility: `role="separator"`, with `aria-orientation="vertical"` only when vertical (the
 * default of the role is horizontal); when `decorative`, `role="none"` and no `aria-orientation`.
 * Keys: none; the separator is not focusable. Data attributes: `data-orientation` (`"horizontal"`
 * or `"vertical"`).
 * @see {@link Separator}
 * @since 1.0.0
 */
export interface SeparatorOwnProps {
  /**
   * Axis of the separator.
   * @default "horizontal"
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Purely visual: the separator is removed from the accessibility tree (`role="none"`). Use it
   * when the content around it is already grouped.
   * @default false
   */
  readonly decorative?: boolean | undefined;
}

/**
 * Props of {@link Separator}.
 * @see {@link Separator}
 * @since 1.0.0
 */
export type SeparatorProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  SeparatorOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Visually or semantically separates content. Renders a `div` with `role="separator"` (and
 * `aria-orientation="vertical"` only when vertical, because horizontal is the default of the
 * role), or `role="none"` when `decorative`. Carries `data-orientation`. Keyboard: none; it is not
 * focusable.
 *
 * @param props See {@link SeparatorProps}.
 * @returns The separator element.
 * @example
 * import { Separator } from "@shadow-js/primitives";
 *
 * export function Divider() {
 *   return <Separator orientation="vertical" class="h-6 w-px bg-border" />;
 * }
 * @see {@link SeparatorProps}
 * @since 1.0.0
 */
export function Separator<T extends PolymorphicTarget = "div">(props: SeparatorProps<T>): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & SeparatorOwnProps>(props), [
    "as",
    "orientation",
    "decorative",
  ]);
  const orientation = (): Orientation =>
    own.orientation === "vertical" ? "vertical" : "horizontal";
  const merged = mergeElementProps(
    {
      get role() {
        return own.decorative === true ? "none" : "separator";
      },
      get "aria-orientation"() {
        // A decorative separator has no semantics to describe.
        return own.decorative !== true && orientation() === "vertical" ? "vertical" : undefined;
      },
      get "data-orientation"() {
        return orientation();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
