/**
 * Compile-time checks for `NumberField`. Nothing here runs: `tsc -p packages/primitives/tsconfig.json`
 * must pass, and every `@ts-expect-error` line must be an error.
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { NumberField } from "../src/index";

export const valid: JsxChild = (
  <NumberField
    value={1}
    defaultValue={null}
    onValueChange={(value: number | null) => void value}
    min={0}
    max={10}
    step={0.5}
    smallStep={0.1}
    largeStep={5}
    locale="de-DE"
    formatOptions={{ style: "currency", currency: "EUR", maximumFractionDigits: 2 }}
    allowMouseWheel
    clampValueOnBlur={false}
    disabled
    readOnly
    required
    name="n"
    form="f"
    dir="rtl"
    inputMode="decimal"
    class="x"
  >
    <NumberField.Decrement aria-label="Less" class="btn" />
    <NumberField.Input aria-label="Amount" placeholder="0" class="input" />
    <NumberField.Increment aria-label="More" class="btn" />
  </NumberField>
);

// onValueChange receives number | null (inferred, no annotation needed): null must be handled.
export const inferred: JsxChild = (
  <NumberField onValueChange={(value) => (value === null ? 0 : value + 1)} />
);

const takesNumber = (value: number): void => void value;
// @ts-expect-error the callback may receive null when the field is emptied
export const nullUnhandled: JsxChild = <NumberField onValueChange={takesNumber} />;

// @ts-expect-error the value is a number, not text
export const stringValue: JsxChild = <NumberField value="5" />;

// @ts-expect-error step is a number
export const stringStep: JsxChild = <NumberField step="1" />;

// @ts-expect-error inputMode is a closed union
export const badInputMode: JsxChild = <NumberField inputMode="phone" />;

// @ts-expect-error dir is "ltr" | "rtl"
export const badDir: JsxChild = <NumberField dir="auto" />;

// @ts-expect-error formatOptions are Intl.NumberFormat options
export const badFormat: JsxChild = <NumberField formatOptions={{ style: "fancy" }} />;

// @ts-expect-error unknown props are rejected
export const unknownProp: JsxChild = <NumberField notAProp="x" />;

// `as` retargets the attribute types of the parts.
export const asLink: JsxChild = <NumberField.Increment as="a" href="/x" />;
// @ts-expect-error the default button has no href
export const buttonHref: JsxChild = <NumberField.Increment href="/x" />;
