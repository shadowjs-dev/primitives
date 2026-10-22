import { onCleanup, onMount, splitProps, useEffect, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  partId,
  useBaseId,
  usePartRegistration,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  type ChoiceRecord,
  type ItemContextValue,
  type ItemRecord,
  itemContext,
  itemStatus,
  questionnaireContext,
} from "./context";
import { isValid, type QuestionnaireItemStatus, shortcutKeys } from "./logic";

/**
 * Own props of {@link QuestionnaireItem}.
 * @see {@link QuestionnaireItem}
 * @since 1.0.0
 */
export interface QuestionnaireItemOwnProps {
  /** The item's name, unique in the questionnaire. It is the name of the form field its answers are submitted under. @default none (required) */
  readonly name: string;
  /** Marks the item invalid from your own validator (a schema, a server answer). The item then shows its error. @default false */
  readonly invalid?: boolean | undefined;
  /** Requires an answer and removes the Skip button for this item. @default false */
  readonly required?: boolean | undefined;
  /** Renders the fixed choices as checkboxes, so more than one can be picked. Read the answers with `FormData.getAll(name)`. @default false */
  readonly multiple?: boolean | undefined;
  /** Removes the item from the progress, the navigation, the validation and the submission. @default false */
  readonly disabled?: boolean | undefined;
  /** Called when the item becomes unanswered, answered or skipped. @default none */
  readonly onStatusChange?: ((status: QuestionnaireItemStatus) => void) | undefined;
}

/**
 * Props of {@link QuestionnaireItem}: the own props and the attributes of the chosen element (a `fieldset`).
 *
 * Accessibility: a native `fieldset` named by its {@link QuestionnaireTitle} (`aria-labelledby`) and described by its description and, while it is invalid,
 * its error (`aria-describedby`). Invalid: `aria-invalid="true"`. When it is not the showing item it is `hidden` and `inert`. Data attributes: `data-active`, `data-status`
 * (`"unanswered"`, `"answered"` or `"skipped"`), `data-required`, `data-multiple`, `data-disabled` and `data-invalid`.
 * @see {@link QuestionnaireItem}
 * @since 1.0.0
 */
export type QuestionnaireItemProps<T extends PolymorphicTarget = "fieldset"> = PolymorphicProps<
  "fieldset",
  QuestionnaireItemOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** Empties a text answer and says so, so the parts that follow its value (its name, its `data-filled`) update. */
