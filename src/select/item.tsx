import { onCleanup, splitProps, untrack, useEffect, useSignal } from "@shadow-js/core";
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
import { selectContentContext, selectContext, selectItemContext } from "./context";

/**
 * Own props of {@link SelectItem}.
 *
 * Accessibility: the item is `role="option"` with `aria-selected`, named by `aria-labelledby` (its
 * `Select.ItemText`), and `aria-disabled` while disabled. Enter and Space select it. Pointer selection
 * happens on `pointerup` for a mouse and on `click` for touch and pen.
 *
 * Data attributes: `data-state` (`checked` | `unchecked`), `data-highlighted` (value `""`, while the
 * item has focus) and `data-disabled` (value `""`, while disabled).
 * @see {@link SelectItem}
 * @see {@link Select}
 * @since 1.0.0
 */
export interface SelectItemOwnProps {
  /**
   * The value this item selects. Must not be the empty string, which means "no value".
   * @default none (required)
   */
  readonly value: string;
  /**
   * Disabled items cannot be selected or focused with the keyboard.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
  /**
   * The text typeahead matches and `Select.Value` shows. Defaults to the text content of
   * `Select.ItemText` (or of the item when it has no `Select.ItemText`).
   * @default the text content of `Select.ItemText`, or of the item itself
   */
  readonly textValue?: string | undefined;
}

/**
 * Props of {@link SelectItem}.
 * @see {@link SelectItem}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectItemProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  SelectItemOwnProps,
  T
>;

/**
 * Props of {@link SelectItemText}.
 * @see {@link SelectItemText}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectItemTextProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

/**
 * Props of {@link SelectItemIndicator}.
 * @see {@link SelectItemIndicator}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectItemIndicatorProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** Keys that select the focused item. */
const SELECTION_KEYS: readonly string[] = [" ", "Enter"];

/** The text of an element as typeahead and the trigger see it. */
function textOf(element: HTMLElement): string {
  return (element.textContent ?? "").trim();
}

/**
 * One option: `role="option"` with `aria-selected`, `aria-labelledby` pointing at its
 * `Select.ItemText`, `data-state="checked" | "unchecked"`, `data-highlighted` while it has focus
 * (keyboard or pointer), and `aria-disabled` / `data-disabled` while disabled.
 *
 * A mouse selects on `pointerup`, like a native select, so press-drag-release works; the release
 * that ends the click that opened the listbox is ignored. Touch and pen select on `click`.
 * Enter and Space select from the keyboard (Space is part of the search while the user is typing).
 * Moving the mouse over an item focuses it; leaving it returns focus to the listbox.
 *
 * @param props See {@link SelectItemProps}.
 * @returns The rendered option.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.Item value="apple"><Select.ItemText>Apple</Select.ItemText><Select.ItemIndicator>✓</Select.ItemIndicator></Select.Item>;
 * @see {@link SelectItemText}
 * @see {@link SelectItemIndicator}
 * @since 1.0.0
 */
