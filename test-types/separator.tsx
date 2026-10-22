// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Separator } from "../src/index";

export const valid: JsxChild = <Separator orientation="vertical" decorative class="w-px" />;

export const asItem: JsxChild = <Separator as="li" />;

// @ts-expect-error orientation is "horizontal" or "vertical"
export const badOrientation: JsxChild = <Separator orientation="diagonal" />;

// @ts-expect-error decorative is a boolean
export const badDecorative: JsxChild = <Separator decorative="yes" />;

// @ts-expect-error a div has no href
export const hrefOnDiv: JsxChild = <Separator href="/x" />;
