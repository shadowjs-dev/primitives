import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  createCollection,
  type Direction,
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useBaseId,
  useControllableState,
  useRefSignal,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import { type AccordionTriggerData, accordionContext } from "./context";
import { type AccordionType, itemsToSingle, sameItems, setItemOpen, singleToItems } from "./value";

/**
 * Props every accordion has, whatever its `type`.
 *
 * Accessibility: the root carries no role. Each trigger is a native `button` (Enter and Space toggle
 * it). Up and Down move focus between the triggers when `orientation` is `"vertical"` (the
 * default); Left and Right do so when it is `"horizontal"`, swapped in RTL. Both wrap around. Home
 * and End focus the first and last enabled trigger. Keys with Shift, Ctrl, Alt or Meta are ignored,
 * and Page Up and Page Down are not handled. Each panel is a `role="region"` labeled by its trigger.
 *
 * Data attributes: `data-orientation` (`"vertical"` or `"horizontal"`) on the root, the items, the
 * headers, the triggers and the contents; `dir` is written on the root only when set explicitly.
 * @see {@link AccordionRoot}
 * @since 1.0.0
 */
export interface AccordionBaseOwnProps {
  /** Disables every item: each trigger becomes a natively `disabled` button with `data-disabled`. @default false */
  readonly disabled?: boolean | undefined;
  /** Axis of the accordion; decides which arrow keys move focus between triggers. @default "vertical" */
  readonly orientation?: Orientation | undefined;
  /** Reading direction; `"rtl"` swaps the horizontal arrow keys. @default none (inherited from `DirectionProvider`, then the document, then `"ltr"`) */
  readonly dir?: Direction | undefined;
  /** Base id; the trigger and content ids derive from it. @default none (generated) */
  readonly baseId?: string | undefined;
}

/**
 * Own props of an accordion where at most one item is open (`type="single"`). Opening an item
 * closes the one that was open. Accessibility: the keyboard and ARIA model of
 * {@link AccordionBaseOwnProps}. The open trigger of a non-`collapsible` accordion carries
 * `aria-disabled="true"` but stays focusable, because it cannot be closed by a click.
 * @see {@link AccordionRoot}
 * @since 1.0.0
 */
export interface AccordionSingleOwnProps extends AccordionBaseOwnProps {
  /** Selects the single-open mode. @default none (required) */
  readonly type: "single";
  /** Controlled open item, or `""` for none. `undefined` keeps the accordion uncontrolled. @default none */
  readonly value?: string | undefined;
  /** The item that is open first when uncontrolled. @default none (no item is open) */
  readonly defaultValue?: string | undefined;
  /** Called with the item that opened, or with `""` when the open item was closed. @default none */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /** Whether the open item can be closed by activating its trigger. @default false */
  readonly collapsible?: boolean | undefined;
}

/**
 * Own props of an accordion where any number of items can be open (`type="multiple"`). Each item
 * opens and closes on its own. Accessibility: the keyboard and ARIA model of
 * {@link AccordionBaseOwnProps}; no trigger is `aria-disabled` because every open item can close.
 * @see {@link AccordionRoot}
 * @since 1.0.0
 */
export interface AccordionMultipleOwnProps extends AccordionBaseOwnProps {
  /** Selects the multiple-open mode. @default none (required) */
  readonly type: "multiple";
  /** Controlled open items. `undefined` keeps the accordion uncontrolled. @default none */
  readonly value?: string[] | undefined;
  /** The items that are open first when uncontrolled. @default none (no item is open) */
  readonly defaultValue?: string[] | undefined;
  /** Called with the full list of open items whenever the user opens or closes one. @default none */
  readonly onValueChange?: ((value: string[]) => void) | undefined;
}

/**
 * Props of {@link Accordion}: a union discriminated by `type`, so `type="single"` with an array
 * value (or `type="multiple"` with a string) does not compile.
 * @see {@link AccordionRoot}
 * @since 1.0.0
 */
