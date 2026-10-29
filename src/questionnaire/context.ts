import { type Accessor, batch, onCleanup, onMount, untrack, useSignal } from "@shadow-js/core";
import {
  createPartContext,
  type PartContext,
  type PartRegistration,
  useBaseId,
  useControllableState,
} from "../utils/index";
import {
  firstInvalid,
  type ItemFacts,
  isValid,
  neighbor,
  type Position,
  positionOf,
  type QuestionnaireItemStatus,
  type QuestionnaireShortcuts,
  statusOf,
} from "./logic";
import { inDocumentOrder } from "./order";

/** The words the questionnaire writes itself, so an application can replace them (or translate them). @since 1.0.0 */
export interface QuestionnaireMessages {
  /** The text of the progress, for example "Question 2 of 5". */
  readonly progress: (current: number, total: number) => string;
  /** The accessible name of the progress bar. */
  readonly progressLabel: string;
  /** The error of a required item that has no answer. */
  readonly required: string;
  /** The error of an optional item that has neither an answer nor a skip. */
  readonly optional: string;
}

/**
 * The English words of a questionnaire. Spread it to replace a few words and keep the rest; the root merges the `messages` prop over it.
 *
 * @example
 * import { DEFAULT_QUESTIONNAIRE_MESSAGES, type QuestionnaireMessages } from "@shadow-js/primitives";
 *
 * export const german: QuestionnaireMessages = {
 *   ...DEFAULT_QUESTIONNAIRE_MESSAGES,
 *   progress: (current, total) => `Frage ${current} von ${total}`,
 * };
 * @see {@link QuestionnaireMessages}
 * @since 1.0.0
 */
export const DEFAULT_QUESTIONNAIRE_MESSAGES: QuestionnaireMessages = {
  progress: (current, total) => `Question ${current} of ${total}`,
  progressLabel: "Questionnaire progress",
  required: "Answer this question to continue.",
  optional: "Answer this question, or skip it, to continue.",
};

/** What an item gives the root: its facts and its live state. @internal */
export interface ItemRecord {
  readonly name: () => string;
  readonly disabled: () => boolean;
  readonly required: () => boolean;
  readonly element: () => HTMLFieldSetElement | undefined;
  readonly status: () => QuestionnaireItemStatus;
  readonly markSkipped: () => void;
  readonly setFailed: (failed: boolean) => void;
  /** The shortcut key of each of its choices, in order. */
  readonly shortcutKeys: () => (string | undefined)[];
  /** The choice inputs, in order. */
  readonly choiceInputs: () => HTMLInputElement[];
  readonly reset: () => void;
}

/** What every questionnaire part reads from the root. @internal */
export interface QuestionnaireContextValue {
  readonly baseId: Accessor<string>;
  readonly messages: Accessor<QuestionnaireMessages>;
  readonly shortcuts: Accessor<QuestionnaireShortcuts | undefined>;
  readonly register: (record: ItemRecord) => () => void;
  /** The items in order (tracked: changes when one mounts, unmounts or changes). */
  readonly items: () => readonly ItemRecord[];
  readonly current: Accessor<string | undefined>;
  readonly position: Accessor<Position>;
  readonly activeRecord: () => ItemRecord | undefined;
  readonly goTo: (name: string, focus?: boolean) => void;
  readonly next: () => void;
  readonly previous: () => void;
  readonly skip: () => void;
  /** Validates the active item; shows its error and focuses its first answer when it is not valid. */
  readonly validateActive: () => boolean;
  /** Asks the form to submit (validation of every item happens in the submit handler). */
  readonly requestSubmit: () => void;
  readonly handleSubmit: (event: SubmitEvent) => boolean;
  readonly reset: () => void;
  readonly setForm: (element: HTMLFormElement | undefined) => void;
  /** The statuses of every item by name. */
  readonly statuses: () => Map<string, QuestionnaireItemStatus>;
}

