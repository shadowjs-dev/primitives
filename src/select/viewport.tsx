import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { selectContentContext, selectContext } from "./context";

/**
 * Props of {@link SelectViewport}.
 * @see {@link SelectViewport}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectViewportProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The scrollable area that holds the items. It is as tall as the space the positioning engine
 * leaves (`max-height: var(--primitives-available-height)`) and scrolls when there are more items
 * than fit. Keyboard focus keeps the focused item in view by scrolling this element, never the page.
 * It is `role="presentation"` (the listbox keeps the listbox role) and carries the attribute
 * `data-primitives-select-viewport`.
 *
 * @param props See {@link SelectViewportProps}.
 * @returns The viewport element.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select>
 *   <Select.Content>
 *     <Select.Viewport class="p-1">
 *       <Select.Item value="apple"><Select.ItemText>Apple</Select.ItemText></Select.Item>
 *     </Select.Viewport>
 *   </Select.Content>
 * </Select>;
 * @see {@link SelectContent}
 * @since 1.0.0
 */
export function SelectViewport<T extends PolymorphicTarget = "div">(
  props: SelectViewportProps<T>,
): JsxChild {
  selectContext.use("Select.Viewport");
  // Absent while the closed listbox keeps its items in the detached registry.
  const content = selectContentContext.useOptional();
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      role: "presentation",
      "data-primitives-select-viewport": "",
      style: {
        position: "relative",
        // Takes what the scroll buttons leave of the listbox (a flex column) and scrolls inside it.
        flex: "1",
        overflow: "auto",
        "max-height": "var(--primitives-available-height)",
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => content?.setViewport(node)),
    },
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
