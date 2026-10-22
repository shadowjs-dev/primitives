import { onCleanup, splitProps, useEffect, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { type ChoiceRecord, itemContext } from "./context";

/** What a choice gives its own parts. @internal */
interface ChoiceContextValue {
  readonly value: () => string;
  readonly disabled: () => boolean;
  readonly shortcut: () => string | undefined;
  readonly checked: () => boolean;
  readonly setInput: (element: HTMLInputElement | undefined) => void;
  readonly props: () => Record<string, unknown>;
}

import { createPartContext } from "../utils/index";

const choiceContext = createPartContext<ChoiceContextValue>("Questionnaire.Choice");

/**
 * Own props of {@link QuestionnaireChoice}. They describe the answer and are applied to its native input.
 * @see {@link QuestionnaireChoice}
 * @since 1.0.0
 */
export interface QuestionnaireChoiceOwnProps {
  /** The value submitted when this answer is picked. @default none (required) */
  readonly value: string;
  /** The answer is picked, for a controlled choice. Pair it with `onChange`. @default none */
  readonly checked?: boolean | undefined;
  /** The answer is picked at the start. @default false */
  readonly defaultChecked?: boolean | undefined;
  /** Disables the native control. A disabled choice gets no shortcut key. @default false */
  readonly disabled?: boolean | undefined;
  /** The native change handler of the input. @default none */
  readonly onChange?: ((event: Event) => void) | undefined;
}

/**
 * Props of {@link QuestionnaireChoice}: the own props and the attributes of the chosen element (a `label`).
 *
 * Accessibility: the label ties the whole row to its input, so a click anywhere on it picks the answer. Data attributes: `data-type` (`"radio"` or `"checkbox"`), `data-checked`,
 * `data-unchecked`, `data-disabled`, `data-invalid` and `data-shortcut` (the key, when the questionnaire has shortcuts).
 * @see {@link QuestionnaireChoice}
 * @since 1.0.0
 */
export type QuestionnaireChoiceProps<T extends PolymorphicTarget = "label"> = PolymorphicProps<
  "label",
  QuestionnaireChoiceOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * One fixed answer. It renders a `label` that holds a {@link QuestionnaireChoiceInput} (the native radio or checkbox), a {@link QuestionnaireChoiceLabel} (the text) and a
 * {@link QuestionnaireChoiceShortcut} (the key, when the questionnaire has shortcuts). The input is a radio, or a checkbox when the item is `multiple`.
 *
 * Keyboard and ARIA: native radio and checkbox behavior; Space picks it. The input has `aria-keyshortcuts` with its key, and `aria-invalid` while the item is invalid.
 *
 * @param props See {@link QuestionnaireChoiceProps}.
 * @returns The label.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Yes = (
 *   <Questionnaire.Choice value="yes">
 *     <Questionnaire.ChoiceInput />
 *     <Questionnaire.ChoiceLabel>Yes</Questionnaire.ChoiceLabel>
 *     <Questionnaire.ChoiceShortcut />
 *   </Questionnaire.Choice>
 * );
 * @see {@link QuestionnaireChoices}
 * @since 1.0.0
 */
export function QuestionnaireChoice<T extends PolymorphicTarget = "label">(
  props: QuestionnaireChoiceProps<T>,
): JsxChild {
  const item = itemContext.use("Questionnaire.Choice");
  const [own, rest] = splitProps(partProps<Loose & QuestionnaireChoiceOwnProps>(props), [
    "as",
    "value",
    "checked",
    "defaultChecked",
    "disabled",
    "onChange",
  ]);
  const [input, setInput] = useSignal<HTMLInputElement | undefined>(undefined);
  const [checked, setChecked] = useSignal(own.checked ?? own.defaultChecked ?? false);
  const record: ChoiceRecord = { disabled: () => own.disabled === true, input };
  const release = item.registerChoice(record);
  onCleanup(release);
  const type = (): "radio" | "checkbox" => (item.multiple() ? "checkbox" : "radio");
  const context: ChoiceContextValue = {
    value: () => own.value,
    disabled: () => own.disabled === true,
    shortcut: () => item.shortcutOf(record),
    checked: () => own.checked ?? checked(),
    // The picked state is written to the input once, here, and not as a property of the spread: the spread is applied again whenever
    // anything on the input changes (an error appears), and a `checked` property would then put back what the reader had undone.
    setInput: (element) => {
      if (element !== undefined) {
        const start = own.checked ?? own.defaultChecked ?? false;
        element.defaultChecked = own.defaultChecked === true;
        element.checked = start;
      }
      setInput(() => element);
    },
    props: () => ({
      onChange: (event: Event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) setChecked(target.checked);
        own.onChange?.(event);
      },
    }),
  };
  // A controlled choice follows its prop.
  useEffect(() => {
    const element = input();
    if (element !== undefined && own.checked !== undefined) {
      element.checked = own.checked;
      setChecked(own.checked);
    }
  });
  const merged = mergeElementProps(
    {
      get "data-type"() {
        return type();
      },
      get "data-checked"() {
        return context.checked() ? "" : undefined;
      },
      get "data-unchecked"() {
        return context.checked() ? undefined : "";
      },
      get "data-disabled"() {
        return own.disabled === true ? "" : undefined;
      },
      get "data-invalid"() {
        return item.invalid() ? "" : undefined;
      },
      get "data-shortcut"() {
        return context.shortcut();
      },
    },
    rest,
  );
  return (
    <choiceContext.Provider value={context}>
      <Polymorphic as={own.as ?? "label"} {...merged} />
    </choiceContext.Provider>
  );
}

