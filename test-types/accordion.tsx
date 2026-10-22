// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Accordion } from "../src/index";

export const single: JsxChild = (
  <Accordion
    type="single"
    collapsible
    defaultValue="a"
    onValueChange={(value: string) => value}
    orientation="horizontal"
    dir="rtl"
    class="root"
  >
    <Accordion.Item value="a" disabled>
      <Accordion.Header as="h2">
        <Accordion.Trigger as="a" href="#a">
          A
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content forceMount>Answer</Accordion.Content>
    </Accordion.Item>
  </Accordion>
);

export const multiple: JsxChild = (
  <Accordion type="multiple" value={["a", "b"]} onValueChange={(value: string[]) => value.length} />
);

// @ts-expect-error `type` is required
export const noType: JsxChild = <Accordion />;

// @ts-expect-error a single accordion has a string value, not an array
export const singleWithArray: JsxChild = <Accordion type="single" value={["a"]} />;

// @ts-expect-error a multiple accordion has an array value, not a string
export const multipleWithString: JsxChild = <Accordion type="multiple" value="a" />;

// @ts-expect-error a single accordion's default is a string
export const singleDefaultArray: JsxChild = <Accordion type="single" defaultValue={["a"]} />;

const reportsString = (value: string): string => value;
const reportsArray = (value: string[]): string[] => value;

// @ts-expect-error a multiple accordion reports an array
export const badMulti: JsxChild = <Accordion type="multiple" onValueChange={reportsString} />;

// @ts-expect-error a single accordion reports a string
export const badSingle: JsxChild = <Accordion type="single" onValueChange={reportsArray} />;

// @ts-expect-error only a single accordion can be collapsible
export const multipleCollapsible: JsxChild = <Accordion type="multiple" collapsible />;

// @ts-expect-error `type` is "single" or "multiple"
export const badType: JsxChild = <Accordion type="several" />;

// @ts-expect-error every item needs a value
export const itemWithoutValue: JsxChild = <Accordion.Item />;

// @ts-expect-error a button has no href
export const hrefOnButton: JsxChild = <Accordion.Trigger href="/x" />;
