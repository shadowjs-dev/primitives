// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Progress } from "../src/index";

export const valid: JsxChild = (
  <Progress
    value={40}
    max={80}
    getValueLabel={(value: number, max: number) => `${value}/${max}`}
    aria-label="Upload"
  >
    <Progress.Indicator style={{ width: "50%" }} />
  </Progress>
);

export const indeterminate: JsxChild = <Progress value={null} />;

export const asSection: JsxChild = <Progress as="section" value={1} />;

// @ts-expect-error value is a number or null
export const stringValue: JsxChild = <Progress value="40" />;

// @ts-expect-error max is a number
export const stringMax: JsxChild = <Progress max="100" />;

// @ts-expect-error getValueLabel receives numbers
export const badLabel: JsxChild = <Progress getValueLabel={(value: string) => value} />;

// @ts-expect-error getValueLabel returns a string
export const badLabelReturn: JsxChild = <Progress getValueLabel={() => 1} />;
