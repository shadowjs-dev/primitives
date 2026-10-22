import { onCleanup, onMount, splitProps } from "@shadow-js/core";
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
import { createRepeater } from "./repeater";

/**
 * Props of {@link NumberFieldIncrement}: the attributes of the `button`.
 * @since 1.0.0
 * @see {@link NumberFieldIncrement}
 */
export type NumberFieldIncrementProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/**
 * Props of {@link NumberFieldDecrement}: the attributes of the `button`.
 * @since 1.0.0
 * @see {@link NumberFieldDecrement}
 */
export type NumberFieldDecrementProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** Shared body of the two buttons. */
function Stepper(props: Loose, direction: 1 | -1, name: string): JsxChild {
  const context = numberFieldContext.use(name);
  const [own, rest] = splitProps(props, [
    "as",
    "onPointerDown",
    "onPointerUp",
    "onClick",
    "onMouseDown",
  ]);
  const enabled = (): boolean =>
    direction === 1 ? context.canIncrement() : context.canDecrement();
  const repeater = createRepeater(() => context.step(direction, "normal"));
  let element: HTMLElement | undefined;

  // The repeat ends with the disposal of the button, and when the pointer leaves or is canceled
  // (those two are not delegated events, so they are added and removed here).
  onCleanup(repeater.stop);
  onMount(() => {
    const node = element;
    if (node === undefined) return;
    node.addEventListener("pointerleave", repeater.stop);
    node.addEventListener("pointercancel", repeater.stop);
    onCleanup(() => {
      node.removeEventListener("pointerleave", repeater.stop);
      node.removeEventListener("pointercancel", repeater.stop);
    });
  });

  const merged = mergeElementProps(
    {
      type: "button",
      tabindex: -1,
      // A name by default (a stepper is only its glyph otherwise); the application's aria-label wins.
      get "aria-label"() {
        return direction === 1 ? context.labels().increment : context.labels().decrement;
      },
      get "aria-controls"() {
        return context.inputId();
      },
      get disabled() {
        return enabled() ? undefined : true;
      },
      get "data-disabled"() {
        return enabled() ? undefined : "";
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => {
        element = node;
      }),
      // The button must not take focus (the input keeps it and its caret).
      onMouseDown: composeEventHandlers(
        () => own.onMouseDown,
        (event: MouseEvent) => event.preventDefault(),
      ),
      onPointerDown: composeEventHandlers(
        () => own.onPointerDown,
        (event: PointerEvent) => {
          if (event.button !== 0 || !enabled()) return;
          event.preventDefault();
          context.focusInput();
          repeater.start();
        },
      ),
      onPointerUp: composeEventHandlers(
        () => own.onPointerUp,
        () => repeater.stop(),
        false,
      ),
      // A pointer press already stepped on pointerdown; only a click that did not come from a
      // pointer (keyboard Enter or Space, assistive technology, `.click()`) steps here.
      onClick: composeEventHandlers(
        () => own.onClick,
        (event: MouseEvent) => {
          if (event.detail === 0 && enabled()) context.step(direction, "normal");
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * Button that increases the value by `step`; holding it repeats (first repeat after 400 ms, then
 * every 60 ms). It is not a tab stop (the input is the spinbutton; ArrowUp does the same job there),
 * points `aria-controls` at the input and is disabled at the maximum, and also while the field is
 * disabled or read-only (`data-disabled` marks it then). It is named "Increment" unless it has an
 * `aria-label` (or the root's `messages` names it). A mouse press keeps focus in the input.
 *
 * @param props See {@link NumberFieldIncrementProps}.
 * @returns The `button` element.
 * @throws Error when rendered outside {@link NumberFieldRoot}.
 * @example
 * import { NumberField } from "@shadow-js/primitives";
 *
 * export function QuantityWithButtons() {
 *   return (
 *     <NumberField defaultValue={1} min={1} max={10}>
 *       <NumberField.Decrement aria-label="Decrease quantity">-</NumberField.Decrement>
 *       <NumberField.Input aria-label="Quantity" />
 *       <NumberField.Increment aria-label="Increase quantity">+</NumberField.Increment>
 *     </NumberField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NumberFieldDecrement}
 */
export function NumberFieldIncrement<T extends PolymorphicTarget = "button">(
  props: NumberFieldIncrementProps<T>,
): JsxChild {
  return Stepper(partProps<Loose>(props), 1, "NumberField.Increment");
}

/**
 * Button that decreases the value by `step`; holding it repeats. Same behavior as
 * {@link NumberFieldIncrement}, disabled at the minimum (and while the field is disabled or
 * read-only).
 *
 * @param props See {@link NumberFieldDecrementProps}.
 * @returns The `button` element.
 * @throws Error when rendered outside {@link NumberFieldRoot}.
 * @example
 * import { NumberField } from "@shadow-js/primitives";
 *
 * export function DecreaseOnly() {
 *   return (
 *     <NumberField defaultValue={5} min={0}>
 *       <NumberField.Decrement aria-label="Decrease quantity">-</NumberField.Decrement>
 *       <NumberField.Input aria-label="Quantity" />
 *     </NumberField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NumberFieldIncrement}
 */
export function NumberFieldDecrement<T extends PolymorphicTarget = "button">(
  props: NumberFieldDecrementProps<T>,
): JsxChild {
  return Stepper(partProps<Loose>(props), -1, "NumberField.Decrement");
}
