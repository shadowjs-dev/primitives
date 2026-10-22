import { splitProps, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { CollapsibleRoot } from "../collapsible/root";
import { encodeTabValue } from "../tabs/encode";
import {
  mergeElementProps,
  type PolymorphicProps,
  type PolymorphicTarget,
  partId,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { accordionContext, accordionItemContext } from "./context";

/**
 * Own props of {@link AccordionItem}.
 *
 * Accessibility: the item carries no role and no ARIA attributes; its trigger, header and panel do.
 * Its trigger is disabled (natively, so it cannot take focus) when the item or the whole accordion
 * is disabled. Data attributes: `data-state` (`"open"` or `"closed"`), `data-disabled` (present
 * with the value `""` only when disabled) and `data-orientation`.
 * @see {@link AccordionItem}
 * @since 1.0.0
 */
export interface AccordionItemOwnProps {
  /** The value that identifies this item in the accordion's `value`. @default none (required) */
  readonly value: string;
  /** Disables this item. @default false */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link AccordionItem}.
 * @see {@link AccordionItem}
 * @since 1.0.0
 */
export type AccordionItemProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  AccordionItemOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * One section of the accordion: a collapsible whose open state is the accordion's value. Renders a
 * `div` with `data-state="open" | "closed"`, `data-disabled` and `data-orientation`. Keys and ARIA
 * are those of the trigger, header and content inside it (see {@link AccordionRoot}).
 *
 * @param props See {@link AccordionItemProps}.
 * @returns The rendered item.
 * @see {@link Accordion}
 * @example
 * import { Accordion } from "@shadow-js/primitives";
 *
 * export function ShippingItem() {
 *   return (
 *     <Accordion type="single">
 *       <Accordion.Item value="shipping">
 *         <Accordion.Header>
 *           <Accordion.Trigger>Shipping</Accordion.Trigger>
 *         </Accordion.Header>
 *         <Accordion.Content>Ships in two days.</Accordion.Content>
 *       </Accordion.Item>
 *     </Accordion>
 *   );
 * }
 * @since 1.0.0
 */
export function AccordionItem<T extends PolymorphicTarget = "div">(
  props: AccordionItemProps<T>,
): JsxChild {
  const root = accordionContext.use("Accordion.Item");
  const [own, rest] = splitProps(partProps<Loose & AccordionItemOwnProps>(props), [
    "as",
    "value",
    "disabled",
  ]);
  const open = (): boolean => root.isOpen(own.value);
  const disabled = (): boolean => root.disabled() || own.disabled === true;
  const [mounted, setMounted] = useSignal<string | undefined>(undefined);
  const item = {
    value: () => own.value,
    open,
    defaultTriggerId: () => partId(root.baseId(), `trigger-${encodeTabValue(own.value)}`),
    mountedTriggerId: mounted,
    setMountedTriggerId: (id: string | undefined) => setMounted(() => id),
  };
  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return root.orientation();
      },
    },
    rest,
  );
  return (
    <accordionItemContext.Provider value={item}>
      <CollapsibleRoot
        as={own.as ?? "div"}
        open={open()}
        disabled={disabled()}
        onOpenChange={(next: boolean) => root.setItemOpen(own.value, next)}
        {...(merged as object)}
      />
    </accordionItemContext.Provider>
  );
}
