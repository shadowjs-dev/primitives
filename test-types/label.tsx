// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Label } from "../src/index";

export const valid: JsxChild = <Label htmlFor="email">Email</Label>;

export const asSpan: JsxChild = <Label as="span">Text</Label>;

// @ts-expect-error htmlFor is the id of the control, a string
export const badFor: JsxChild = <Label htmlFor={1}>Email</Label>;

// @ts-expect-error a label has no href
export const hrefOnLabel: JsxChild = <Label href="/x">Email</Label>;
