import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { questionnaireContext } from "./context";

/**
 * Props of {@link QuestionnaireProgress}: the attributes of the chosen element.
 *
 * Accessibility: `role="progressbar"` with `aria-valuemin` 1, `aria-valuemax` (how many questions), `aria-valuenow` (the number of the showing one) and
 * `aria-valuetext` ("Question 2 of 5"); named "Questionnaire progress" unless you pass `aria-label`. Data attributes: `data-current`, `data-total`, `data-first`, `data-last`.
 * With no children it writes "Question 2 of 5".
 * @see {@link QuestionnaireProgress}
 * @since 1.0.0
 */
export type QuestionnaireProgressProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Shows how far along the reader is. It is a named progress bar, so a screen reader hears the same "Question 2 of 5" a sighted reader sees. Give it children to draw
 * your own indicator, and read the numbers from the `data-current` and `data-total` attributes.
 *
 * Keyboard and ARIA: not focusable, no keys; a `progressbar` as described on {@link QuestionnaireProgressProps}.
 *
 * @param props See {@link QuestionnaireProgressProps}.
 * @returns The progress element.
 * @example
 * import { Questionnaire } from "@shadow-js/primitives";
 *
 * export const Where = (
 *   <Questionnaire>
 *     <Questionnaire.Progress />
 *   </Questionnaire>
 * );
 * @see {@link QuestionnaireRoot}
 * @since 1.0.0
 */
export function QuestionnaireProgress<T extends PolymorphicTarget = "div">(
  props: QuestionnaireProgressProps<T>,
): JsxChild {
  const questionnaire = questionnaireContext.use("Questionnaire.Progress");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "children"]);
  const text = (): string => {
    const { current, total } = questionnaire.position();
    return questionnaire.messages().progress(current, total);
  };
  const merged = mergeElementProps(
    {
      role: "progressbar",
      get "aria-label"() {
        return questionnaire.messages().progressLabel;
      },
      "aria-valuemin": 1,
      get "aria-valuemax"() {
        return Math.max(1, questionnaire.position().total);
      },
      get "aria-valuenow"() {
        return Math.max(1, questionnaire.position().current);
      },
      get "aria-valuetext"() {
        return text();
      },
      get "data-current"() {
        return questionnaire.position().current;
      },
      get "data-total"() {
        return questionnaire.position().total;
      },
      get "data-first"() {
        return questionnaire.position().first ? "" : undefined;
      },
      get "data-last"() {
        return questionnaire.position().last ? "" : undefined;
      },
    },
    rest,
  );
  return (
    <Polymorphic as={own.as ?? "div"} {...merged}>
      {() => (own["children"] === undefined ? text() : (own["children"] as JsxChild))}
    </Polymorphic>
  );
}