export type AccordionProps<T extends PolymorphicTarget = "div"> =
  | PolymorphicProps<"div", AccordionSingleOwnProps, T>
  | PolymorphicProps<"div", AccordionMultipleOwnProps, T>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** The own props as the implementation reads them: both shapes merged. */
interface OwnProps extends AccordionBaseOwnProps {
  readonly type?: AccordionType | undefined;
  readonly value?: string | string[] | undefined;
  readonly defaultValue?: string | string[] | undefined;
  readonly onValueChange?: ((value: never) => void) | undefined;
  readonly collapsible?: boolean | undefined;
}

const OWN_KEYS = [
  "as",
  "type",
  "value",
  "defaultValue",
  "onValueChange",
  "collapsible",
  "disabled",
  "orientation",
  "dir",
  "baseId",
] as const;

/** Normalizes a public `value` / `defaultValue` to the list of open items. */
function toItems(
  type: AccordionType,
  value: string | string[] | undefined,
): readonly string[] | undefined {
  if (type === "single") return singleToItems(typeof value === "string" ? value : undefined);
  return Array.isArray(value) ? value : undefined;
}

/**
 * A vertically stacked set of headings that each reveal a section of content (the WAI-ARIA
 * accordion pattern). Keys: Enter and Space toggle the focused trigger; Up and Down (Left and Right
 * when horizontal, swapped in RTL) move focus between triggers with wrap-around; Home and End focus
 * the first and last enabled trigger. ARIA: triggers are buttons with `aria-expanded` and
 * `aria-controls`; panels are `role="region"` labeled by their trigger. With `type="single"` one
 * item is open at a time (`collapsible` lets it close); with `type="multiple"` any number are.
 * Controlled with `value` / `onValueChange`, or uncontrolled with `defaultValue`. Renders a `div`
 * carrying `data-orientation`.
 *
 * @param props See {@link AccordionProps}.
 * @returns The rendered accordion root.
 * @see {@link Accordion}
 * @example
 * import { Accordion } from "@shadow-js/primitives";
 *
 * export function FaqAccordion() {
 *   return (
 *     <Accordion type="single" collapsible defaultValue="a">
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
export function AccordionRoot<T extends PolymorphicTarget = "div">(
  props: AccordionProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & OwnProps>(props), OWN_KEYS);
  const type = (): AccordionType => (own.type === "multiple" ? "multiple" : "single");
  const collapsible = (): boolean => type() === "multiple" || own.collapsible === true;

  const [open, setOpen] = useControllableState<readonly string[]>({
    value: () => toItems(type(), own.value),
    defaultValue: () => toItems(type(), own.defaultValue) ?? [],
    onChange: () => {
      const callback = own.onValueChange as ((value: string | string[]) => void) | undefined;
      if (callback === undefined) return undefined;
      return (items) => callback(type() === "single" ? itemsToSingle(items) : [...items]);
    },
    equals: sameItems,
    name: "Accordion value",
  });

  const base = useBaseId(() => own.baseId);
  const [root, setRoot] = useRefSignal<HTMLElement>();
  const dir = useDirectionAround(() => own.dir as Direction | undefined, root);
  const triggers = createCollection<AccordionTriggerData>();
  const context = {
    type,
    isOpen: (item: string): boolean => open().includes(item),
    setItemOpen: (item: string, next: boolean): void => {
      setOpen((current) => setItemOpen(type(), current, item, next, collapsible()));
    },
    collapsible,
    disabled: (): boolean => own.disabled === true,
    orientation: (): Orientation => own.orientation ?? "vertical",
    dir,
    baseId: base,
    triggers,
  };

  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return context.orientation();
      },
      // Only an explicit `dir` is written: the inherited one is resolved on the client alone.
      get dir() {
        return own.dir;
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>((element) => setRoot(element)) },
  );
  return (
    <accordionContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </accordionContext.Provider>
  );
}
