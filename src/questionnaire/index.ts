import {
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSkip,
  QuestionnaireSubmit,
} from "./actions";
import {
  QuestionnaireChoice,
  QuestionnaireChoiceInput,
  QuestionnaireChoiceLabel,
  QuestionnaireChoiceShortcut,
  QuestionnaireInput,
} from "./choice";
import {
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "./item";
import { QuestionnaireProgress } from "./progress";
import { QuestionnaireRoot } from "./root";

export type {
  QuestionnaireNextProps,
  QuestionnairePreviousProps,
  QuestionnaireSkipProps,
  QuestionnaireSubmitProps,
} from "./actions";
export type {
  QuestionnaireChoiceInputProps,
  QuestionnaireChoiceLabelProps,
  QuestionnaireChoiceOwnProps,
  QuestionnaireChoiceProps,
  QuestionnaireChoiceShortcutProps,
  QuestionnaireInputOwnProps,
  QuestionnaireInputProps,
} from "./choice";
export type {
  ChoiceRecord,
  ItemContextValue,
  QuestionnaireContextValue,
  QuestionnaireMessages,
  QuestionnaireStateProps,
} from "./context";
export {
  createQuestionnaireContext,
  DEFAULT_QUESTIONNAIRE_MESSAGES,
  questionnaireContext,
} from "./context";
export type {
  QuestionnaireChoicesProps,
  QuestionnaireDescriptionProps,
  QuestionnaireErrorProps,
  QuestionnaireItemOwnProps,
  QuestionnaireItemProps,
  QuestionnaireTitleProps,
} from "./item";
export type { ItemFacts, Position, QuestionnaireItemStatus, QuestionnaireShortcuts } from "./logic";
export {
  choiceForKey,
  enabledItems,
  firstInvalid,
  isValid,
  neighbor,
  positionOf,
  shortcutKeys,
  statusOf,
} from "./logic";
export type { QuestionnaireProgressProps } from "./progress";
export type {
  QuestionnaireChoiceDefinition,
  QuestionnaireItemDefinition,
  QuestionnaireOwnProps,
  QuestionnaireProps,
} from "./root";
export {
  QuestionnaireChoice,
  QuestionnaireChoiceInput,
  QuestionnaireChoiceLabel,
  QuestionnaireChoiceShortcut,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireRoot,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
};

/**
 * The questionnaire primitive: a multi-step form of single-choice, multiple-choice, free-text and skippable questions, one showing at a time. Parts:
 * `Questionnaire` (a `form`), `.Progress`, `.Item` (a `fieldset`), `.Title` (its `legend`), `.Description`, `.Choices`, `.Choice` with `.ChoiceInput`, `.ChoiceLabel` and
 * `.ChoiceShortcut`, `.Input`, `.Error`, and the buttons `.Previous`, `.Skip`, `.Next` and `.Submit`. Each part is also exported by name. It owns the showing question, the status of each,
 * validation, progress and navigation; the page around it owns saving, sending and closing. Answers are native form values. Keyboard: see {@link QuestionnaireRoot}. ARIA: fieldsets with legends,
 * a named progress bar, `aria-invalid`, `aria-describedby` and `aria-keyshortcuts`.
 *
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export function Survey() {
 *   return (
 *     <Questionnaire>
 *       <Questionnaire.Progress />
 *       <Questionnaire.Item name="role">
 *         <Questionnaire.Title>What is your role?</Questionnaire.Title>
 *         <Questionnaire.Input aria-label="Your role" />
 *         <Questionnaire.Error />
 *       </Questionnaire.Item>
 *       <Questionnaire.Skip>Skip</Questionnaire.Skip>
 *       <Questionnaire.Submit>Send</Questionnaire.Submit>
 *     </Questionnaire>
 *   );
 * }
 * @since 1.0.0
 * @see {@link QuestionnaireRoot}
 */
export const Questionnaire: typeof QuestionnaireRoot & {
  readonly Progress: typeof QuestionnaireProgress;
  readonly Item: typeof QuestionnaireItem;
  readonly Title: typeof QuestionnaireTitle;
  readonly Description: typeof QuestionnaireDescription;
  readonly Choices: typeof QuestionnaireChoices;
  readonly Choice: typeof QuestionnaireChoice;
  readonly ChoiceInput: typeof QuestionnaireChoiceInput;
  readonly ChoiceLabel: typeof QuestionnaireChoiceLabel;
  readonly ChoiceShortcut: typeof QuestionnaireChoiceShortcut;
  readonly Input: typeof QuestionnaireInput;
  readonly Error: typeof QuestionnaireError;
  readonly Previous: typeof QuestionnairePrevious;
  readonly Skip: typeof QuestionnaireSkip;
  readonly Next: typeof QuestionnaireNext;
  readonly Submit: typeof QuestionnaireSubmit;
} = Object.assign(QuestionnaireRoot, {
  Progress: QuestionnaireProgress,
  Item: QuestionnaireItem,
  Title: QuestionnaireTitle,
  Description: QuestionnaireDescription,
  Choices: QuestionnaireChoices,
  Choice: QuestionnaireChoice,
  ChoiceInput: QuestionnaireChoiceInput,
  ChoiceLabel: QuestionnaireChoiceLabel,
  ChoiceShortcut: QuestionnaireChoiceShortcut,
  Input: QuestionnaireInput,
  Error: QuestionnaireError,
  Previous: QuestionnairePrevious,
  Skip: QuestionnaireSkip,
  Next: QuestionnaireNext,
  Submit: QuestionnaireSubmit,
});