export function SelectItem<T extends PolymorphicTarget = "div">(
  props: SelectItemProps<T>,
): JsxChild {
  const context = selectContext.use("Select.Item");
  const content = selectContentContext.useOptional();
  const [own, rest] = splitProps(partProps<Loose & SelectItemOwnProps>(props), [
    "as",
    "value",
    "disabled",
    "textValue",
    "children",
  ]);
  if (__DEV__ && own.value === "") {
    console.error(
      "[primitives SELECT_EMPTY_ITEM_VALUE] A <Select.Item /> must have a value prop that is not an empty string. The empty string is how the select clears its value and shows the placeholder.",
    );
  }
  const textId = `${context.generateId("item")}-text`;
  const [element, setElement] = useSignal<HTMLElement | undefined>(undefined);
  const [textElement, setTextElement] = useSignal<HTMLElement | undefined>(undefined);
  const [measured, setMeasured] = useSignal("");
  const [highlighted, setHighlighted] = useSignal(false);
  const selected = (): boolean => context.value() === own.value;
  const disabled = (): boolean => own.disabled === true;
  const text = (): string => own.textValue ?? measured();
  // `touch` until a pointer says otherwise, so a programmatic click still selects.
  let pointerType = "touch";

  // Registered for as long as the element exists: the open listbox and the closed-state registry
  // both feed the same collection (keyboard navigation, typeahead, `Select.Value`, form options).
  useEffect(() => {
    const node = element();
    if (node === undefined) return;
    const data = untrack(() => ({ value: own.value, textValue: text(), disabled: disabled() }));
    onCleanup(context.collection.register(node, data));
  });
  useEffect(() => {
    const node = element();
    if (node === undefined) return;
    const data = { value: own.value, textValue: text(), disabled: disabled() };
    untrack(() => context.collection.update(node, data));
  });
  // The text can come from children that change (translations, async labels): follow them.
  useEffect(() => {
    const node = textElement() ?? element();
    if (node === undefined) return;
    setMeasured(textOf(node));
    if (typeof MutationObserver !== "function") return;
    const observer = new MutationObserver(() => setMeasured(textOf(node)));
    observer.observe(node, { childList: true, subtree: true, characterData: true });
    onCleanup(() => observer.disconnect());
  });

  const select = (): void => {
    if (disabled()) return;
    context.setValue(own.value);
    context.setOpen(false);
  };

  const merged = mergeElementProps(
    {
      role: "option",
      get "aria-labelledby"() {
        return textId;
      },
      get "aria-selected"() {
        return selected();
      },
      get "aria-disabled"() {
        return disabled() ? true : undefined;
      },
      get "data-state"() {
        return selected() ? "checked" : "unchecked";
      },
      get "data-highlighted"() {
        return highlighted() ? "" : undefined;
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      get tabindex() {
        return disabled() ? undefined : -1;
      },
      onFocus: () => setHighlighted(true),
      onBlur: () => setHighlighted(false),
      onPointerDown: (event: PointerEvent) => {
        pointerType = event.pointerType;
      },
      onClick: () => {
        if (pointerType !== "mouse") select();
      },
      onPointerUp: (event: PointerEvent) => {
        // A drag from the trigger can end here without a pointermove over this item.
        pointerType = event.pointerType;
        // The content cancels the release that ends the click that opened the listbox.
        if (pointerType === "mouse" && !event.defaultPrevented) select();
      },
      onPointerMove: (event: PointerEvent) => {
        pointerType = event.pointerType;
        if (disabled()) content?.onItemLeave();
        else if (event.pointerType === "mouse") element()?.focus({ preventScroll: true });
      },
      onPointerLeave: () => {
        const node = element();
        if (node !== undefined && node.ownerDocument.activeElement === node) content?.onItemLeave();
      },
      onKeyDown: (event: KeyboardEvent) => {
        // While a search is running Space is a letter of it, not "select".
        if (content?.isTypingAhead() === true && event.key === " ") return;
        if (SELECTION_KEYS.includes(event.key)) {
          select();
          // Space would scroll the page, Enter could submit a surrounding form.
          event.preventDefault();
        }
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>((node) => setElement(node)) },
  );

  return (
    <selectItemContext.Provider
      value={{
        textId: () => textId,
        selected,
        setTextElement: (node) => setTextElement(() => node),
      }}
    >
      <Polymorphic as={own.as ?? "div"} {...merged}>
        {own["children"] as JsxChild}
      </Polymorphic>
    </selectItemContext.Provider>
  );
}

/**
 * The text of an item. It names the option (`aria-labelledby`), is what typeahead matches and what
 * `Select.Value` shows for the selected item.
 *
 * @param props See {@link SelectItemTextProps}.
 * @returns The rendered text element.
 * @throws When rendered outside a `Select.Item`.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.ItemText>Apple</Select.ItemText>;
 * @see {@link SelectItem}
 * @since 1.0.0
 */
export function SelectItemText<T extends PolymorphicTarget = "span">(
  props: SelectItemTextProps<T>,
): JsxChild {
  const item = selectItemContext.use("Select.ItemText");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get id() {
        return item.textId();
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>((node) => item.setTextElement(node)) },
  );
  return <Polymorphic as={own.as ?? "span"} {...merged} />;
}

/**
 * Rendered only while its item is selected (a check mark, usually). Hidden from assistive
 * technology (`aria-hidden`): `aria-selected` already says it.
 *
 * @param props See {@link SelectItemIndicatorProps}.
 * @returns The indicator while the item is selected, otherwise nothing.
 * @throws When rendered outside a `Select.Item`.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select.ItemIndicator>✓</Select.ItemIndicator>;
 * @see {@link SelectItem}
 * @since 1.0.0
 */
export function SelectItemIndicator<T extends PolymorphicTarget = "span">(
  props: SelectItemIndicatorProps<T>,
): JsxChild {
  const item = selectItemContext.use("Select.ItemIndicator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps({ "aria-hidden": true }, rest);
  return (
    <Show when={item.selected()}>
      <Polymorphic as={own.as ?? "span"} {...merged} />
    </Show>
  );
}