function clearText(input: HTMLInputElement): void {
  if (input.value === "") return;
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

const OWN = [
  "as",
  "name",
  "invalid",
  "required",
  "multiple",
  "disabled",
  "onStatusChange",
  "onChange",
  "onInput",
  "children",
] as const;

/**
 * One question. It holds the title, the description, the answers and the error, and it keeps the status of the question: unanswered, answered, or skipped on
 * purpose. Only the showing question is visible. In a single-choice question, typing in a free-text answer clears the picked choice, and picking a choice clears the text.
 *
 * Keyboard and ARIA: see {@link QuestionnaireItemProps}; the keys are the root's.
 *
 * @param props See {@link QuestionnaireItemProps}.
 * @returns The fieldset.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Question = (
 *   <Questionnaire.Item name="size" required>
 *     <Questionnaire.Title>Pick a size</Questionnaire.Title>
 *   </Questionnaire.Item>
 * );
 * @see {@link QuestionnaireRoot}
 * @since 1.0.0
 */
export function QuestionnaireItem<T extends PolymorphicTarget = "fieldset">(
  props: QuestionnaireItemProps<T>,
): JsxChild {
  const questionnaire = questionnaireContext.use("Questionnaire.Item");
  const [own, rest] = splitProps(partProps<Loose & QuestionnaireItemOwnProps>(props), OWN);
  const base = useBaseId();
  const [element, setElement] = useSignal<HTMLFieldSetElement | undefined>(undefined);
  const [skipped, setSkipped] = useSignal(false);
  const [failed, setFailed] = useSignal(false);
  const [status, setStatus] = useSignal<QuestionnaireItemStatus>("unanswered");
  const [choiceVersion, setChoiceVersion] = useSignal(0);
  const title = usePartRegistration();
  const description = usePartRegistration();
  let choices: ChoiceRecord[] = [];
  let bumping = false;

  const recompute = (): void => {
    const next = itemStatus(element(), skipped());
    setStatus(next === "answered" ? "answered" : next);
    if (next === "answered" && skipped()) setSkipped(false);
    if (
      failed() &&
      isValid(
        { name: own.name, disabled: own.disabled === true, required: own.required === true },
        next,
      )
    )
      setFailed(false);
  };
  const choiceList = (): ChoiceRecord[] => {
    choiceVersion();
    return choices;
  };
  const bumpChoices = (): void => {
    if (bumping) return;
    bumping = true;
    queueMicrotask(() => {
      bumping = false;
      setChoiceVersion((value) => value + 1);
    });
  };
  const keys = (): (string | undefined)[] => {
    const kind = questionnaire.shortcuts();
    return kind === undefined
      ? []
      : shortcutKeys(
          kind,
          choiceList().map((choice) => choice.disabled()),
        );
  };

  const record: ItemRecord = {
    name: () => own.name,
    disabled: () => own.disabled === true,
    required: () => own.required === true,
    element,
    status,
    markSkipped: () => {
      for (const input of element()?.querySelectorAll("input") ?? []) {
        if (input.type === "radio" || input.type === "checkbox") input.checked = false;
        else clearText(input);
      }
      setSkipped(true);
      setStatus("skipped");
    },
    setFailed: (value) => setFailed(value),
    shortcutKeys: keys,
    choiceInputs: () => choiceList().flatMap((choice) => choice.input() ?? []),
    reset: () => {
      setSkipped(false);
      setFailed(false);
      queueMicrotask(recompute);
    },
  };
  const unregister = questionnaire.register(record);
  onCleanup(unregister);
  onMount(recompute);
  let first = true;
  useEffect(() => {
    const current = status();
    if (first) {
      first = false;
      return;
    }
    own.onStatusChange?.(current);
  });

  const active = (): boolean => questionnaire.current() === own.name;
  const invalid = (): boolean => own.invalid === true || failed();
  const errorText = (): string =>
    own.required === true ? questionnaire.messages().required : questionnaire.messages().optional;
  const context: ItemContextValue = {
    name: () => own.name,
    titleId: () => partId(base(), "title"),
    descriptionId: () => partId(base(), "description"),
    errorId: () => partId(base(), "error"),
    active,
    invalid,
    multiple: () => own.multiple === true,
    disabled: () => own.disabled === true,
    required: () => own.required === true,
    status,
    error: errorText,
    title,
    description,
    registerChoice: (choice) => {
      choices = [...choices, choice];
      bumpChoices();
      return () => {
        choices = choices.filter((entry) => entry !== choice);
        bumpChoices();
      };
    },
    choiceIndex: (choice) => choiceList().indexOf(choice),
    shortcutOf: (choice) => keys()[choiceList().indexOf(choice)],
  };

  const merged = mergeElementProps(
    {
      get tabindex() {
        return -1;
      },
      get hidden() {
        return active() ? undefined : true;
      },
      get inert() {
        return active() ? undefined : true;
      },
      get disabled() {
        return own.disabled === true ? true : undefined;
      },
      get "aria-labelledby"() {
        return title.present() ? context.titleId() : undefined;
      },
      get "aria-describedby"() {
        const ids = [
          description.present() ? context.descriptionId() : undefined,
          invalid() ? context.errorId() : undefined,
        ].filter((id) => id !== undefined);
        return ids.length === 0 ? undefined : ids.join(" ");
      },
      get "aria-invalid"() {
        return invalid() ? "true" : undefined;
      },
      get "data-active"() {
        return active() ? "" : undefined;
      },
      get "data-status"() {
        return status();
      },
      get "data-required"() {
        return own.required === true ? "" : undefined;
      },
      get "data-multiple"() {
        return own.multiple === true ? "" : undefined;
      },
      get "data-disabled"() {
        return own.disabled === true ? "" : undefined;
      },
      get "data-invalid"() {
        return invalid() ? "" : undefined;
      },
      ref: (node: HTMLElement) => setElement(() => node as HTMLFieldSetElement),
    },
    rest,
    {
      onInput: (event: Event) => {
        (own.onInput as ((event: Event) => void) | undefined)?.(event);
        const target = event.target;
        // Text in a single-choice question replaces the picked choice.
        if (
          own.multiple !== true &&
          target instanceof HTMLInputElement &&
          target.type !== "radio" &&
          target.type !== "checkbox" &&
          target.value.trim() !== ""
        ) {
          for (const input of element()?.querySelectorAll<HTMLInputElement>(
            'input[type="radio"]',
          ) ?? [])
            input.checked = false;
        }
        recompute();
      },
      onChange: (event: Event) => {
        (own.onChange as ((event: Event) => void) | undefined)?.(event);
        const target = event.target;
        // A picked choice in a single-choice question replaces the text.
        if (
          own.multiple !== true &&
          target instanceof HTMLInputElement &&
          target.type === "radio"
        ) {
          for (const input of element()?.querySelectorAll<HTMLInputElement>(
            "input:not([type=radio]):not([type=checkbox])",
          ) ?? [])
            clearText(input);
        }
        recompute();
      },
    },
  );
  return (
    <itemContext.Provider value={context}>
      <Polymorphic as={own.as ?? "fieldset"} {...merged}>
        {own["children"] as JsxChild}
      </Polymorphic>
    </itemContext.Provider>
  );
}

/**
 * Props of {@link QuestionnaireTitle}: the attributes of the chosen element (a `legend`). If you change the element, give it an `id` and pass it to the item's `aria-labelledby`.
 * @see {@link QuestionnaireTitle}
 * @since 1.0.0
 */
export type QuestionnaireTitleProps<T extends PolymorphicTarget = "legend"> = PolymorphicProps<
  "legend",
  object,
  T
>;

/**
 * The question itself: the `legend` of the item's fieldset, which names the group of answers for assistive technology. Keep it a complete sentence.
 *
 * Keyboard and ARIA: no keys; it provides the item's accessible name.
 *
 * @param props See {@link QuestionnaireTitleProps}.
 * @returns The legend.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Title = <Questionnaire.Title>What should we build next?</Questionnaire.Title>;
 * @see {@link QuestionnaireItem}
 * @since 1.0.0
 */
export function QuestionnaireTitle<T extends PolymorphicTarget = "legend">(
  props: QuestionnaireTitleProps<T>,
): JsxChild {
  const item = itemContext.use("Questionnaire.Title");
  item.title.register();
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get id() {
        return item.titleId();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "legend"} {...merged} />;
}

/**
 * Props of {@link QuestionnaireDescription}: the attributes of the chosen element (a `p`).
 * @see {@link QuestionnaireDescription}
 * @since 1.0.0
 */
export type QuestionnaireDescriptionProps<T extends PolymorphicTarget = "p"> = PolymorphicProps<
  "p",
  object,
  T
>;

/**
 * Helper text under the question. It is linked to the item with `aria-describedby`, so a screen reader reads it with the question.
 *
 * Keyboard and ARIA: no keys.
 *
 * @param props See {@link QuestionnaireDescriptionProps}.
 * @returns The description.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Help = <Questionnaire.Description>Choose one.</Questionnaire.Description>;
 * @see {@link QuestionnaireItem}
 * @since 1.0.0
 */
export function QuestionnaireDescription<T extends PolymorphicTarget = "p">(
  props: QuestionnaireDescriptionProps<T>,
): JsxChild {
  const item = itemContext.use("Questionnaire.Description");
  item.description.register();
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get id() {
        return item.descriptionId();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "p"} {...merged} />;
}

/**
 * Props of {@link QuestionnaireChoices}: the attributes of the chosen element (a `div`). Data attribute: `data-shortcuts` (`"letters"` or `"numbers"` when the questionnaire has them).
 * @see {@link QuestionnaireChoices}
 * @since 1.0.0
 */
export type QuestionnaireChoicesProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Holds the answers of a question: the fixed choices and an optional free-text input.
 *
 * Keyboard and ARIA: no role and no keys of its own.
 *
 * @param props See {@link QuestionnaireChoicesProps}.
 * @returns The container.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Choices = <Questionnaire.Choices />;
 * @see {@link QuestionnaireChoice}
 * @since 1.0.0
 */
export function QuestionnaireChoices<T extends PolymorphicTarget = "div">(
  props: QuestionnaireChoicesProps<T>,
): JsxChild {
  const questionnaire = questionnaireContext.use("Questionnaire.Choices");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get "data-shortcuts"() {
        return questionnaire.shortcuts();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * Props of {@link QuestionnaireError}: the attributes of the chosen element (a `p`). With no children it writes the message for the item.
 * @see {@link QuestionnaireError}
 * @since 1.0.0
 */
export type QuestionnaireErrorProps<T extends PolymorphicTarget = "p"> = PolymorphicProps<
  "p",
  object,
  T
>;

/**
 * The message shown when the question is not answered. It is hidden until the item is invalid, has `role="alert"` so it is announced when it appears, and is linked to the
 * item with `aria-describedby` while it shows.
 *
 * Keyboard and ARIA: no keys; `role="alert"`. Data attribute: `data-invalid`.
 *
 * @param props See {@link QuestionnaireErrorProps}.
 * @returns The message, or nothing while the item is valid.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Problem = <Questionnaire.Error />;
 * @see {@link QuestionnaireItem}
 * @since 1.0.0
 */
export function QuestionnaireError<T extends PolymorphicTarget = "p">(
  props: QuestionnaireErrorProps<T>,
): JsxChild {
  const item = itemContext.use("Questionnaire.Error");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "children"]);
  const merged = mergeElementProps(
    {
      role: "alert",
      get id() {
        return item.errorId();
      },
      get hidden() {
        return item.invalid() ? undefined : true;
      },
      get "data-invalid"() {
        return item.invalid() ? "" : undefined;
      },
    },
    rest,
  );
  return (
    <Polymorphic as={own.as ?? "p"} {...merged}>
      {() =>
        item.invalid()
          ? own["children"] === undefined
            ? item.error()
            : (own["children"] as JsxChild)
          : null
      }
    </Polymorphic>
  );
}
