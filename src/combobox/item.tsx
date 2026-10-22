import { onCleanup, onMount, splitProps, untrack, useMemo, useSignal } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { type ComboboxItemEntry, comboboxContext, comboboxRegistryContext } from "./context";
import { comboboxGroupContext } from "./group-context";

/**
 * Own props of {@link ComboboxItem}.
 *
 * Accessibility: the option is `role="option"` with `aria-selected` and, when disabled,
 * `aria-disabled`. Data attributes: `data-state` is `"checked"` or `"unchecked"`, `data-selected` is
 * present (empty value) while picked, `data-highlighted` while it is the highlighted option, and
 * `data-disabled` while disabled.
 * @since 1.0.0
 * @see {@link ComboboxItem}
 */
export interface ComboboxItemOwnProps {
  /** The value reported by `onValueChange` and submitted with the form. Unique in the list. @default none (required) */
  readonly value: string;
  /**
   * The text the filter matches and the input shows once the item is picked. Give it when the
   * children are rich.
   * @default the text of the children when they are plain text, else the text the item shows once
   * mounted, else `value`
   */
  readonly label?: string | undefined;
  /** Alias of `label`, for parity with other libraries. `label` wins when both are set. @default none */
  readonly textValue?: string | undefined;
  /** Disables the item: it cannot be highlighted or picked. @default `false` */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link ComboboxItem}: the attributes of the chosen element (`div` by default) plus
 * {@link ComboboxItemOwnProps}.
 * @since 1.0.0
 * @see {@link ComboboxItem}
 */
export type ComboboxItemProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  ComboboxItemOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** The text a children value stands for, without touching the DOM it would render. */
function textOf(child: unknown): string {
  if (typeof child === "string") return child;
  if (typeof child === "number") return String(child);
  if (Array.isArray(child)) return child.map(textOf).join("");
  if (typeof child === "function") return textOf((child as () => unknown)());
  if (child instanceof Node) return child.textContent ?? "";
  return "";
}

/**
 * An option of the list: `role="option"` with `aria-selected` (picked), `aria-disabled`, and the
 * styling hooks `data-highlighted` (the option `aria-activedescendant` points at), `data-selected`,
 * `data-state="checked" | "unchecked"` and `data-disabled`. Moving the pointer over it highlights
 * it; clicking picks it: a single combobox closes and shows the label in the input, a multiple
 * one toggles the value and stays open. Items the filter rejects are not rendered at all. Keyboard:
 * the input keeps focus and moves the highlight; Enter on the input selects the highlighted option.
 *
 * @param props See {@link ComboboxItemProps}.
 * @returns The option element while the filter lets it through, otherwise nothing.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Content>
 *         <Combobox.Item value="apple" label="Apple">Apple</Combobox.Item>
 *       </Combobox.Content>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxContent}
 */
export function ComboboxItem<T extends PolymorphicTarget = "div">(
  props: ComboboxItemProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Item");
  const group = comboboxGroupContext.useOptional();
  // Inside the closed list's registry only the value and the text matter.
  const inRegistry = comboboxRegistryContext.useOptional() !== undefined;
  const [own, rest] = splitProps(partProps<Loose & ComboboxItemOwnProps>(props), [
    "as",
    "value",
    "label",
    "textValue",
    "disabled",
    "children",
  ]);
  const [measured, setMeasured] = useSignal<string | undefined>(undefined);
  const label = useMemo((): string => {
    const given = own.label ?? own.textValue;
    if (given !== undefined) return given;
    const fromChildren = textOf(own["children"]).trim();
    if (fromChildren !== "") return fromChildren;
    return measured() ?? own.value;
  });
  const visible = inRegistry
    ? (): boolean => false
    : useMemo((): boolean => context.matches({ value: own.value, label: label() }));
  const entry: ComboboxItemEntry = {
    value: () => own.value,
    label,
    disabled: () => own.disabled === true,
    visible,
    id: () => (rest["id"] as string | undefined) ?? context.itemId(own.value),
    registry: inRegistry,
  };
  // Registered while rendering so the server (which runs no effects) counts the item too.
  const unregister = context.registerEntry(entry);
  const releaseGroup = group?.track(visible);
  onMount(() => {
    context.touchEntries();
    group?.touch();
  });
  onCleanup(() => {
    unregister();
    releaseGroup?.();
    context.touchEntries();
    group?.touch();
  });
  if (inRegistry) return null;
  return (
    <Show when={visible()}>
      <ItemElement entry={entry} own={own} rest={rest} setMeasured={setMeasured} />
    </Show>
  );
}

interface ItemElementProps {
  readonly entry: ComboboxItemEntry;
  readonly own: Loose & ComboboxItemOwnProps;
  readonly rest: object;
  readonly setMeasured: (text: string | undefined) => void;
}

/** The rendered option; it exists only while the item passes the filter. */
function ItemElement(part: ItemElementProps): JsxChild {
  const context = comboboxContext.use("Combobox.Item");
  const { entry, own } = part;
  let element: HTMLElement | undefined;
  const isHighlighted = (): boolean => context.highlighted() === own.value;
  const isSelected = (): boolean => context.isSelected(own.value);
  const isDisabled = (): boolean => own.disabled === true;

  onMount(() => {
    if (element === undefined) return;
    const node = element;
    const release = context.collection.register(node, entry);
    // `pointerleave` does not bubble, so the runtime would bind it natively and never unbind it.
    const leave = (): void => {
      if (untrack(isHighlighted)) context.highlight(undefined, "pointer");
    };
    node.addEventListener("pointerleave", leave);
    onCleanup(() => node.removeEventListener("pointerleave", leave));
    // Rich children without a label: read what the user sees once it exists.
    if (own.label === undefined && own.textValue === undefined) {
      const text = node.textContent?.trim();
      if (text !== undefined && text !== "") part.setMeasured(text);
    }
    onCleanup(release);
  });

  const merged = mergeElementProps(
    {
      get id() {
        return entry.id();
      },
      role: "option",
      get "aria-selected"() {
        return isSelected();
      },
      get "aria-disabled"() {
        return isDisabled() ? true : undefined;
      },
      get "data-state"() {
        return isSelected() ? "checked" : "unchecked";
      },
      get "data-selected"() {
        return isSelected() ? "" : undefined;
      },
      get "data-highlighted"() {
        return isHighlighted() ? "" : undefined;
      },
      get "data-disabled"() {
        return isDisabled() ? "" : undefined;
      },
      // Library handlers sit in the lowest-priority source: the application's run first and can veto them.
      // A touch moving over options is a scroll, not a pointer hover: it does not highlight, as in menus and selects.
      onPointerMove: (event: PointerEvent) => {
        if (event.pointerType === "touch" || isDisabled() || untrack(isHighlighted)) return;
        context.highlight(own.value, "pointer");
      },
      onClick: () => {
        if (!isDisabled()) context.activate(own.value);
      },
    },
    part.rest,
    {
      ref: composeRefs<HTMLElement>((node) => {
        element = node;
      }),
    },
  );
  return (
    <Polymorphic as={own.as ?? "div"} {...merged}>
      {own["children"] as JsxChild}
    </Polymorphic>
  );
}
