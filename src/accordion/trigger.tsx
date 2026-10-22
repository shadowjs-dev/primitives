import { onCleanup, splitProps, useEffect, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { collapsibleContext } from "../collapsible/context";
import { CollapsibleTrigger } from "../collapsible/trigger";
import {
  composeEventHandlers,
  composeRefs,
  getRovingTarget,
  mergeElementProps,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { accordionContext, accordionItemContext } from "./context";

/**
 * Props of {@link AccordionTrigger}.
 * @see {@link AccordionTrigger}
 * @since 1.0.0
 */
export type AccordionTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** The keys that move focus between triggers. Page Up / Page Down are not part of the pattern. */
const NAVIGATION_KEYS: ReadonlySet<string> = new Set([
  "ArrowDown",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
]);

/**
 * The button that toggles its item. Keys: Enter and Space toggle it (a native button click); the
 * arrow keys of the accordion's orientation move focus to the previous or next enabled trigger and
 * wrap around, Home and End focus the first and last enabled trigger. ARIA: `aria-expanded`,
 * `aria-controls` (the panel), and `aria-disabled="true"` on the open trigger of a non-`collapsible`
 * single accordion, which stays focusable. Renders a `button` with `type="button"`, `data-state`,
 * `data-disabled` and `data-orientation`.
 *
 * @param props See {@link AccordionTriggerProps}.
 * @returns The rendered trigger button.
 * @see {@link Accordion}
 * @example
 * import { Accordion } from "@shadow-js/primitives";
 *
 * export function AccessibilityQuestion() {
 *   return (
 *     <Accordion type="single">
 *       <Accordion.Item value="a">
 *         <Accordion.Header>
 *           <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
 *         </Accordion.Header>
 *         <Accordion.Content>Yes.</Accordion.Content>
 *       </Accordion.Item>
 *     </Accordion>
 *   );
 * }
 * @since 1.0.0
 */
export function AccordionTrigger<T extends PolymorphicTarget = "button">(
  props: AccordionTriggerProps<T>,
): JsxChild {
  const root = accordionContext.use("Accordion.Trigger");
  const item = accordionItemContext.use("Accordion.Trigger");
  const collapsible = collapsibleContext.use("Accordion.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onKeyDown"]);
  const [element, setElement] = useSignal<HTMLElement | undefined>(undefined);
  const idProp = (): string | undefined => (rest as { id?: string }).id;
  const triggerId = (): string => idProp() ?? item.defaultTriggerId();

  useEffect(() => {
    const node = element();
    if (node === undefined) return;
    onCleanup(root.triggers.register(node, { disabled: collapsible.disabled }));
  });
  // The region's aria-labelledby follows an application id once this trigger is mounted.
  useEffect(() => {
    item.setMountedTriggerId(triggerId());
    onCleanup(() => item.setMountedTriggerId(undefined));
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!NAVIGATION_KEYS.has(event.key)) return;
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target !== event.currentTarget) return;
    const items = root.triggers.getItems();
    const current = items.findIndex((entry) => entry.element === event.currentTarget);
    if (current === -1) return;
    const target = getRovingTarget({
      key: event.key,
      orientation: root.orientation(),
      dir: root.dir(),
      loop: true,
      disabled: items.map((entry) => entry.data.disabled()),
      current,
    });
    if (target === undefined) return;
    event.preventDefault();
    items[target]?.element.focus();
  };

  const merged = mergeElementProps(
    {
      get id() {
        return triggerId();
      },
      get "aria-disabled"() {
        // The only open item of a non-collapsible single accordion cannot be closed, but it must
        // stay focusable, so it is aria-disabled rather than natively disabled.
        return item.open() && !root.collapsible() ? true : undefined;
      },
      get "data-orientation"() {
        return root.orientation();
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => setElement(node)),
      onKeyDown: composeEventHandlers(() => own.onKeyDown, onKeyDown),
    },
  );
  return <CollapsibleTrigger as={own.as ?? "button"} {...(merged as object)} />;
}