/**
 * The context a `Questionnaire` root provides to its parts. Reading it anywhere else throws. Accessibility: it carries no ARIA of its own.
 *
 * @example
 * import { questionnaireContext } from "@shadow-js/primitives";
 *
 * export function Where() {
 *   const questionnaire = questionnaireContext.use("Where");
 *   return <span>{questionnaire.position().current}</span>;
 * }
 * @see {@link Questionnaire}
 * @since 1.0.0
 */
export const questionnaireContext: PartContext<QuestionnaireContextValue> =
  createPartContext<QuestionnaireContextValue>("Questionnaire");

/** What an item gives its own parts. @internal */
export interface ItemContextValue {
  readonly name: Accessor<string>;
  readonly titleId: Accessor<string>;
  readonly descriptionId: Accessor<string>;
  readonly errorId: Accessor<string>;
  readonly active: Accessor<boolean>;
  readonly invalid: Accessor<boolean>;
  readonly multiple: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly required: Accessor<boolean>;
  readonly status: Accessor<QuestionnaireItemStatus>;
  readonly error: Accessor<string>;
  readonly title: PartRegistration;
  readonly description: PartRegistration;
  readonly registerChoice: (record: ChoiceRecord) => () => void;
  readonly choiceIndex: (record: ChoiceRecord) => number;
  readonly shortcutOf: (record: ChoiceRecord) => string | undefined;
}

/** One choice, as it registers with its item. @internal */
export interface ChoiceRecord {
  readonly disabled: () => boolean;
  readonly input: () => HTMLInputElement | undefined;
}

/** The context an item provides to its title, description, choices, input and error. @internal */
export const itemContext: PartContext<ItemContextValue> =
  createPartContext<ItemContextValue>("Questionnaire.Item");

/** What the root's state reads from its props. @since 1.0.0 */
export interface QuestionnaireStateProps {
  readonly item?: string | undefined;
  readonly defaultItem?: string | undefined;
  readonly onItemChange?: ((item: string) => void) | undefined;
  readonly shortcuts?: QuestionnaireShortcuts | undefined;
  readonly messages?: Partial<QuestionnaireMessages> | undefined;
}

/**
 * Builds the state of a questionnaire: the items that registered, which one is showing, how far along the reader is, and the rules for moving on.
 * Call it once in the root's setup.
 *
 * @param props - The navigation and the words.
 * @returns The context value for the parts.
 * @example
 * import { createQuestionnaireContext } from "@shadow-js/primitives";
 *
 * export function Shell() {
 *   const questionnaire = createQuestionnaireContext({});
 *   return <span>{questionnaire.position().total}</span>;
 * }
 * @see {@link Questionnaire}
 * @since 1.0.0
 */
