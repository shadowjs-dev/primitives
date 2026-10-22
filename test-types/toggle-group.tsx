/**
 * Compile-time checks for `ToggleGroup`. Nothing here runs: `tsc -p packages/primitives/tsconfig.json`
 * must pass, and every `@ts-expect-error` line must be an error (if one stops being an error, the
 * directive itself fails the check).
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { ToggleGroup } from "../src/index";

const takesString = (value: string): void => void value;
const takesList = (value: string[]): void => void value;

export const single: JsxChild = (
  <ToggleGroup
    type="single"
    value="a"
    defaultValue="b"
    onValueChange={takesString}
    disabled
    orientation="vertical"
    dir="rtl"
    loop={false}
    rovingFocus={false}
    aria-label="Alignment"
  >
    <ToggleGroup.Item value="a" disabled class="item">
      A
    </ToggleGroup.Item>
  </ToggleGroup>
);

export const multiple: JsxChild = (
  <ToggleGroup type="multiple" value={["a"]} defaultValue={[]} onValueChange={takesList}>
    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
  </ToggleGroup>
);

// @ts-expect-error a single group takes a string, not an array
export const singleWithList: JsxChild = <ToggleGroup type="single" value={["a"]} />;

// @ts-expect-error a multiple group takes an array, not a string
export const multipleWithString: JsxChild = <ToggleGroup type="multiple" value="a" />;

// @ts-expect-error a single group reports a string
export const singleCb: JsxChild = <ToggleGroup type="single" onValueChange={takesList} />;

// @ts-expect-error a multiple group reports an array
export const multipleCb: JsxChild = <ToggleGroup type="multiple" onValueChange={takesString} />;

// @ts-expect-error type is required and is "single" or "multiple"
export const noType: JsxChild = <ToggleGroup value="a" />;

// @ts-expect-error unknown type
export const badType: JsxChild = <ToggleGroup type="many" />;

// @ts-expect-error an item needs a value
export const itemWithoutValue: JsxChild = <ToggleGroup.Item />;

// @ts-expect-error an item value is a string
export const itemWithNumber: JsxChild = <ToggleGroup.Item value={1} />;

// @ts-expect-error orientation is horizontal or vertical
export const badOrientation: JsxChild = <ToggleGroup type="single" orientation="diagonal" />;

export const asNav: JsxChild = <ToggleGroup type="single" as="nav" />;
