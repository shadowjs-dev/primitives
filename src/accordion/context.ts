import type { Accessor } from "@shadow-js/core";
import {
  type Collection,
  createPartContext,
  type Direction,
  type Orientation,
  type PartContext,
} from "../utils/index";

/**
 * What an accordion trigger tells the root's collection (for the arrow keys). @internal
 * @see {@link Accordion}
 */
export interface AccordionTriggerData {
  /** Natively disabled triggers cannot take focus and are skipped. */
  readonly disabled: () => boolean;
}

/**
 * What every accordion part reads from its root. @internal
 * @see {@link Accordion}
 */
export interface AccordionContextValue {
  readonly type: Accessor<"single" | "multiple">;
  /** Whether the item with this value is open. Tracked. */
  readonly isOpen: (item: string) => boolean;
  readonly setItemOpen: (item: string, open: boolean) => void;
  /** Whether the open item may be closed (always true for `"multiple"`). */
  readonly collapsible: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly orientation: Accessor<Orientation>;
  readonly dir: Accessor<Direction>;
  readonly baseId: Accessor<string>;
  readonly triggers: Collection<AccordionTriggerData>;
}

/**
 * The context an `Accordion` root provides to its parts. Read it in a custom part rendered inside
 * the root; reading it anywhere else throws. Accessibility: the context carries no ARIA of its own;
 * the built-in parts use it to set `aria-expanded`, `aria-controls` and `aria-disabled`, and to
 * move focus with the arrow keys.
 *
 * @example
 * import { accordionContext } from "@shadow-js/primitives";
 *
 * export function AccordionTypeLabel() {
 *   const root = accordionContext.use("AccordionTypeLabel");
 *   return <span>{root.type()}</span>;
 * }
 * @see {@link Accordion}
 * @since 1.0.0
 */
export const accordionContext: PartContext<AccordionContextValue> =
  createPartContext<AccordionContextValue>("Accordion");

/**
 * What every accordion part inside an item reads from it. @internal
 * @see {@link Accordion}
 */
export interface AccordionItemContextValue {
  readonly value: Accessor<string>;
  readonly open: Accessor<boolean>;
  /** The id the trigger gets unless the application passes its own. */
  readonly defaultTriggerId: Accessor<string>;
  /** The id of the trigger that is mounted (it may be an application id), or undefined. */
  readonly mountedTriggerId: Accessor<string | undefined>;
  readonly setMountedTriggerId: (id: string | undefined) => void;
}

/**
 * The context an `Accordion.Item` provides to the trigger, header and content inside it. Read it in
 * a custom part rendered inside an item; reading it anywhere else throws. Accessibility: the
 * panel's `aria-labelledby` follows the id of the trigger that is mounted, so an application id on
 * the trigger is what the panel is named by.
 *
 * @example
 * import { accordionItemContext } from "@shadow-js/primitives";
 *
 * export function ItemValue() {
 *   const item = accordionItemContext.use("ItemValue");
 *   return <span>{item.value()}</span>;
 * }
 * @see {@link Accordion}
 * @since 1.0.0
 */
export const accordionItemContext: PartContext<AccordionItemContextValue> =
  createPartContext<AccordionItemContextValue>("Accordion.Item");
