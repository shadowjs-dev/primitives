/**
 * `VisuallyHidden`: content that is invisible but stays in the accessibility tree and the reading
 * order (labels for icon buttons, descriptions for screen readers). It uses the clip-rect pattern,
 * not `display: none` or `visibility: hidden`, which would remove it for assistive technology.
 * @packageDocumentation
 */
import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { mergeElementProps } from "./merge-props";
import { partProps } from "./part-props";
import type { PolymorphicProps, PolymorphicTarget } from "./polymorphic";
import { Polymorphic } from "./polymorphic";

/**
 * The inline style that hides an element visually while keeping it available to screen readers.
 * Keys are CSS property names, so it can be spread into a `style` object or written with
 * `setProperty`. The object is frozen. {@link VisuallyHidden} applies it for you.
 *
 * @example
 * import { visuallyHiddenStyle } from "@shadow-js/primitives";
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 *
 * export function CloseLabel(): JsxChild {
 *   return <span style={visuallyHiddenStyle}>Close</span>;
 * }
 * @since 1.0.0
 * @see {@link VisuallyHidden}
 */
export const visuallyHiddenStyle: Readonly<Record<string, string>> = Object.freeze({
  position: "absolute",
  border: "0",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  "white-space": "nowrap",
  "word-wrap": "normal",
});

/**
 * Renders its children visually hidden but readable by screen readers. A `style` or `class` from
 * the application is merged with the hidden style (the application's declarations win per
 * property), and `as` picks another element. It sets no role, no `aria-*` attribute and no data
 * attribute, handles no keys and does not move focus: the content stays in the accessibility tree
 * and the reading order.
 *
 * Accessibility: the content is hidden from sight and from the layout, but not from assistive
 * technology, so screen readers announce it. ARIA: none. Unlike `aria-hidden="true"` or
 * `display: none`, it does not remove the content from the accessibility tree.
 *
 * @param props The `as` element (default `span`), `style` and `class`, children and any attribute
 * of the chosen element. See {@link PolymorphicProps}.
 * @returns The rendered element.
 * @example
 * import { VisuallyHidden } from "@shadow-js/primitives";
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 *
 * export function CloseButton(): JsxChild {
 *   return (
 *     <button type="button">
 *       <span aria-hidden="true">X</span>
 *       <VisuallyHidden>Close dialog</VisuallyHidden>
 *     </button>
 *   );
 * }
 * @since 1.0.0
 * @see {@link visuallyHiddenStyle}
 * @see {@link PolymorphicProps}
 */
export function VisuallyHidden<T extends PolymorphicTarget = "span">(
  props: PolymorphicProps<"span", object, T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Record<string, unknown>>(props), ["as"]);
  const merged = mergeElementProps({ style: visuallyHiddenStyle }, rest);
  return <Polymorphic {...merged} as={(own.as as PolymorphicTarget | undefined) ?? "span"} />;
}
