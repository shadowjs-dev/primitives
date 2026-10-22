import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { selectContext } from "./context";

/**
 * Own props of {@link SelectValue}.
 *
 * Accessibility: the text is the trigger's visible value. Name the trigger itself with `aria-label` or
 * `aria-labelledby` on `Select.Trigger`. The element has `pointer-events: none` so clicks reach the
 * trigger.
 *
 * Data attributes: `data-placeholder` (value `""`) while no value is selected.
 * @see {@link SelectValue}
 * @see {@link Select}
 * @since 1.0.0
 */
export interface SelectValueOwnProps {
  /**
   * Shown while no value is selected.
   * @default none (renders nothing)
   */
  readonly placeholder?: JsxChild | undefined;
}

/**
 * Props of {@link SelectValue}.
 * @see {@link SelectValue}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectValueProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  SelectValueOwnProps,
  T
>;

/**
 * Props of {@link SelectIcon}.
 * @see {@link SelectIcon}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectIconProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * What the trigger shows: the text of the selected item, or `placeholder` while there is no value.
 * Keyboard: the value handles no keys; the trigger that contains it does, typeahead included (see
 * `Select.Trigger`). ARIA: it sets no role or ARIA attribute of its own.
 *
 * The text comes from the item itself, which stays available while the listbox is closed because
 * `Select.Content` keeps its items rendered off-screen (in a detached element) until it opens. So
 * a `defaultValue` shows its label before the listbox was ever opened, and typeahead on the closed
 * trigger works. The text of the last known item is kept while items re-render. Nothing in the DOM
 * of the closed listbox is visible to the page or to assistive technology.
 *
 * The server cannot render items it never mounts, so server markup contains the text only when you
 * pass it as `children` (rendered instead of the item text whenever a value is selected):
 * `<Select.Value placeholder="Pick">{labelOf(value)}</Select.Value>`.
 *
 * @param props See {@link SelectValueProps}.
 * @returns The selected item's text, or the placeholder.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.Value placeholder="Select a fruit" />;
 * @see {@link SelectIcon}
 * @see {@link SelectItemText}
 * @since 1.0.0
 */
export function SelectValue<T extends PolymorphicTarget = "span">(
  props: SelectValueProps<T>,
): JsxChild {
  const context = selectContext.use("Select.Value");
  const [own, rest] = splitProps(partProps<Loose & SelectValueOwnProps>(props), [
    "as",
    "placeholder",
    "children",
  ]);
  const merged = mergeElementProps(
    {
      // The trigger is the interactive element; clicks on its text must reach it.
      style: { "pointer-events": "none" },
      get "data-placeholder"() {
        return context.hasValue() ? undefined : "";
      },
    },
    rest,
  );
  return (
    <Polymorphic as={own.as ?? "span"} {...merged}>
      {context.hasValue()
        ? ((own["children"] ?? context.selectedText() ?? "") as JsxChild)
        : ((own.placeholder ?? "") as JsxChild)}
    </Polymorphic>
  );
}

/**
 * A decorative icon for the trigger (default: a small triangle). Hidden from assistive technology. Keyboard: none. ARIA: `aria-hidden="true"`.
 *
 * @param props See {@link SelectIconProps}.
 * @returns The icon element.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.Icon>▼</Select.Icon>;
 * @see {@link Select}
 * @since 1.0.0
 */
export function SelectIcon<T extends PolymorphicTarget = "span">(
  props: SelectIconProps<T>,
): JsxChild {
  selectContext.use("Select.Icon");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "children"]);
  const merged = mergeElementProps({ "aria-hidden": true }, rest);
  return (
    <Polymorphic as={own.as ?? "span"} {...merged}>
      {(own["children"] ?? "▼") as JsxChild}
    </Polymorphic>
  );
}
