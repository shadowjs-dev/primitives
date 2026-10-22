import { onCleanup, splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { otpIndex, pasteOtp } from "../internal/otp-filter";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { oneTimePasswordContext } from "./context";
import { deleteBackward, deleteForward } from "./logic";

/**
 * Own props of {@link OneTimePasswordFieldInput}, on top of the attributes of the `input` element.
 *
 * Accessibility: the slot is a text `input` with `inputmode` (`"numeric"` or `"text"`) and an
 * `aria-label` ("Digit n of N" or "Character n of N") unless it passes its own. Data attributes:
 * `data-index` (the slot's position, from `0`).
 * @since 1.0.0
 * @see {@link OneTimePasswordFieldInput}
 */
export interface OneTimePasswordFieldInputOwnProps {
  /**
   * The slot's integer position from `0` to `length - 1`, fixed when it mounts. Each mounted
   * slot must have a unique index. Render every position for a complete, focusable code field.
   * @default none (required)
   */
  readonly index: number;
}

/**
 * Props of {@link OneTimePasswordFieldInput}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link OneTimePasswordFieldInputOwnProps}
 */
export type OneTimePasswordFieldInputProps<T extends PolymorphicTarget = "input"> =
  PolymorphicProps<"input", OneTimePasswordFieldInputOwnProps, T>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * One slot of a {@link OneTimePasswordFieldRoot}: an `input` showing the character at its `index`.
 * Keys: a printable character the root's `type` or `filter` accepts fills the slot and moves on; Backspace clears the
 * slot or, from an empty slot, the one before it; Delete clears the slot; ArrowLeft and ArrowRight
 * (swapped in `rtl`) move to the neighboring slot, Home and End to the first and last. Paste, the
 * input event (OS autofill, mobile keyboards) and the keys all go through the root's value. The slot
 * is named `Digit n of N` (or `Character n of N` for alphanumeric or custom-filter codes) unless the application
 * passes its own `aria-label`. Must be rendered inside {@link OneTimePasswordFieldRoot}.
 *
 * @param props See {@link OneTimePasswordFieldInputProps}.
 * @returns The `input` element.
 * @throws Error when rendered outside {@link OneTimePasswordFieldRoot}.
 * @throws RangeError for an invalid or duplicate mounted index.
 * @example
 * import { OneTimePasswordField } from "@shadow-js/primitives";
 *
 * export function FourDigitCode() {
 *   return (
 *     <OneTimePasswordField length={4} aria-label="PIN">
 *       <OneTimePasswordField.Input index={0} />
 *       <OneTimePasswordField.Input index={1} />
 *       <OneTimePasswordField.Input index={2} />
 *       <OneTimePasswordField.Input index={3} />
 *     </OneTimePasswordField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link OneTimePasswordFieldInputOwnProps}
 */
export function OneTimePasswordFieldInput<T extends PolymorphicTarget = "input">(
  props: OneTimePasswordFieldInputProps<T>,
): JsxChild {
  const context = oneTimePasswordContext.use("OneTimePasswordField.Input");
  const [own, rest] = splitProps(partProps<Loose & OneTimePasswordFieldInputOwnProps>(props), [
    "as",
    "index",
    "onKeyDown",
    "onPaste",
    "onInput",
  ]);
  const slot = own.index as number;
  otpIndex(slot, context.length);
  let element: HTMLInputElement | undefined;
  onCleanup(() => {
    context.unregister(slot, element);
    element = undefined;
  });
  const char = (): string => context.value()[slot] ?? "";

  // Applies an edit from the value and moves focus to where the edit says.
  const apply = (value: string, focus: number): void => {
    context.commit(value);
    context.focusSlot(focus);
  };

  const merged = mergeElementProps(
    {
      type: "text",
      get inputmode() {
        return context.type === "numeric" && !context.hasFilter() ? "numeric" : "text";
      },
      get autocomplete() {
        return slot === 0 ? context.autoComplete : undefined;
      },
      get "aria-label"() {
        const kind = context.type === "numeric" && !context.hasFilter() ? "Digit" : "Character";
        return `${kind} ${slot + 1} of ${context.length}`;
      },
      get value() {
        return char();
      },
      get disabled() {
        return context.disabled() ? true : undefined;
      },
      get "data-index"() {
        return slot;
      },
      autocapitalize: "off",
      spellcheck: false,
      ref: (node: HTMLInputElement) => {
        context.unregister(slot, element);
        element = node;
        context.register(slot, node);
      },
    },
    rest,
    {
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event: KeyboardEvent) => {
          if (context.disabled()) return;
          const current = context.value();
          const length = context.length;
          const forward = context.dir() === "rtl" ? -1 : 1;
          switch (event.key) {
            case "Backspace": {
              event.preventDefault();
              const edit = deleteBackward(current, slot);
              apply(edit.value, edit.focus);
              return;
            }
            case "Delete": {
              event.preventDefault();
              const edit = deleteForward(current, slot);
              apply(edit.value, edit.focus);
              return;
            }
            case "ArrowLeft":
              event.preventDefault();
              context.focusSlot(slot - forward);
              return;
            case "ArrowRight":
              event.preventDefault();
              context.focusSlot(slot + forward);
              return;
            case "Home":
              event.preventDefault();
              context.focusSlot(0);
              return;
            case "End":
              event.preventDefault();
              context.focusSlot(length - 1);
              return;
            default:
              break;
          }
          // A printable key is always handled here so the browser never edits the slot itself.
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            const char = context.sanitize(event.key);
            if (char.length !== 1) return;
            const edit = pasteOtp(current, length, slot, char);
            apply(edit.value, edit.focus);
          }
        },
      ),
      onPaste: composeEventHandlers(
        () => own.onPaste as ((event: ClipboardEvent) => void) | undefined,
        (event: ClipboardEvent) => {
          event.preventDefault();
          if (context.disabled()) return;
          const text = event.clipboardData?.getData("text") ?? "";
          const edit = pasteOtp(context.value(), context.length, slot, context.sanitize(text));
          apply(edit.value, edit.focus);
        },
      ),
      // Mobile keyboards and OS autofill insert text without key events. The slot shows its own
      // character, so what the input now holds beyond it is the text that was entered.
      onInput: composeEventHandlers(
        () => own.onInput as ((event: Event) => void) | undefined,
        () => {
          const node = element;
          if (node === undefined) return;
          const current = char();
          const raw = node.value;
          node.value = current;
          const typed = current !== "" && raw.startsWith(current) ? raw.slice(current.length) : raw;
          if (typed === "" || context.disabled()) return;
          const edit = pasteOtp(context.value(), context.length, slot, context.sanitize(typed));
          apply(edit.value, edit.focus);
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "input"} {...merged} />;
}