/**
 * Props of {@link QuestionnaireChoiceInput}: the attributes of the native `input`.
 * @see {@link QuestionnaireChoiceInput}
 * @since 1.0.0
 */
export type QuestionnaireChoiceInputProps<T extends PolymorphicTarget = "input"> = PolymorphicProps<
  "input",
  object,
  T
>;

/**
 * The native radio or checkbox of a choice. Its `name` is the item's name and its `value` the choice's, so the answer is submitted as a plain form value. It is not
 * visually hidden here: style it, or hide it with a visually hidden class and draw your own mark from `data-checked`.
 *
 * Keyboard and ARIA: native; `aria-invalid` while the item is invalid and `aria-keyshortcuts` with the choice's key.
 *
 * @param props See {@link QuestionnaireChoiceInputProps}.
 * @returns The input.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Radio = <Questionnaire.ChoiceInput class="size-4" />;
 * @see {@link QuestionnaireChoice}
 * @since 1.0.0
 */
export function QuestionnaireChoiceInput<T extends PolymorphicTarget = "input">(
  props: QuestionnaireChoiceInputProps<T>,
): JsxChild {
  const item = itemContext.use("Questionnaire.ChoiceInput");
  const choice = choiceContext.use("Questionnaire.ChoiceInput");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const extra = choice.props();
  const merged = mergeElementProps(
    {
      get type() {
        return item.multiple() ? "checkbox" : "radio";
      },
      get name() {
        return item.name();
      },
      get value() {
        return choice.value();
      },
      get disabled() {
        return choice.disabled() ? true : undefined;
      },
      get "aria-invalid"() {
        return item.invalid() ? "true" : undefined;
      },
      get "aria-keyshortcuts"() {
        return choice.shortcut();
      },
      ref: (node: HTMLElement) => choice.setInput(node as HTMLInputElement),
    },
    rest,
    { onChange: extra["onChange"] as (event: Event) => void },
  );
  return <Polymorphic as={own.as ?? "input"} {...merged} />;
}

/**
 * Props of {@link QuestionnaireChoiceLabel}: the attributes of the chosen element (a `span`).
 * @see {@link QuestionnaireChoiceLabel}
 * @since 1.0.0
 */
export type QuestionnaireChoiceLabelProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

/**
 * The text of a choice, inside the choice's label, so it names the input.
 *
 * Keyboard and ARIA: no keys; it is part of the input's accessible name.
 *
 * @param props See {@link QuestionnaireChoiceLabelProps}.
 * @returns The text.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Text = <Questionnaire.ChoiceLabel>Red</Questionnaire.ChoiceLabel>;
 * @see {@link QuestionnaireChoice}
 * @since 1.0.0
 */
export function QuestionnaireChoiceLabel<T extends PolymorphicTarget = "span">(
  props: QuestionnaireChoiceLabelProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  return <Polymorphic as={own.as ?? "span"} {...rest} />;
}

/**
 * Props of {@link QuestionnaireChoiceShortcut}: the attributes of the chosen element (a `span`).
 * @see {@link QuestionnaireChoiceShortcut}
 * @since 1.0.0
 */
