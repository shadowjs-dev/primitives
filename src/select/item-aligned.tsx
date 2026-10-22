import { onCleanup, untrack, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTarget } from "../utils/index";
import { SelectContent, type SelectContentProps } from "./content";
import { selectContext } from "./context";

/**
 * Props of {@link SelectItemAlignedContent}: those of `Select.Content` except the placement props, which it sets itself.
 * @since 1.0.0
 * @see {@link SelectItemAlignedContent}
 */
export type SelectItemAlignedContentProps<T extends PolymorphicTarget = "div"> = Omit<
  SelectContentProps<T>,
  "side" | "align" | "sideOffset"
>;

/**
 * The listbox of a {@link SelectRoot}, placed so that the selected item (the first enabled item when nothing is selected) sits
 * over the trigger's text, as a native select does. It is `Select.Content` with `side="bottom"`, `align="start"` and a
 * `sideOffset` measured once the listbox has been placed, so everything else (the dismissal, the keys, the viewport and the
 * scroll buttons) is the same part, and the listbox still keeps inside the viewport. It is a separate export on purpose:
 * `Select.Content` does not carry this code, so an application that never aligns pays nothing for it.
 *
 * @param props See {@link SelectItemAlignedContentProps}.
 * @returns The listbox while the select is open.
 * @throws Error when rendered outside a `Select`.
 * @example
 * import { Select, SelectItemAlignedContent } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Select defaultValue="banana">
 *       <Select.Trigger>
 *         <Select.Value placeholder="Pick a fruit" />
 *       </Select.Trigger>
 *       <Select.Portal>
 *         <SelectItemAlignedContent>
 *           <Select.Viewport>
 *             <Select.Item value="apple">
 *               <Select.ItemText>Apple</Select.ItemText>
 *             </Select.Item>
 *             <Select.Item value="banana">
 *               <Select.ItemText>Banana</Select.ItemText>
 *             </Select.Item>
 *           </Select.Viewport>
 *         </SelectItemAlignedContent>
 *       </Select.Portal>
 *     </Select>
 *   );
 * }
 * @since 1.0.0
 * @see {@link SelectContent}
 */
export function SelectItemAlignedContent<T extends PolymorphicTarget = "div">(
  props: SelectItemAlignedContentProps<T>,
): JsxChild {
  const context = selectContext.use("SelectItemAlignedContent");
  const [offset, setOffset] = useSignal<number>(0);

  const align = (): void => {
    const trigger = untrack(context.trigger);
    const content = trigger?.ownerDocument.getElementById(untrack(context.contentId));
    if (trigger === undefined || content === null || content === undefined) return;
    const options = [...content.querySelectorAll<HTMLElement>('[role="option"]')];
    const item =
      options.find((option) => option.getAttribute("aria-selected") === "true") ??
      options.find((option) => !option.hasAttribute("data-disabled"));
    if (item === undefined) return;
    const triggerBox = trigger.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    // The item's top should be where it would be if it were centered on the trigger; the listbox hangs below the trigger's
    // bottom edge by whatever puts it there.
    const itemTop = triggerBox.top + (triggerBox.height - itemBox.height) / 2;
    const contentTop = itemTop - (itemBox.top - contentBox.top);
    setOffset(contentTop - triggerBox.bottom);
  };

  // The content calls this once the listbox has a placement.
  context.afterPlaced = align;
  onCleanup(() => {
    if (context.afterPlaced === align) context.afterPlaced = undefined;
  });

  return (
    <SelectContent
      {...(props as SelectContentProps<T>)}
      side="bottom"
      align="start"
      sideOffset={offset()}
    />
  );
}
