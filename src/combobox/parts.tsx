import { onCleanup, onMount, splitProps, untrack, useMemo, useSignal } from "@shadow-js/core";
import { For, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  PopperAnchor,
  type PopperAnchorProps,
  PopperArrow,
  type PopperArrowProps,
} from "../popper/index";
import {
  composeRefs,
  createPartContext,
  mergeElementProps,
  type PartContext,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useBaseId,
  usePartRegistration,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { comboboxContext, comboboxRegistryContext } from "./context";
import { comboboxGroupContext } from "./group-context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link ComboboxAnchor}: the attributes of the chosen element (`div` by default) plus the
 * options of `PopperAnchor`.
 * @since 1.0.0
 * @see {@link ComboboxAnchor}
 */
export type ComboboxAnchorProps<T extends PolymorphicTarget = "div"> = PopperAnchorProps<T>;

/**
 * Props of {@link ComboboxArrow}: the props of `PopperArrow`.
 * @since 1.0.0
 * @see {@link ComboboxArrow}
 */
export type ComboboxArrowProps = PopperArrowProps;

/**
 * Props of {@link ComboboxTrigger}: the attributes of the chosen element (`button` by default).
 * Accessibility and data attributes are described on {@link ComboboxTrigger}.
 * @since 1.0.0
 * @see {@link ComboboxTrigger}
 */
export type ComboboxTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/**
 * Props of {@link ComboboxClear}: the attributes of the chosen element (`button` by default).
 * Accessibility and data attributes are described on {@link ComboboxClear}.
 * @since 1.0.0
 * @see {@link ComboboxClear}
 */
export type ComboboxClearProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/**
 * Props of {@link ComboboxGroup}: the attributes of the chosen element (`div` by default).
 * Accessibility and data attributes are described on {@link ComboboxGroup}.
 * @since 1.0.0
 * @see {@link ComboboxGroup}
 */
export type ComboboxGroupProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Props of {@link ComboboxLabel}: the attributes of the chosen element (`label` outside a group,
 * `div` inside one).
 * @since 1.0.0
 * @see {@link ComboboxLabel}
 */
export type ComboboxLabelProps<T extends PolymorphicTarget = "label"> = PolymorphicProps<
  "label",
  object,
  T
>;

/**
 * Props of {@link ComboboxSeparator}: the attributes of the chosen element (`div` by default).
 * @since 1.0.0
 * @see {@link ComboboxSeparator}
 */
export type ComboboxSeparatorProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Props of {@link ComboboxEmpty}: the attributes of the chosen element (`div` by default).
 * @since 1.0.0
 * @see {@link ComboboxEmpty}
 */
export type ComboboxEmptyProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Props of {@link ComboboxLoading}: the attributes of the chosen element (`div` by default).
 * @since 1.0.0
 * @see {@link ComboboxLoading}
 */
export type ComboboxLoadingProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * What `Combobox.Chips` hands its render function for each selected value.
 * @since 1.0.0
 * @see {@link ComboboxChips}
 */
export interface ComboboxChipData {
  /** The selected value. @default none (required) */
  readonly value: string;
  /** Its label (see `itemToString` on the root). Tracked. @default none (required) */
  readonly label: () => string;
}

/**
 * Props of {@link ComboboxChips}: `children` is a function called once per selected value.
 * @since 1.0.0
 * @see {@link ComboboxChips}
 */
export type ComboboxChipsProps<T extends PolymorphicTarget = "div"> = Omit<
  PolymorphicProps<"div", object, T>,
  "children"
> & {
  readonly children: (chip: ComboboxChipData) => JsxChild;
};

/**
 * Props of {@link ComboboxChip}: the attributes of the chosen element (`div` by default) plus its
 * selected value.
 * @since 1.0.0
 * @see {@link ComboboxChip}
 */
export type ComboboxChipProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  {
    /** The selected value this chip stands for. @default none (required) */
    readonly value: string;
  },
  T
>;

/**
 * Props of {@link ComboboxChipRemove}: the attributes of the chosen element (`button` by default).
 * @since 1.0.0
 * @see {@link ComboboxChipRemove}
 */
export type ComboboxChipRemoveProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

interface ChipContextValue {
  readonly value: () => string;
}
const chipContext: PartContext<ChipContextValue> =
  createPartContext<ChipContextValue>("Combobox.Chip");

/**
 * An element to anchor the list to instead of the input, typically the wrapper around the chips,
 * the input and the trigger. It also counts as inside for outside presses. Renders a `div`.
 * Keyboard: none; it handles no keys. ARIA: none; it sets no role or ARIA attribute.
 *
 * @param props See {@link ComboboxAnchorProps}.
 * @returns The rendered `div`.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Anchor class="flex gap-1">
 *         <Combobox.Input />
 *         <Combobox.Trigger>v</Combobox.Trigger>
 *       </Combobox.Anchor>
 *       <Combobox.Portal>
 *         <Combobox.Content>
 *           <Combobox.Item value="apple">Apple</Combobox.Item>
 *         </Combobox.Content>
 *       </Combobox.Portal>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxRoot}
 */
export function ComboboxAnchor<T extends PolymorphicTarget = "div">(
  props: ComboboxAnchorProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Anchor");
  onCleanup(() => context.setAnchorElement(undefined));
  return <PopperAnchor {...partProps<Loose>(props)} />;
}

/**
 * An arrow pointing at the anchor. Renders a positioned `span` holding an `svg` triangle (see
 * `PopperArrow`); style the triangle with `fill`. Keyboard: none. ARIA: the `svg` is
 * `aria-hidden="true"`, so the arrow is ignored by assistive technology.
 *
 * @param props See {@link ComboboxArrowProps}.
 * @returns The arrow element.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Portal>
 *         <Combobox.Content>
 *           <Combobox.Arrow class="fill-white" />
 *           <Combobox.Item value="apple">Apple</Combobox.Item>
 *         </Combobox.Content>
 *       </Combobox.Portal>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxContent}
 */
export function ComboboxArrow(props: ComboboxArrowProps): JsxChild {
  comboboxContext.use("Combobox.Arrow");
  return <PopperArrow {...props} />;
}

/**
 * The button that toggles the list. It is not a tab stop (`tabindex="-1"`, the input is the single
 * stop, as in the WAI-ARIA pattern), keeps focus in the input when pressed and carries an
 * `aria-label` you should translate. Its default `aria-label` is `"Toggle suggestions"`.
 * Accessibility: `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` (only while open).
 * Data attributes: `data-state` is `"open"` or `"closed"`, and `data-disabled` is present (empty
 * value) while disabled.
 *
 * @param props See {@link ComboboxTriggerProps}.
 * @returns The rendered `button`.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Trigger aria-label="Show fruits">v</Combobox.Trigger>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxInput}
 */
export function ComboboxTrigger<T extends PolymorphicTarget = "button">(
  props: ComboboxTriggerProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      type: "button",
      tabindex: -1,
      "aria-label": "Toggle suggestions",
      "aria-haspopup": "listbox",
      get "aria-expanded"() {
        return context.open();
      },
      get "aria-controls"() {
        return context.open() ? context.contentId() : undefined;
      },
      get disabled() {
        return context.disabled() ? true : undefined;
      },
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      // Pressing a button focuses it in most browsers; the input must keep focus.
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: () => {
        if (untrack(context.disabled)) return;
        context.setOpen(!untrack(context.open));
        context.focusInput();
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>((element) => context.setTrigger(element)) },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * The button that empties the combobox: it clears the selection and the text and keeps focus in
 * the input. It is hidden while there is nothing to clear. It is not a tab stop (`tabindex="-1"`)
 * and its default `aria-label` is `"Clear"`; translate it. Data attributes: `data-disabled` is
 * present (empty value) while the combobox is disabled.
 *
 * @param props See {@link ComboboxClearProps}.
 * @returns The rendered `button`.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Clear aria-label="Clear">x</Combobox.Clear>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxInput}
 */
export function ComboboxClear<T extends PolymorphicTarget = "button">(
  props: ComboboxClearProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Clear");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      type: "button",
      tabindex: -1,
      "aria-label": "Clear",
      get hidden() {
        return context.inputValue() === "" && context.selected().length === 0 ? true : undefined;
      },
      get disabled() {
        return context.disabled() ? true : undefined;
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: () => {
        if (untrack(context.disabled)) return;
        context.clearAll();
        context.focusInput();
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>((element) => context.setClear(element)) },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * A group of options with a heading: `role="group"` labeled by `Combobox.Label` placed inside it.
 * While the filter rejects every item of the group, the group is hidden so its heading does not
 * dangle. Renders a `div` by default.
 *
 * @param props See {@link ComboboxGroupProps}.
 * @returns The rendered group, or the children alone while the closed list's registry is running.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Content>
 *         <Combobox.Group>
 *           <Combobox.Label>Fruits</Combobox.Label>
 *           <Combobox.Item value="apple">Apple</Combobox.Item>
 *         </Combobox.Group>
 *       </Combobox.Content>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxLabel}
 */
export function ComboboxGroup<T extends PolymorphicTarget = "div">(
  props: ComboboxGroupProps<T>,
): JsxChild {
  comboboxContext.use("Combobox.Group");
  // In the closed list's registry a group is only a place its items live in.
  if (comboboxRegistryContext.useOptional() !== undefined) {
    return partProps<Loose>(props)["children"] as JsxChild;
  }
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "id"]);
  const base = useBaseId(() => own["id"] as string | undefined);
  const label = usePartRegistration();
  const members = new Set<() => boolean>();
  const [version, setVersion] = useSignal(0);
  const empty = useMemo((): boolean => {
    version();
    if (members.size === 0) return false;
    for (const visible of members) {
      if (visible()) return false;
    }
    return true;
  });
  const merged = mergeElementProps(
    {
      role: "group",
      get id() {
        return base();
      },
      get "aria-labelledby"() {
        return label.present() ? `${base()}-label` : undefined;
      },
      get hidden() {
        return empty() ? true : undefined;
      },
    },
    rest,
  );
  return (
    <comboboxGroupContext.Provider
      value={{
        labelId: () => `${base()}-label`,
        label,
        track(visible) {
          members.add(visible);
          return () => {
            members.delete(visible);
          };
        },
        touch: () => {
          setVersion((count) => count + 1);
        },
      }}
    >
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </comboboxGroupContext.Provider>
  );
}

