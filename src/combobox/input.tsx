import { onCleanup, onMount, splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  callHandler,
  composeEventHandlers,
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { comboboxContext } from "./context";

/**
 * Props of {@link ComboboxInput}: the attributes of an `input`.
 *
 * Accessibility: the input is `role="combobox"` with `aria-autocomplete="list"`, `aria-haspopup="listbox"`,
 * `aria-expanded`, `aria-controls` (only while open), `aria-activedescendant` (only while an option is
 * highlighted) and `aria-required` when `required`. Data attributes: `data-state` is `"open"` or
 * `"closed"`, and `data-disabled` is present (empty value) while disabled.
 * @since 1.0.0
 * @see {@link ComboboxInput}
 */
export type ComboboxInputProps<T extends PolymorphicTarget = "input"> = PolymorphicProps<
  "input",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The text field of the combobox, the element that keeps DOM focus. Renders an `input` with
 * `role="combobox"`, `aria-expanded`, `aria-controls` (the listbox id, only while open),
 * `aria-autocomplete="list"`, `aria-haspopup="listbox"` and `aria-activedescendant` (the id of
 * the highlighted option, absent when there is none).
 *
 * Keyboard (WAI-ARIA Authoring Practices): typing opens the list and filters it; ArrowDown opens
 * and highlights the first option, or moves to the next; ArrowUp opens and highlights the last,
 * or moves to the previous; Alt+ArrowDown opens without moving; Alt+ArrowUp closes the list; Home
 * and End jump to the first and last option while the list is open and one is highlighted
 * (otherwise they move the caret); Enter selects the highlighted option (and never submits a
 * surrounding form while the list is open); Escape closes the list, and a second Escape clears the
 * field (and the selection of a single combobox); Tab commits nothing and closes. With `multiple`,
 * Backspace in an empty input removes the last chip, and ArrowLeft (ArrowRight in RTL) with the caret
 * at the start of the text moves focus to the last chip. Nothing is selected, filtered or submitted
 * while an IME composition is in progress.
 *
 * @param props See {@link ComboboxInputProps}.
 * @returns The rendered `input` element.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function Search() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input placeholder="Search..." />
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxRoot}
 */
