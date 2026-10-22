import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Questionnaire } from "../../src/index";

const progress = (current: number, total: number): string => `السؤال ${current} من ${total}`;

export function Rtl(): JsxChild {
  return (
    <div dir="rtl" data-testid="root">
      <Questionnaire data-testid="form" dir="rtl" messages={{ progress, progressLabel: "تقدم الاستبيان", required: "أجب عن هذا السؤال للمتابعة." }}>
        <Questionnaire.Progress data-testid="progress" />
        <Questionnaire.Item name="color" required data-testid="color">
          <Questionnaire.Title>ما لونك المفضل؟</Questionnaire.Title>
          <Questionnaire.Choices>
            <Questionnaire.Choice value="red">
              <Questionnaire.ChoiceInput data-testid="red" />
              <Questionnaire.ChoiceLabel>أحمر</Questionnaire.ChoiceLabel>
            </Questionnaire.Choice>
          </Questionnaire.Choices>
          <Questionnaire.Error data-testid="error" />
        </Questionnaire.Item>
        <Questionnaire.Item name="note" data-testid="note">
          <Questionnaire.Title>أي ملاحظات؟</Questionnaire.Title>
          <Questionnaire.Input aria-label="ملاحظاتك" data-testid="note-input" />
        </Questionnaire.Item>
        <Questionnaire.Next data-testid="next">التالي</Questionnaire.Next>
      </Questionnaire>
    </div>
  );
}