/**
 * A label. Inside a `Combobox.Group` it is the heading that names the group (a `div` by default,
 * and the group's `aria-labelledby` points at it); anywhere else it is a `label` element whose `for`
 * points at the input, and the list is named by it.
 *
 * @param props See {@link ComboboxLabelProps}.
 * @returns The rendered label element, or nothing while the closed list's registry is running.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Label>Favorite fruit</Combobox.Label>
 *       <Combobox.Input />
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxGroup}
 */
export function ComboboxLabel<T extends PolymorphicTarget = "label">(
  props: ComboboxLabelProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Label");
  const group = comboboxGroupContext.useOptional();
  if (comboboxRegistryContext.useOptional() !== undefined) return null;
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  if (group !== undefined) {
    group.label.register();
    const inGroup = mergeElementProps(
      {
        get id() {
          return group.labelId();
        },
      },
      rest,
    );
    return <Polymorphic as={own.as ?? "div"} {...inGroup} />;
  }
  context.label.register();
  const merged = mergeElementProps(
    {
      get id() {
        return context.labelId();
      },
      get for() {
        return context.inputId();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "label"} {...merged} />;
}

/**
 * A separator between groups of options. It is purely visual (`role="presentation"`): a listbox
 * may own only options and groups, so a `separator` role there is invalid ARIA. It is hidden while
 * the list is being filtered (`shouldFilter` on and a non-blank query), when the groups it divides
 * are no longer all there.
 *
 * @param props See {@link ComboboxSeparatorProps}.
 * @returns The rendered `div`, or nothing while the closed list's registry is running.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Content>
 *         <Combobox.Group>
 *           <Combobox.Item value="apple">Apple</Combobox.Item>
 *         </Combobox.Group>
 *         <Combobox.Separator />
 *         <Combobox.Group>
 *           <Combobox.Item value="banana">Banana</Combobox.Item>
 *         </Combobox.Group>
 *       </Combobox.Content>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxGroup}
 */
export function ComboboxSeparator<T extends PolymorphicTarget = "div">(
  props: ComboboxSeparatorProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Separator");
  if (comboboxRegistryContext.useOptional() !== undefined) return null;
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      role: "presentation",
      get hidden() {
        return context.shouldFilter() && context.query().trim() !== "" ? true : undefined;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * Shown only while the list is open, nothing matches and no `Combobox.Loading` is mounted. The
 * result count is announced to screen readers by the list, so this element is presentational
 * (`role="presentation"`) and carries `data-empty`.
 *
 * @param props See {@link ComboboxEmptyProps}.
 * @returns The rendered `div` while the empty state applies, otherwise nothing.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Content>
 *         <Combobox.Item value="apple">Apple</Combobox.Item>
 *         <Combobox.Empty>No fruit found.</Combobox.Empty>
 *       </Combobox.Content>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxLoading}
 */
export function ComboboxEmpty<T extends PolymorphicTarget = "div">(
  props: ComboboxEmptyProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Empty");
  if (comboboxRegistryContext.useOptional() !== undefined) return null;
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps({ role: "presentation", "data-empty": "" }, rest);
  return (
    <Show
      when={
        context.mounted() &&
        context.open() &&
        context.matchCount() === 0 &&
        !context.loading.present()
      }
    >
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </Show>
  );
}

/**
 * Marks the list as loading while it is mounted: render it from your own `loading` state. The
 * list gets `aria-busy`, `Combobox.Empty` stays hidden and the result count is not announced until
 * it is gone. Renders a presentational `div` (`role="presentation"`) with `data-loading`.
 *
 * @param props See {@link ComboboxLoadingProps}.
 * @returns The rendered `div`, or nothing while the closed list's registry is running.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker(props: { readonly loading: boolean }) {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Content>
 *         {props.loading ? <Combobox.Loading>Searching...</Combobox.Loading> : null}
 *       </Combobox.Content>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxEmpty}
 */
export function ComboboxLoading<T extends PolymorphicTarget = "div">(
  props: ComboboxLoadingProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Loading");
  // The closed list's registry must not make the list look busy.
  if (comboboxRegistryContext.useOptional() !== undefined) return null;
  context.loading.register();
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps({ role: "presentation", "data-loading": "" }, rest);
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * Renders one entry per selected value of a `multiple` combobox, in selection order. Its children
 * is a function that receives the value and its label and returns a `Combobox.Chip`. Renders a
 * `div` by default. Keyboard: the container handles no keys; each chip handles its own (see
 * `Combobox.Chip`). ARIA: the container sets no role or ARIA attribute of its own.
 *
 * @param props See {@link ComboboxChipsProps}.
 * @returns The rendered `div` holding one chip per selected value.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function Tags() {
 *   return (
 *     <Combobox multiple defaultValue={["apple"]}>
 *       <Combobox.Chips>
 *         {(chip) => (
 *           <Combobox.Chip value={chip.value}>
 *             {chip.label()}
 *             <Combobox.ChipRemove>x</Combobox.ChipRemove>
 *           </Combobox.Chip>
 *         )}
 *       </Combobox.Chips>
 *       <Combobox.Input />
 *       <Combobox.Content>
 *         <Combobox.Item value="apple">Apple</Combobox.Item>
 *       </Combobox.Content>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxChip}
 */
export function ComboboxChips<T extends PolymorphicTarget = "div">(
  props: ComboboxChipsProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Chips");
  const [own, rest] = splitProps(
    partProps<Loose & { children: (chip: ComboboxChipData) => JsxChild }>(props),
    ["as", "children"],
  );
  const merged = mergeElementProps({}, rest);
  return (
    <Polymorphic as={own.as ?? "div"} {...merged}>
      <For each={context.selected()}>
        {(value: string) =>
          untrack(() => own.children)({ value, label: () => context.labelOf(value) })
        }
      </For>
    </Polymorphic>
  );
}

/**
 * A selected value of a `multiple` combobox. It is `role="group"`, named after its label, and not a
 * tab stop (`tabindex="-1"`): chips are reached with the keys below. From the input, the arrow key
 * that points at the chips (ArrowLeft, or ArrowRight in RTL) with the caret at the start of the text
 * focuses the last chip. Inside a chip, ArrowLeft and ArrowRight move between chips (ArrowRight past
 * the last one returns focus to the input) and Backspace or Delete removes it and focuses its
 * neighbor, or the input when there is none. Renders a `div` by default.
 *
 * @param props See {@link ComboboxChipProps}.
 * @returns The rendered chip element.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function Tags() {
 *   return (
 *     <Combobox multiple defaultValue={["apple"]}>
 *       <Combobox.Chips>
 *         {(chip) => (
 *           <Combobox.Chip value={chip.value}>
 *             {chip.label()}
 *             <Combobox.ChipRemove>x</Combobox.ChipRemove>
 *           </Combobox.Chip>
 *         )}
 *       </Combobox.Chips>
 *       <Combobox.Input />
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxChipRemove}
 */
export function ComboboxChip<T extends PolymorphicTarget = "div">(
  props: ComboboxChipProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Chip");
  const [own, rest] = splitProps(partProps<Loose & { value: string }>(props), [
    "as",
    "value",
    "children",
  ]);
  let element: HTMLElement | undefined;
  onMount(() => {
    if (element === undefined) return;
    onCleanup(context.chips.register(element, { value: () => own.value }));
  });
  const onKeyDown = (event: KeyboardEvent): void => {
    if (untrack(context.disabled)) return;
    const items = context.chips.getItems();
    const index = items.findIndex((item) => item.element === element);
    if (index === -1) return;
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      const neighbor = items[index + 1] ?? items[index - 1];
      context.removeValue(own.value);
      if (neighbor !== undefined) neighbor.element.focus();
      else context.focusInput();
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const towardStart = (event.key === "ArrowLeft") === (context.dir() === "ltr");
    if (towardStart) items[index - 1]?.element.focus();
    else if (items[index + 1] !== undefined) items[index + 1]?.element.focus();
    else context.focusInput();
  };
  const merged = mergeElementProps(
    {
      role: "group",
      tabindex: -1,
      get "aria-label"() {
        return context.labelOf(own.value);
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      onKeyDown,
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => {
        element = node;
      }),
    },
  );
  return (
    <chipContext.Provider value={{ value: () => own.value }}>
      <Polymorphic as={own.as ?? "div"} {...merged}>
        {own["children"] as JsxChild}
      </Polymorphic>
    </chipContext.Provider>
  );
}

/**
 * The button that removes its chip. Keeps focus in the input and is not a tab stop (`tabindex="-1"`;
 * the chip itself is removable with the keyboard). Its default `aria-label` is `Remove <label>`, where
 * the label is the chip's label; pass your own to translate it.
 *
 * @param props See {@link ComboboxChipRemoveProps}.
 * @returns The rendered `button`.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function Tags() {
 *   return (
 *     <Combobox multiple defaultValue={["apple"]}>
 *       <Combobox.Chips>
 *         {(chip) => (
 *           <Combobox.Chip value={chip.value}>
 *             {chip.label()}
 *             <Combobox.ChipRemove aria-label={`Remove ${chip.label()}`}>x</Combobox.ChipRemove>
 *           </Combobox.Chip>
 *         )}
 *       </Combobox.Chips>
 *       <Combobox.Input />
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxChip}
 */
export function ComboboxChipRemove<T extends PolymorphicTarget = "button">(
  props: ComboboxChipRemoveProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.ChipRemove");
  const chip = chipContext.use("Combobox.ChipRemove");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      type: "button",
      tabindex: -1,
      get "aria-label"() {
        return `Remove ${context.labelOf(chip.value())}`;
      },
      get disabled() {
        return context.disabled() ? true : undefined;
      },
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: () => {
        if (untrack(context.disabled)) return;
        context.removeValue(chip.value());
        context.focusInput();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
