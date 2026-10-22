import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useDirection,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  createQuestionnaireContext,
  type QuestionnaireMessages,
  questionnaireContext,
} from "./context";
import type { QuestionnaireShortcuts } from "./logic";

/**
 * One item of the `items` prop: the data a server render and the shortcut keys need before the items have mounted.
 * @since 1.0.0
 */
export interface QuestionnaireChoiceDefinition {
  /** The submitted value. */
  readonly value: string;
  /** Disabled choices get no shortcut key. */
  readonly disabled?: boolean | undefined;
}

/**
 * An item, as data: its name, whether it is required or disabled, and its fixed choices.
 * @since 1.0.0
 */
export interface QuestionnaireItemDefinition {
  readonly name: string;
  readonly required?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly choices?: readonly QuestionnaireChoiceDefinition[] | undefined;
}

/**
 * Own props of {@link QuestionnaireRoot}.
 *
 * Accessibility: the root is a native `form`. Data attributes: `data-current` (the 1-based number of the item showing), `data-total`, `data-first`, `data-last` (present
 * on the first or last item) and `data-shortcuts` (`"letters"` or `"numbers"` when enabled). Answers are submitted as native form values: read them with `FormData`.
 * @see {@link QuestionnaireRoot}
 * @since 1.0.0
 */
export interface QuestionnaireOwnProps {
  /** The name of the item that is showing, for a controlled questionnaire. Pair it with `onItemChange`. @default none */
  readonly item?: string | undefined;
  /** The item that shows first. @default the first enabled item */
  readonly defaultItem?: string | undefined;
  /** Called when a button or a key asks to show another item. @default none */
  readonly onItemChange?: ((item: string) => void) | undefined;
  /** The items as data, for server rendering and the order of the items. The parts still render the markup. @default none */
  readonly items?: readonly QuestionnaireItemDefinition[] | undefined;
  /** Keys that pick answers: `"letters"` gives each choice of the showing item A to Z, `"numbers"` gives 1 to 9. @default none */
  readonly shortcuts?: QuestionnaireShortcuts | undefined;
  /** Suppresses the browser's own validation bubbles: the `Error` part shows the message instead. @default true */
  readonly noValidate?: boolean | undefined;
  /** Replaces the words the questionnaire writes itself (the progress text, the progress name, the two error messages). @default English */
  readonly messages?: Partial<QuestionnaireMessages> | undefined;
  /** Runs after every enabled item is valid. Call `preventDefault()` to submit in script instead of natively. @default none */
  readonly onSubmit?: ((event: SubmitEvent) => void) | undefined;
  /** Runs on a native reset. Call `preventDefault()` to stop the questionnaire from resetting its state. @default none */
  readonly onReset?: ((event: Event) => void) | undefined;
  /** The reading direction, which decides what the arrow keys mean. @default the surrounding direction */
  readonly dir?: "ltr" | "rtl" | undefined;
}

/**
 * Props of {@link QuestionnaireRoot}: the own props and the attributes of the chosen element (a `form`).
 * @see {@link QuestionnaireRoot}
 * @since 1.0.0
 */
export type QuestionnaireProps<T extends PolymorphicTarget = "form"> = PolymorphicProps<
  "form",
  QuestionnaireOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN = [
  "as",
  "item",
  "defaultItem",
  "onItemChange",
  "items",
  "shortcuts",
  "noValidate",
  "messages",
  "onSubmit",
  "onReset",
  "onKeyDown",
  "dir",
] as const;

/** Whether a key press happens in a field the reader is typing in. */
function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement)
    return target.type !== "radio" && target.type !== "checkbox" && target.type !== "button";
  return target.isContentEditable;
}

/**
 * A multi-step form of questions, one showing at a time, for single choice, multiple choice, free text and skippable questions. It owns which question
 * is showing, the answers' status, validation, progress and the move from one to the next. The page, card, dialog or drawer around it handles
 * closing, saving and sending. Answers are native form values.
 *
 * Keyboard: Tab and Shift+Tab move between answers and the visible buttons. ArrowUp and ArrowDown move between answers. ArrowLeft and ArrowRight move between questions when
 * focus is not in a radio or a text field (they follow the reading direction; going forward needs the question answered or skipped). Space picks a radio, toggles a checkbox or
 * presses a button. Enter continues from a picked choice or filled text, or presses a button. Cmd or Ctrl with Enter validates and continues, or submits on the last question. With
 * `shortcuts`, a letter or number picks an answer without advancing. Shortcuts and the arrows pause while typing. Calling `preventDefault()` on the root's `onKeyDown` turns the
 * questionnaire's own key handling off.
 *
 * ARIA: each question is a `fieldset` with a `legend`; invalid questions and their controls have `aria-invalid`; descriptions and errors are linked with `aria-describedby`; shortcuts and
 * navigation are exposed with `aria-keyshortcuts`. Questions that are not showing, and buttons that are not available, are `hidden` and `inert`. After moving to another question focus moves to
 * it; after a failed check focus moves to an answer.
 *
 * @param props See {@link QuestionnaireProps}.
 * @returns The form.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export function Survey(props: { readonly onDone: (answers: FormData) => void }) {
 *   return (
 *     <Questionnaire onSubmit={(event) => props.onDone(new FormData(event.currentTarget as HTMLFormElement))}>
 *       <Questionnaire.Progress />
 *       <Questionnaire.Item name="color" required>
 *         <Questionnaire.Title>Pick a color</Questionnaire.Title>
 *         <Questionnaire.Choices>
 *           <Questionnaire.Choice value="red">
 *             <Questionnaire.ChoiceInput />
 *             <Questionnaire.ChoiceLabel>Red</Questionnaire.ChoiceLabel>
 *           </Questionnaire.Choice>
 *         </Questionnaire.Choices>
 *         <Questionnaire.Error />
 *       </Questionnaire.Item>
 *       <Questionnaire.Submit>Send</Questionnaire.Submit>
 *     </Questionnaire>
 *   );
 * }
 * @see {@link QuestionnaireProps}
 * @since 1.0.0
 */
