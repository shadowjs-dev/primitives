import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { questionnaireContext } from "./context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

type ActionProps<T extends PolymorphicTarget> = PolymorphicProps<"button", object, T>;

/**
 * Props of {@link QuestionnairePrevious}: the attributes of the native `button`. It shows when the showing question is not the first. Data attributes: `data-visible`, `data-hidden`,
 * `data-status` (the showing question's status). It stays mounted, and is `hidden` and `inert` while it does not apply.
 * @see {@link QuestionnairePrevious}
 * @since 1.0.0
 */
export type QuestionnairePreviousProps<T extends PolymorphicTarget = "button"> = ActionProps<T>;

/**
 * Props of {@link QuestionnaireSkip}: the attributes of the native `button`. It shows while the showing question is optional. Data attributes as on {@link QuestionnairePreviousProps}.
 * @see {@link QuestionnaireSkip}
 * @since 1.0.0
 */
export type QuestionnaireSkipProps<T extends PolymorphicTarget = "button"> = ActionProps<T>;

/**
 * Props of {@link QuestionnaireNext}: the attributes of the native `button`. It shows when the showing question is not the last; `data-shortcut="Enter"` and `aria-keyshortcuts="Enter"` while it does.
 * @see {@link QuestionnaireNext}
 * @since 1.0.0
 */
export type QuestionnaireNextProps<T extends PolymorphicTarget = "button"> = ActionProps<T>;

/**
 * Props of {@link QuestionnaireSubmit}: the attributes of the native `button` (`type="submit"`). It shows on the last question.
 * @see {@link QuestionnaireSubmit}
 * @since 1.0.0
 */
export type QuestionnaireSubmitProps<T extends PolymorphicTarget = "button"> = ActionProps<T>;

type Kind = "previous" | "skip" | "next" | "submit";

/** Shared by the four buttons: when each shows, and what a press does. */
function action<T extends PolymorphicTarget>(
  kind: Kind,
  part: string,
  props: ActionProps<T>,
): JsxChild {
  const questionnaire = questionnaireContext.use(part);
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const visible = (): boolean => {
    const position = questionnaire.position();
    if (kind === "previous") return !position.first;
    if (kind === "next") return !position.last;
    if (kind === "submit") return position.last;
    return questionnaire.activeRecord()?.required() === false;
  };
  const merged = mergeElementProps(
    {
      type: kind === "submit" ? "submit" : "button",
      get hidden() {
        return visible() ? undefined : true;
      },
      get inert() {
        return visible() ? undefined : true;
      },
      get "data-visible"() {
        return visible() ? "" : undefined;
      },
      get "data-hidden"() {
        return visible() ? undefined : "";
      },
      get "data-status"() {
        return questionnaire.activeRecord()?.status();
      },
      get "data-shortcut"() {
        return (kind === "next" || kind === "submit") && visible() ? "Enter" : undefined;
      },
      get "aria-keyshortcuts"() {
        return (kind === "next" || kind === "submit") && visible() ? "Enter" : undefined;
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          if (kind === "previous") questionnaire.previous();
          else if (kind === "next") questionnaire.next();
          else if (kind === "skip") questionnaire.skip();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * Goes back one question. It does not check the answer, so the reader can go back from anywhere.
 *
 * Keyboard and ARIA: a native button (Enter and Space); ArrowLeft (ArrowRight in right-to-left text) does the same from outside a field.
 *
 * @param props See {@link QuestionnairePreviousProps}.
 * @returns The button.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Back = <Questionnaire.Previous>Back</Questionnaire.Previous>;
 * @see {@link QuestionnaireRoot}
 * @since 1.0.0
 */
export function QuestionnairePrevious<T extends PolymorphicTarget = "button">(
  props: QuestionnairePreviousProps<T>,
): JsxChild {
  return action("previous", "Questionnaire.Previous", props);
}

/**
 * Skips an optional question on purpose: it clears its answers, marks it skipped, and moves on. A skipped question is absent from the submitted data; use the
 * item's `onStatusChange` to tell a skip from a missing answer. Required questions have no Skip button.
 *
 * Keyboard and ARIA: a native button (Enter and Space).
 *
 * @param props See {@link QuestionnaireSkipProps}.
 * @returns The button.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Pass = <Questionnaire.Skip>Skip</Questionnaire.Skip>;
 * @see {@link QuestionnaireRoot}
 * @since 1.0.0
 */
export function QuestionnaireSkip<T extends PolymorphicTarget = "button">(
  props: QuestionnaireSkipProps<T>,
): JsxChild {
  return action("skip", "Questionnaire.Skip", props);
}

/**
 * Checks the showing question and moves to the next. When the question is not valid it stays, shows its error and moves focus to an answer. It stays enabled so a press can
 * reveal the error; disable it yourself when you need to.
 *
 * Keyboard and ARIA: a native button; Enter on a picked choice or filled text does the same.
 *
 * @param props See {@link QuestionnaireNextProps}.
 * @returns The button.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Forward = <Questionnaire.Next>Next</Questionnaire.Next>;
 * @see {@link QuestionnaireRoot}
 * @since 1.0.0
 */
export function QuestionnaireNext<T extends PolymorphicTarget = "button">(
  props: QuestionnaireNextProps<T>,
): JsxChild {
  return action("next", "Questionnaire.Next", props);
}

/**
 * Submits the form from the last question. The root checks every enabled question first: if one is not valid it is shown and nothing is sent.
 *
 * Keyboard and ARIA: a native submit button; Cmd or Ctrl with Enter submits from the last question.
 *
 * @param props See {@link QuestionnaireSubmitProps}.
 * @returns The button.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Send = <Questionnaire.Submit>Send</Questionnaire.Submit>;
 * @see {@link QuestionnaireRoot}
 * @since 1.0.0
 */
export function QuestionnaireSubmit<T extends PolymorphicTarget = "button">(
  props: QuestionnaireSubmitProps<T>,
): JsxChild {
  return action("submit", "Questionnaire.Submit", props);
}