export function createQuestionnaireContext(
  props: QuestionnaireStateProps,
): QuestionnaireContextValue {
  const base = useBaseId();
  const [version, setVersion] = useSignal(0);
  const [selected, setSelected] = useControllableState<string | undefined>({
    value: () => props.item,
    defaultValue: () => props.defaultItem,
    onChange: () => props.onItemChange as ((value: string | undefined) => void) | undefined,
    name: "Questionnaire item",
  });
  let order: ItemRecord[] = [];
  // The same records in document order; dropped whenever the list or an element may have changed.
  let sorted: readonly ItemRecord[] | undefined;
  let form: HTMLFormElement | undefined;
  let initial: string | undefined;

  let bumping = false;
  const bump = (): void => {
    if (bumping) return;
    bumping = true;
    queueMicrotask(() => {
      bumping = false;
      // The elements of items registered meanwhile exist by now: place them where they sit on the page.
      sorted = undefined;
      setVersion((value) => value + 1);
    });
  };
  const items = (): readonly ItemRecord[] => {
    version();
    sorted ??= inDocumentOrder(order, (record) => untrack(record.element));
    return sorted;
  };
  const enabled = (): ItemRecord[] => items().filter((record) => !record.disabled());
  const current = (): string | undefined => {
    const chosen = selected();
    const known =
      chosen !== undefined &&
      items().some((record) => record.name() === chosen && !record.disabled());
    return known ? chosen : enabled()[0]?.name();
  };
  const facts = (): ItemFacts[] =>
    items().map((record) => ({
      name: record.name(),
      disabled: record.disabled(),
      required: record.required(),
    }));
  const position = (): Position => positionOf(facts(), current() ?? "");
  const activeRecord = (): ItemRecord | undefined =>
    items().find((record) => record.name() === current());
  const statuses = (): Map<string, QuestionnaireItemStatus> =>
    new Map(items().map((record) => [record.name(), record.status()] as const));

  const focusSoon = (focus: () => void): void => {
    queueMicrotask(focus);
  };
  const focusItem = (name: string): void =>
    focusSoon(() =>
      items()
        .find((record) => record.name() === name)
        ?.element()
        ?.focus({ preventScroll: false }),
    );
  const focusFirstAnswer = (name: string): void =>
    focusSoon(() => {
      const element = items()
        .find((record) => record.name() === name)
        ?.element();
      element?.querySelector<HTMLElement>("input:not([disabled])")?.focus();
    });

  const goTo = (name: string, focus = true): void => {
    batch(() => setSelected(name));
    if (focus) focusItem(name);
  };

  const validateActive = (): boolean => {
    const record = activeRecord();
    if (record === undefined) return true;
    const ok = isValid(
      { name: record.name(), disabled: record.disabled(), required: record.required() },
      record.status(),
    );
    record.setFailed(!ok);
    if (!ok) focusFirstAnswer(record.name());
    return ok;
  };

  const view: QuestionnaireContextValue = {
    baseId: base,
    messages: () => ({ ...DEFAULT_QUESTIONNAIRE_MESSAGES, ...props.messages }),
    shortcuts: () => props.shortcuts,
    // The list changes at once (the first render of the next item already sees this one); the tracked version follows in a microtask,
    // because a signal written while components render would make that render run twice.
    register: (record) => {
      order = [...order, record];
      sorted = undefined;
      bump();
      return () => {
        order = order.filter((entry) => entry !== record);
        sorted = undefined;
        bump();
      };
    },
    items,
    current,
    position,
    activeRecord,
    goTo,
    next: () => {
      if (!validateActive()) return;
      const name = current();
      if (name === undefined) return;
      const target = neighbor(facts(), name, 1);
      if (target !== name) goTo(target);
    },
    previous: () => {
      const name = current();
      if (name === undefined) return;
      const target = neighbor(facts(), name, -1);
      if (target !== name) goTo(target);
    },
    skip: () => {
      const record = activeRecord();
      if (record === undefined || record.required()) return;
      record.markSkipped();
      record.setFailed(false);
      const name = record.name();
      const target = neighbor(facts(), name, 1);
      if (target !== name) goTo(target);
    },
    validateActive,
    requestSubmit: () => {
      if (form?.requestSubmit !== undefined) form.requestSubmit();
    },
    handleSubmit: () => {
      const bad = firstInvalid(facts(), statuses());
      if (bad === undefined) return true;
      for (const record of items()) record.setFailed(record.name() === bad);
      goTo(bad, false);
      focusFirstAnswer(bad);
      return false;
    },
    reset: () => {
      for (const record of items()) record.reset();
      setSelected(initial);
      focusSoon(() => version());
    },
    setForm: (element) => {
      form = element;
    },
    statuses,
  };
  onMount(() => {
    initial = props.item ?? props.defaultItem ?? enabled()[0]?.name();
  });
  onCleanup(() => {
    order = [];
    sorted = undefined;
    form = undefined;
  });
  return view;
}

/** What an item's state needs from its props and its fieldset. @internal */
export function itemStatus(
  element: HTMLFieldSetElement | undefined,
  skipped: boolean,
): QuestionnaireItemStatus {
  if (element === undefined) return statusOf(false, skipped);
  let answered = false;
  for (const input of element.querySelectorAll("input")) {
    if (input.disabled) continue;
    if (
      input.type === "radio" || input.type === "checkbox"
        ? input.checked
        : input.value.trim() !== ""
    )
      answered = true;
  }
  return statusOf(answered, skipped);
}