export function ComboboxInput<T extends PolymorphicTarget = "input">(
  props: ComboboxInputProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Input");
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "onKeyDown",
    "onInput",
    "onFocus",
    "onBlur",
    "onCompositionStart",
    "onCompositionEnd",
  ]);
  let composing = false;

  const isComposing = (event: Event): boolean =>
    composing ||
    (event as KeyboardEvent).isComposing === true ||
    (event as KeyboardEvent).keyCode === 229;

  const field = (): HTMLInputElement | undefined => {
    const element = untrack(context.input);
    return element instanceof HTMLInputElement ? element : undefined;
  };

  /** Takes the text the user produced in the field, reports it and opens the list. */
  const takeText = (): void => {
    const element = field();
    if (element === undefined) return;
    const text = element.value;
    if (text !== untrack(context.inputValue)) {
      context.setInputValue(text, "input");
      // The previous highlight belongs to the previous query.
      context.highlight(undefined, "keyboard");
      // Emptying the field of a single combobox is how a selection is cleared by hand.
      if (text === "" && !context.multiple() && untrack(context.selected).length > 0) {
        context.clearAll();
      }
    }
    context.setOpen(true);
    // A controlled application may refuse the change: the field must show what the state says.
    const current = untrack(context.inputValue);
    if (element.value !== current) element.value = current;
  };

  const focusChip = (which: "first" | "last"): boolean => {
    const items = context.chips.getItems();
    const target = which === "first" ? items[0] : items[items.length - 1];
    if (target === undefined) return false;
    target.element.focus();
    return true;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (isComposing(event)) return;
    const open = untrack(context.open);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (event.altKey) context.setOpen(true);
        else if (open) context.move("next");
        else context.openAndHighlight("first");
        return;
      case "ArrowUp":
        event.preventDefault();
        if (event.altKey) context.setOpen(false);
        else if (open) context.move("previous");
        else context.openAndHighlight("last");
        return;
      case "Enter": {
        if (open) {
          // An open list never submits the form: Enter belongs to the list.
          event.preventDefault();
          const value = untrack(context.highlighted);
          if (value !== undefined) context.activate(value);
          else if (context.allowCustomValue()) context.commitCustomValue();
          return;
        }
        if (context.allowCustomValue()) {
          const text = untrack(context.inputValue).trim();
          const committed = untrack(context.selected);
          if (text !== "" && (context.multiple() || committed[0] !== text)) {
            event.preventDefault();
            context.commitCustomValue();
          }
        }
        return;
      }
      case "Home":
      case "End": {
        if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
        // Once an option is highlighted the keys belong to the list; before that they edit the text.
        if (!open || untrack(context.highlighted) === undefined) return;
        event.preventDefault();
        context.move(event.key === "Home" ? "first" : "last");
        return;
      }
      case "Escape": {
        // An inline list has no layer to hear Escape: it goes to the content's handler.
        if (context.inline()) {
          callHandler(context.escapeHandler.current, event);
          return;
        }
        // While the list is open the dismissable layer has already closed it and prevented the
        // default, so this handler never ran; this branch covers a list without a layer yet.
        if (open) {
          event.preventDefault();
          context.setOpen(false);
          return;
        }
        const hasText = untrack(context.inputValue) !== "";
        const hasValue = untrack(context.selected).length > 0 && !context.multiple();
        if (!hasText && !hasValue) return;
        // Nothing to close: the second Escape clears the field (a surrounding dialog's layer sees it first).
        event.preventDefault();
        if (context.multiple()) context.setInputValue("", "escape");
        else {
          context.clearAll();
        }
        return;
      }
      case "Backspace": {
        const element = field();
        const values = untrack(context.selected);
        if (context.multiple() && element?.value === "" && values.length > 0) {
          const last = values[values.length - 1];
          if (last !== undefined) context.removeValue(last);
        }
        return;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        if (
          !context.multiple() ||
          event.shiftKey ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        ) {
          return;
        }
        const element = field();
        const towardChips = (context.dir() === "rtl") === (event.key === "ArrowRight");
        if (
          towardChips &&
          element?.selectionStart === 0 &&
          element.selectionEnd === 0 &&
          focusChip("last")
        ) {
          event.preventDefault();
        }
        return;
      }
      default:
    }
  };

  // Focus, blur and composition events do not bubble, so the runtime binds them natively and
  // never unbinds them when the part is disposed. Bind them here so cleanup is guaranteed.
  onMount(() => {
    const element = untrack(context.input);
    if (element === undefined) return;
    const bind = (type: string, handler: (event: never) => void): void => {
      element.addEventListener(type, handler as EventListener);
      onCleanup(() => element.removeEventListener(type, handler as EventListener));
    };
    bind(
      "compositionstart",
      composeEventHandlers(
        () => own.onCompositionStart,
        () => {
          composing = true;
        },
      ),
    );
    bind(
      "compositionend",
      composeEventHandlers(
        () => own.onCompositionEnd,
        () => {
          composing = false;
          takeText();
        },
      ),
    );
    bind(
      "focus",
      composeEventHandlers(
        () => own.onFocus,
        () => {
          if (context.openOnFocus() && context.focusMayOpen()) context.setOpen(true);
        },
      ),
    );
    bind(
      "blur",
      composeEventHandlers(
        () => own.onBlur,
        (event: FocusEvent) => {
          // The window lost focus: the field keeps it for when the user comes back.
          if (element.ownerDocument.activeElement === element) return;
          const next = event.relatedTarget;
          if (next instanceof Node) {
            const inside = [
              untrack(context.content),
              untrack(context.trigger),
              untrack(context.clear),
            ];
            if (inside.some((part) => part?.contains(next) === true)) return;
          }
          context.dismiss();
        },
      ),
    );
  });

  const merged = mergeElementProps(
    {
      type: "text",
      role: "combobox",
      autocomplete: "off",
      "aria-autocomplete": "list",
      "aria-haspopup": "listbox",
      get id() {
        return context.inputId();
      },
      get "aria-expanded"() {
        return context.open();
      },
      get "aria-controls"() {
        return context.open() ? context.contentId() : undefined;
      },
      get "aria-activedescendant"() {
        return context.highlightedId();
      },
      get "aria-required"() {
        return context.required() ? true : undefined;
      },
      get disabled() {
        return context.disabled() ? true : undefined;
      },
      get dir() {
        return context.dirProp();
      },
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      // The attribute for the server and hydration, the property for the live value.
      get value() {
        return context.inputValue();
      },
      get "prop:value"() {
        return context.inputValue();
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((element) => context.setInput(element)),
      onKeyDown: composeEventHandlers(() => own.onKeyDown, onKeyDown),
      onInput: composeEventHandlers(
        () => own.onInput,
        (event: Event) => {
          if (!isComposing(event)) takeText();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "input"} {...merged} />;
}
