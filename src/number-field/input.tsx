import { onCleanup, onMount, splitProps, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { numberFieldContext } from "./context";

/**
 * Props of {@link NumberFieldInput}: the attributes of the `input`. The value, bounds and steps come
 * from the root.
 * @since 1.0.0
 * @see {@link NumberFieldInput}
 */
export type NumberFieldInputProps<T extends PolymorphicTarget = "input"> = PolymorphicProps<
  "input",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The text input of a number field: a `role="spinbutton"` with `aria-valuenow` (absent when
 * empty), `aria-valuemin`, `aria-valuemax` and `aria-valuetext` (the formatted value), plus
 * `aria-readonly` and `aria-invalid` when they apply.
 *
 * Keys: ArrowUp and ArrowDown change the value by `step`, with Shift (or PageUp and PageDown) by
 * `largeStep`, with Alt by `smallStep`; Home and End jump to `min` and `max` when they are defined;
 * Enter commits the typed text. Typing never reformats under the caret: the text is parsed and
 * formatted on blur and Enter. Input method composition is left alone until it ends. Data attributes:
 * `data-disabled` (value `""`) while the field is disabled, and `data-readonly` (value `""`) while it
 * is read-only.
 *
 * @param props See {@link NumberFieldInputProps}.
 * @returns The `input` element.
 * @throws Error when rendered outside {@link NumberFieldRoot}.
 * @example
 * import { NumberField } from "@shadow-js/primitives";
 *
 * export function QuantityField() {
 *   return (
 *     <NumberField defaultValue={1} min={1} max={99}>
 *       <NumberField.Input aria-label="Quantity" class="input" />
 *     </NumberField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NumberFieldRoot}
 */
export function NumberFieldInput<T extends PolymorphicTarget = "input">(
  props: NumberFieldInputProps<T>,
): JsxChild {
  const context = numberFieldContext.use("NumberField.Input");
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "onInput",
    "onKeyDown",
    "onFocusOut",
  ]);
  let composing = false;
  let element: HTMLInputElement | undefined;

  // The buttons point aria-controls at this id, so an `id` of the application has to reach the root.
  useEffect(() => context.setInputId(rest["id"] as string | undefined));

  // composition and wheel are not events the framework delegates, and native listeners it binds are
  // not removed with the element, so they are added and removed here.
  onMount(() => {
    const node = element;
    if (node === undefined) return;
    const start = (): void => {
      composing = true;
    };
    const end = (): void => {
      composing = false;
      context.setDraft(node.value);
    };
    const wheel = (event: WheelEvent): void => {
      if (!context.allowMouseWheel() || !context.isInputFocused() || event.deltaY === 0) return;
      event.preventDefault();
      context.step(event.deltaY < 0 ? 1 : -1, "normal");
    };
    node.addEventListener("compositionstart", start);
    node.addEventListener("compositionend", end);
    node.addEventListener("wheel", wheel, { passive: false });
    onCleanup(() => {
      node.removeEventListener("compositionstart", start);
      node.removeEventListener("compositionend", end);
      node.removeEventListener("wheel", wheel);
    });
  });

  const merged = mergeElementProps(
    {
      type: "text",
      role: "spinbutton",
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: "false",
      get id() {
        return context.inputId();
      },
      get inputmode() {
        return context.inputMode();
      },
      get "aria-valuenow"() {
        return context.value() ?? undefined;
      },
      get "aria-valuemin"() {
        return context.min();
      },
      get "aria-valuemax"() {
        return context.max();
      },
      get "aria-valuetext"() {
        const current = context.value();
        return current === null ? undefined : context.formatValue(current);
      },
      get "aria-readonly"() {
        return context.readOnly() ? true : undefined;
      },
      get "aria-invalid"() {
        // Only possible with clampValueOnBlur={false} or a value the application set.
        const current = context.value();
        const low = context.min();
        const high = context.max();
        if (current === null) return undefined;
        return (low !== undefined && current < low) || (high !== undefined && current > high)
          ? true
          : undefined;
      },
      get required() {
        return context.required() ? true : undefined;
      },
      get disabled() {
        return context.disabled() ? true : undefined;
      },
      get readonly() {
        return context.readOnly() ? true : undefined;
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      get "data-readonly"() {
        return context.readOnly() ? "" : undefined;
      },
      // The attribute is the server value and the initial one; the property follows what the user
      // sees, because an input whose text was edited ignores later changes of its attribute.
      get value() {
        return context.display();
      },
      get "prop:value"() {
        return context.display();
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => {
        element = node as HTMLInputElement;
        context.setInput(element);
      }),
      onInput: composeEventHandlers(
        () => own.onInput,
        (event: Event) => {
          if (composing || !(event.target instanceof HTMLInputElement)) return;
          context.setDraft(event.target.value);
        },
      ),
      onFocusOut: composeEventHandlers(
        () => own.onFocusOut,
        () => context.commit(),
      ),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown,
        (event: KeyboardEvent) => {
          // Keys that belong to the input method (229 is the legacy "processing" code).
          if (event.isComposing || event.keyCode === 229) return;
          if (event.ctrlKey || event.metaKey) return;
          const size = event.shiftKey ? "large" : event.altKey ? "small" : "normal";
          switch (event.key) {
            case "ArrowUp":
            case "ArrowDown":
              event.preventDefault();
              context.step(event.key === "ArrowUp" ? 1 : -1, size);
              return;
            case "PageUp":
            case "PageDown":
              event.preventDefault();
              context.step(event.key === "PageUp" ? 1 : -1, "large");
              return;
            case "Home":
            case "End":
              // Without a bound the key keeps its job of moving the caret.
              if (context.jump(event.key === "Home" ? "min" : "max")) event.preventDefault();
              return;
            case "Enter":
              // Not canceled: Enter still submits the form, now with the committed value.
              context.commit();
              return;
          }
        },
      ),
    },
  );

  return <Polymorphic as={own.as ?? "input"} {...merged} />;
}
