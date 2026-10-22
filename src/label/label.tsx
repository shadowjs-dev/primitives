import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";

/**
 * Own props of {@link Label}.
 *
 * Accessibility: the part renders a native `label`, so the browser names the control as its
 * accessible name, either the control `htmlFor` points at or the control the label wraps. It adds no
 * keyboard handling and no ARIA attributes of its own; the labeled control keeps its keys. Sets no
 * data attributes.
 * @see {@link Label}
 * @since 1.0.0
 */
export interface LabelOwnProps {
  /** The id of the control this label names (written as the `for` attribute). @default none */
  readonly htmlFor?: string | undefined;
}

/**
 * Props of {@link Label}.
 * @see {@link Label}
 * @since 1.0.0
 */
export type LabelProps<T extends PolymorphicTarget = "label"> = PolymorphicProps<
  "label",
  LabelOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** Interactive elements inside a label: pressing them is the user's business, not the label's. */
const INTERACTIVE = "button, input, select, textarea";

/**
 * A `label` that names a control (`htmlFor`, or by wrapping it). Accessibility: a native `label`
 * with a `for` attribute when `htmlFor` is set; no keys and no ARIA attributes of its own. A second
 * or later mouse press on the label (a double click) does not select its text, but a press on a
 * `button`, `input`, `select` or `textarea` inside it is left alone.
 *
 * @param props See {@link LabelProps}.
 * @returns The rendered label.
 * @see {@link LabelProps}
 * @example
 * import { Label } from "@shadow-js/primitives";
 *
 * export function EmailField() {
 *   return (
 *     <div>
 *       <Label htmlFor="email">Email</Label>
 *       <input id="email" type="email" />
 *     </div>
 *   );
 * }
 * @since 1.0.0
 */
export function Label<T extends PolymorphicTarget = "label">(props: LabelProps<T>): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & LabelOwnProps>(props), [
    "as",
    "htmlFor",
    "onMouseDown",
  ]);
  const merged = mergeElementProps(
    {
      get for() {
        return own.htmlFor;
      },
    },
    rest,
    {
      onMouseDown: composeEventHandlers(
        () => own.onMouseDown,
        (event: MouseEvent) => {
          const target = event.target;
          if (target instanceof Element && target.closest(INTERACTIVE) !== null) return;
          // A second press within the double-click interval would start a text selection.
          if (event.detail > 1) event.preventDefault();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "label"} {...merged} />;
}
