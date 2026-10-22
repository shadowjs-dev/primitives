import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Accordion } from "../../src/index";

const ITEMS = ["one", "two", "three"];

/** A plain wrapper sets dir=rtl. The accordion has no dir prop and no DirectionProvider. */
export function Wrapped(): JsxChild {
  return (
    <div dir="rtl" data-testid="wrapper">
      <Accordion type="single" data-testid="root" orientation="horizontal">
        {ITEMS.map((value) => (
          <Accordion.Item data-testid={`item-${value}`} value={value}>
            <Accordion.Header>
              <Accordion.Trigger data-testid={`trigger-${value}`}>Question {value}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
              <p>Answer {value}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}
