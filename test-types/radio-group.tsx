/**
 * Compile-time checks for `RadioGroup`. Nothing here runs: `tsc -p packages/primitives/tsconfig.json`
 * must pass, and every `@ts-expect-error` line must be an error (if one stops being an error, the
 * directive itself fails the check).
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { RadioGroup } from "../src/index";

const takesString = (value: string): void => void value;
const takesList = (value: string[]): void => void value;

export const valid: JsxChild = (
  <RadioGroup
    value="a"
    defaultValue="b"
    onValueChange={takesString}
    name="plan"
    required
    disabled
    orientation="vertical"
    dir="rtl"
    loop={false}
    form="f"
    aria-label="Plan"
  >
    <RadioGroup.Item value="a" disabled required class="item">
      <RadioGroup.Indicator forceMount class="dot" />
    </RadioGroup.Item>
  </RadioGroup>
);

// @ts-expect-error a radio group holds one string, not a list
export const listValue: JsxChild = <RadioGroup value={["a"]} />;

// @ts-expect-error the callback receives the checked string
export const listCallback: JsxChild = <RadioGroup onValueChange={takesList} />;

// @ts-expect-error orientation is horizontal or vertical
export const badOrientation: JsxChild = <RadioGroup orientation="diagonal" />;

// @ts-expect-error dir is ltr or rtl
export const badDir: JsxChild = <RadioGroup dir="auto" />;

// @ts-expect-error an item needs a value
export const itemWithoutValue: JsxChild = <RadioGroup.Item />;

// @ts-expect-error an item value is a string
export const itemWithNumber: JsxChild = <RadioGroup.Item value={1} />;

// @ts-expect-error forceMount is a boolean
export const badForceMount: JsxChild = <RadioGroup.Indicator forceMount="yes" />;

export const asNav: JsxChild = <RadioGroup as="nav" />;
export const itemAsAnchor: JsxChild = <RadioGroup.Item as="a" href="/x" value="a" />;
// @ts-expect-error the default button has no href
export const itemHref: JsxChild = <RadioGroup.Item href="/x" value="a" />;
