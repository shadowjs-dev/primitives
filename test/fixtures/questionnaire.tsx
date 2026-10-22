import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Questionnaire, type QuestionnaireOwnProps } from "../../src/index";

interface DemoProps extends Omit<QuestionnaireOwnProps, "items"> {
  onStatus?: (name: string, status: string) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

/** Three questions: a required single choice with a free-text answer, an optional multiple choice, and a required text. A fourth is disabled. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <Questionnaire
      data-testid="form"
      item={props.item}
      defaultItem={props.defaultItem}
      onItemChange={props.onItemChange}
      shortcuts={props.shortcuts}
      noValidate={props.noValidate}
      messages={props.messages}
      onSubmit={props.onSubmit}
      onReset={props.onReset}
      onKeyDown={props.onKeyDown}
      dir={props.dir}
    >
      <Questionnaire.Progress data-testid="progress" />
      <Questionnaire.Item name="direction" required onStatusChange={(status: string) => props.onStatus?.("direction", status)} data-testid="direction">
        <Questionnaire.Title data-testid="direction-title">What next?</Questionnaire.Title>
        <Questionnaire.Description data-testid="direction-description">Choose one.</Questionnaire.Description>
        <Questionnaire.Choices data-testid="direction-choices">
          <Questionnaire.Choice value="a" data-testid="choice-a">
            <Questionnaire.ChoiceInput data-testid="input-a" />
            <Questionnaire.ChoiceLabel>Alpha</Questionnaire.ChoiceLabel>
            <Questionnaire.ChoiceShortcut data-testid="key-a" />
          </Questionnaire.Choice>
          <Questionnaire.Choice value="b" disabled data-testid="choice-b">
            <Questionnaire.ChoiceInput data-testid="input-b" />
            <Questionnaire.ChoiceLabel>Beta</Questionnaire.ChoiceLabel>
            <Questionnaire.ChoiceShortcut data-testid="key-b" />
          </Questionnaire.Choice>
          <Questionnaire.Choice value="c" data-testid="choice-c">
            <Questionnaire.ChoiceInput data-testid="input-c" />
            <Questionnaire.ChoiceLabel>Gamma</Questionnaire.ChoiceLabel>
            <Questionnaire.ChoiceShortcut data-testid="key-c" />
          </Questionnaire.Choice>
          <Questionnaire.Input aria-label="Another answer" data-testid="other" />
        </Questionnaire.Choices>
        <Questionnaire.Error data-testid="direction-error" />
      </Questionnaire.Item>
      <Questionnaire.Item name="detail" multiple onStatusChange={(status: string) => props.onStatus?.("detail", status)} data-testid="detail">
        <Questionnaire.Title>How much detail?</Questionnaire.Title>
        <Questionnaire.Choices>
          <Questionnaire.Choice value="x">
            <Questionnaire.ChoiceInput data-testid="input-x" />
            <Questionnaire.ChoiceLabel>Focused</Questionnaire.ChoiceLabel>
          </Questionnaire.Choice>
          <Questionnaire.Choice value="y">
            <Questionnaire.ChoiceInput data-testid="input-y" />
            <Questionnaire.ChoiceLabel>Complete</Questionnaire.ChoiceLabel>
          </Questionnaire.Choice>
        </Questionnaire.Choices>
        <Questionnaire.Error data-testid="detail-error" />
      </Questionnaire.Item>
      <Questionnaire.Item name="hidden" disabled data-testid="hidden">
        <Questionnaire.Title>Never asked</Questionnaire.Title>
        <Questionnaire.Choices>
          <Questionnaire.Choice value="z">
            <Questionnaire.ChoiceInput />
            <Questionnaire.ChoiceLabel>Zeta</Questionnaire.ChoiceLabel>
          </Questionnaire.Choice>
        </Questionnaire.Choices>
      </Questionnaire.Item>
      <Questionnaire.Item name="name" required data-testid="name">
        <Questionnaire.Title>Your name?</Questionnaire.Title>
        <Questionnaire.Input aria-label="Your name" data-testid="name-input" />
        <Questionnaire.Error data-testid="name-error" />
      </Questionnaire.Item>
      <Questionnaire.Previous data-testid="previous">Back</Questionnaire.Previous>
      <Questionnaire.Skip data-testid="skip">Skip</Questionnaire.Skip>
      <Questionnaire.Next data-testid="next">Next</Questionnaire.Next>
      <Questionnaire.Submit data-testid="submit">Send</Questionnaire.Submit>
    </Questionnaire>
  );
}

/** A part used without its root. */
export function Orphan(): JsxChild {
  return <Questionnaire.Title>Orphan</Questionnaire.Title>;
}