export type QuestionnaireChoiceShortcutProps<T extends PolymorphicTarget = "span"> =
  PolymorphicProps<"span", object, T>;

/**
 * Shows the key that picks the choice. It is hidden while the choice has no key (shortcuts are off, the choice is disabled, or the keys ran out), and
 * hidden from assistive technology, because the input carries the key in `aria-keyshortcuts`.
 *
 * Keyboard and ARIA: `aria-hidden="true"` while shown; no keys.
 *
 * @param props See {@link QuestionnaireChoiceShortcutProps}.
 * @returns The key, or nothing.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Key = <Questionnaire.ChoiceShortcut />;
 * @see {@link QuestionnaireChoice}
 * @since 1.0.0
 */
export function QuestionnaireChoiceShortcut<T extends PolymorphicTarget = "span">(
  props: QuestionnaireChoiceShortcutProps<T>,
): JsxChild {
  const choice = choiceContext.use("Questionnaire.ChoiceShortcut");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      "aria-hidden": "true",
      get hidden() {
        return choice.shortcut() === undefined ? true : undefined;
      },
      get "data-shortcut"() {
        return choice.shortcut();
      },
    },
    rest,
  );
  return (
    <Polymorphic as={own.as ?? "span"} {...merged}>
      {() => choice.shortcut() ?? ""}
    </Polymorphic>
  );
}

/**
 * Own props of {@link QuestionnaireInput}.
 * @see {@link QuestionnaireInput}
 * @since 1.0.0
 */
export interface QuestionnaireInputOwnProps {
  /** The kind of text entry: `"text"`, `"email"`, `"number"`, `"date"` and the like. @default "text" */
  readonly type?: string | undefined;
}

/**
 * Props of {@link QuestionnaireInput}: the own props and the attributes of the native `input`.
 *
 * Accessibility: it needs an accessible name: a visible label whose `for` is its `id`, `aria-label` or `aria-labelledby`. A placeholder is not a name. Data attributes: `data-filled`,
 * `data-empty`, `data-disabled`, `data-invalid`.
 * @see {@link QuestionnaireInput}
 * @since 1.0.0
 */
export type QuestionnaireInputProps<T extends PolymorphicTarget = "input"> = PolymorphicProps<
  "input",
  QuestionnaireInputOwnProps,
  T
>;

/**
 * A free-text answer. Its `name` is the item's name, so the text is submitted under the same field as the choices. In a single-choice item, typing here clears the picked
 * choice and picking a choice clears the text.
 *
 * Keyboard and ARIA: a native text field; shortcuts and arrow navigation pause while it has focus. `aria-invalid` while the item is invalid.
 *
 * @param props See {@link QuestionnaireInputProps}.
 * @returns The input.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Other = <Questionnaire.Input aria-label="Another answer" placeholder="Type another answer" />;
 * @see {@link QuestionnaireChoices}
 * @since 1.0.0
 */
export function QuestionnaireInput<T extends PolymorphicTarget = "input">(
  props: QuestionnaireInputProps<T>,
): JsxChild {
  const item = itemContext.use("Questionnaire.Input");
  const [own, rest] = splitProps(partProps<Loose & QuestionnaireInputOwnProps>(props), [
    "as",
    "type",
    "onInput",
  ]);
  const [filled, setFilled] = useSignal(false);
  const merged = mergeElementProps(
    {
      get type() {
        return own.type ?? "text";
      },
      // Only a filled input has a name, so an empty one adds no blank answer beside the picked choice.
      get name() {
        return filled() ? item.name() : undefined;
      },
      ref: (node: HTMLElement) => setFilled((node as HTMLInputElement).value.trim() !== ""),
      get "aria-invalid"() {
        return item.invalid() ? "true" : undefined;
      },
      get "data-filled"() {
        return filled() ? "" : undefined;
      },
      get "data-empty"() {
        return filled() ? undefined : "";
      },
      get "data-invalid"() {
        return item.invalid() ? "" : undefined;
      },
    },
    rest,
    {
      onInput: (event: Event) => {
        (own.onInput as ((event: Event) => void) | undefined)?.(event);
        const target = event.target;
        if (target instanceof HTMLInputElement) setFilled(target.value.trim() !== "");
      },
    },
  );
  return <Polymorphic as={own.as ?? "input"} {...merged} />;
}
