import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { createOneTimePasswordPattern, OneTimePasswordField } from "../src/index";

export const patterned: JsxChild = (
  <OneTimePasswordField
    filter={createOneTimePasswordPattern("^[A-F0-9]+$")}
    length={4}
    onValueChange={(value) => value.toUpperCase()}
    onComplete={(value) => value.toLowerCase()}
    dir="rtl"
  >
    <OneTimePasswordField.Input index={0} inputmode="text" />
  </OneTimePasswordField>
);
// @ts-expect-error patterns are regular expression sources, not stateful RegExp objects
const invalid = createOneTimePasswordPattern(/[A-Z]/g);
export const objectPattern: JsxChild = <OneTimePasswordField filter={invalid} />;
// @ts-expect-error a code value must remain a string
export const numericCode: JsxChild = <OneTimePasswordField value={1234} />;
// @ts-expect-error slot indices are numeric
export const textIndex: JsxChild = <OneTimePasswordField.Input index="0" />;
