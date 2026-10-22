import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { collapsibleContext, createCollapsibleContext } from "./context";

/**
 * Own props of {@link Collapsible}.
 *
 * Accessibility: the WAI-ARIA disclosure pattern. The trigger is a native `button` (Enter and Space
 * toggle it, with no extra key handling) with `aria-expanded` and `aria-controls`; the root and the
 * content carry no role. Data attributes: `data-state` (`"open"` or `"closed"`) on the root, the
 * trigger and the content; `data-disabled` (value `""`, only when disabled) on the same three.
 * @see {@link CollapsibleRoot}
 * @since 1.0.0
 */
export interface CollapsibleOwnProps {
  /** Controlled open state. `undefined` keeps the collapsible uncontrolled. @default none */
  readonly open?: boolean | undefined;
  /** Initial open state when uncontrolled. @default false */
  readonly defaultOpen?: boolean | undefined;
  /** Called with the requested open state when the trigger asks to open or close. The `open` prop decides the actual state. @default none */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** Prevents the trigger from toggling; the trigger becomes a natively `disabled` button. @default false */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link Collapsible}: the own props and the attributes of the chosen element.
 * @see {@link CollapsibleRoot}
 * @since 1.0.0
 */
export type CollapsibleProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  CollapsibleOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN_KEYS = ["as", "open", "defaultOpen", "onOpenChange", "disabled"] as const;

/**
 * An interactive component that expands and collapses a panel (the WAI-ARIA disclosure pattern).
 * Keys: Enter and Space on the trigger toggle it (a native button click). ARIA: the trigger has
 * `aria-expanded` and `aria-controls`; no role is set on the root or the content. Renders a `div`
 * carrying `data-state="open" | "closed"` and `data-disabled`. Controlled with `open` /
 * `onOpenChange`, or uncontrolled with `defaultOpen`.
 *
 * @param props See {@link CollapsibleProps}.
 * @returns The rendered root.
 * @see {@link Collapsible}
 * @example
 * import { Collapsible } from "@shadow-js/primitives";
 *
 * export function MoreDetails() {
 *   return (
 *     <Collapsible>
 *       <Collapsible.Trigger>Show more</Collapsible.Trigger>
 *       <Collapsible.Content>Hidden until opened.</Collapsible.Content>
 *     </Collapsible>
 *   );
 * }
 * @since 1.0.0
 */
export function CollapsibleRoot<T extends PolymorphicTarget = "div">(
  props: CollapsibleProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & CollapsibleOwnProps>(props), OWN_KEYS);
  const context = createCollapsibleContext(own);
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
    },
    rest,
  );
  return (
    <collapsibleContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </collapsibleContext.Provider>
  );
}
