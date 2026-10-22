import { splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  composeRefs,
  createTypeahead,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { selectContext } from "./context";

/**
 * Props of {@link SelectTrigger}: the attributes of the chosen element.
 * @see {@link SelectTrigger}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** Keys that open the listbox from the closed trigger (WAI-ARIA select-only combobox). */
const OPEN_KEYS: readonly string[] = [" ", "Enter", "ArrowUp", "ArrowDown"];

/**
 * The control that opens the listbox: a `button` with `role="combobox"`, `aria-haspopup="listbox"`,
 * `aria-expanded`, `aria-autocomplete="none"`, `aria-required` and `aria-controls` (only while the
 * listbox is open, so it never points at nothing). `data-placeholder` is present while no value is
 * selected; `data-state` is `open` | `closed`; `data-disabled` while disabled.
 *
 * A left-button mouse press opens it on `pointerdown` (so the user can press, drag onto an item and
 * release, like a native select); touch and pen open on `click`. Enter, Space, ArrowDown and
 * ArrowUp open it from the keyboard. Typing while it is closed changes the value without opening
 * the listbox (typeahead). Pass `aria-labelledby`, `aria-describedby` or `id` to wire labels.
 *
 * @param props See {@link SelectTriggerProps}.
 * @returns The rendered trigger.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select>
 *   <Select.Trigger class="field" aria-label="Fruit"><Select.Value placeholder="Pick" /></Select.Trigger>
 * </Select>;
 * @see {@link SelectValue}
 * @see {@link Select}
 * @since 1.0.0
 */
export function SelectTrigger<T extends PolymorphicTarget = "button">(
  props: SelectTriggerProps<T>,
): JsxChild {
  const context = selectContext.use("Select.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "onClick",
    "onPointerDown",
    "onKeyDown",
  ]);
  const native = (): boolean => (own.as ?? "button") === "button";
  const typeahead = createTypeahead();
  let element: HTMLElement | undefined;
  // `touch` until a pointer says otherwise: a keyboard-generated click must not behave like a mouse press.
  let pointerType = "touch";

  const open = (origin?: PointerEvent): void => {
    if (context.disabled()) return;
    context.setOpen(true);
    typeahead.reset();
    context.pointerOrigin.current =
      origin === undefined
        ? undefined
        : { x: Math.round(origin.clientX), y: Math.round(origin.clientY) };
  };

  /**
   * A pointer press: closes an open listbox, opens a closed one. The trigger counts as inside the
   * layer (see Content), so a press on it reaches this handler instead of being an outside press.
   */
  const press = (origin?: PointerEvent): void => {
    if (untrack(context.open)) context.setOpen(false);
    else open(origin);
  };

  /** Typing on the closed trigger moves the value to the next matching item without opening. */
  const search = (key: string): void => {
    const seen = new Set<string>();
    const items = context.collection.getItems().filter((item) => {
      if (item.data.disabled || seen.has(item.data.value)) return false;
      seen.add(item.data.value);
      return true;
    });
    const current = items.findIndex((item) => item.data.value === untrack(context.value));
    const index = typeahead.handleKey(
      key,
      items.map((item) => ({ value: item.data.textValue })),
      current,
    );
    const match = index === undefined ? undefined : items[index];
    if (match !== undefined) context.setValue(match.data.value);
  };

  const merged = mergeElementProps(
    {
      get type() {
        return native() ? "button" : undefined;
      },
      role: "combobox",
      "aria-haspopup": "listbox",
      "aria-autocomplete": "none",
      get "aria-expanded"() {
        return context.open();
      },
      get "aria-controls"() {
        return context.open() ? context.contentId() : undefined;
      },
      get "aria-required"() {
        return context.required() ? true : undefined;
      },
      get "aria-disabled"() {
        return !native() && context.disabled() ? true : undefined;
      },
      get disabled() {
        return native() && context.disabled() ? true : undefined;
      },
      get tabindex() {
        return native() || context.disabled() ? undefined : 0;
      },
      get dir() {
        return context.dir();
      },
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      get "data-placeholder"() {
        return context.hasValue() ? undefined : "";
      },
      get id() {
        return context.triggerId();
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => {
        element = node;
        context.setTrigger(node);
      }),
      onClick: composeEventHandlers(
        () => own.onClick,
        () => {
          // Keeps focus on the trigger for label clicks and browsers that do not focus buttons on click.
          element?.focus();
          if (pointerType !== "mouse") press();
        },
      ),
      onPointerDown: composeEventHandlers(
        () => own.onPointerDown,
        (event: PointerEvent) => {
          pointerType = event.pointerType;
          const target = event.target;
          // Touch pointers capture the element they land on; release it so the drag can reach items.
          if (
            target instanceof Element &&
            typeof target.hasPointerCapture === "function" &&
            target.hasPointerCapture(event.pointerId)
          ) {
            target.releasePointerCapture(event.pointerId);
          }
          if (event.button === 0 && !event.ctrlKey && event.pointerType === "mouse") {
            press(event);
            // Keeps the trigger from taking focus back from the item focused by the opening listbox.
            event.preventDefault();
          }
        },
      ),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown,
        (event: KeyboardEvent) => {
          if (context.disabled()) return;
          const typing = typeahead.search() !== "";
          const modifier = event.ctrlKey || event.altKey || event.metaKey;
          if (!modifier) search(event.key);
          // While a search is running Space is part of it, not the "open" key.
          if (typing && event.key === " ") return;
          if (OPEN_KEYS.includes(event.key)) {
            open();
            event.preventDefault();
          }
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