export function QuestionnaireRoot<T extends PolymorphicTarget = "form">(
  props: QuestionnaireProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & QuestionnaireOwnProps>(props), OWN);
  const context = createQuestionnaireContext(own);
  const dir = useDirection(() => own.dir);
  const merged = mergeElementProps(
    {
      noValidate: true,
      get dir() {
        return own.dir;
      },
      get "data-current"() {
        return context.position().current;
      },
      get "data-total"() {
        return own.items === undefined
          ? context.position().total
          : context.position().total || own.items.filter((item) => item.disabled !== true).length;
      },
      get "data-first"() {
        return context.position().first ? "" : undefined;
      },
      get "data-last"() {
        return context.position().last ? "" : undefined;
      },
      get "data-shortcuts"() {
        return own.shortcuts;
      },
      ref: (element: HTMLElement) => {
        context.setForm(element as HTMLFormElement);
      },
      onSubmit: (event: SubmitEvent) => {
        if (!context.handleSubmit(event)) {
          event.preventDefault();
          return;
        }
        own.onSubmit?.(event);
      },
      onReset: (event: Event) => {
        own.onReset?.(event);
        if (!event.defaultPrevented) context.reset();
      },
    },
    rest,
    {
      onKeyDown: (event: KeyboardEvent) => {
        (own.onKeyDown as ((event: KeyboardEvent) => void) | undefined)?.(event);
        if (event.defaultPrevented) return;
        handleKey(context, event, dir());
      },
    },
  );
  return (
    <questionnaireContext.Provider value={context}>
      <Polymorphic as={own.as ?? "form"} {...merged} noValidate={own.noValidate !== false} />
    </questionnaireContext.Provider>
  );
}

/** The questionnaire's own key handling. */
function handleKey(
  context: ReturnType<typeof createQuestionnaireContext>,
  event: KeyboardEvent,
  dir: "ltr" | "rtl",
): void {
  if (event.isComposing) return;
  const meta = event.metaKey || event.ctrlKey;
  const target = event.target;
  if (event.key === "Enter") {
    if (target instanceof HTMLButtonElement) return;
    if (!meta && !(target instanceof HTMLInputElement)) return;
    if (target instanceof HTMLInputElement && target.type === "button") return;
    event.preventDefault();
    if (context.position().last) {
      if (context.validateActive()) context.requestSubmit();
    } else context.next();
    return;
  }
  if (meta || event.altKey) return;
  const radioOrText = target instanceof HTMLInputElement && target.type !== "checkbox";
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    if (radioOrText || typing(target)) return;
    const forward = (event.key === "ArrowRight") === (dir === "ltr");
    event.preventDefault();
    if (forward) context.next();
    else context.previous();
    return;
  }
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
    const inputs = context.activeRecord()?.choiceInputs() ?? [];
    const at = inputs.indexOf(target);
    const step = event.key === "ArrowDown" ? 1 : -1;
    const next = inputs.filter((input) => !input.disabled)[
      (inputs.filter((input) => !input.disabled).indexOf(target) + step + inputs.length) %
        Math.max(1, inputs.filter((input) => !input.disabled).length)
    ];
    if (at === -1 || next === undefined) return;
    event.preventDefault();
    next.focus();
    return;
  }
  const kind = context.shortcuts();
  if (kind === undefined || typing(target) || event.key.length !== 1) return;
  const record = context.activeRecord();
  if (record === undefined) return;
  const keys = record.shortcutKeys();
  const index = keys.indexOf(event.key.toUpperCase());
  const input = record.choiceInputs()[index];
  if (index === -1 || input === undefined || input.disabled) return;
  event.preventDefault();
  input.click();
  input.focus();
}
