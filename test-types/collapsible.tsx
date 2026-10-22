// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Collapsible } from "../src/index";

export const valid: JsxChild = (
  <Collapsible defaultOpen onOpenChange={(open: boolean) => open} disabled class="root">
    <Collapsible.Trigger as="a" href="/more">
      More
    </Collapsible.Trigger>
    <Collapsible.Content forceMount as="section" aria-live="polite">
      Details
    </Collapsible.Content>
  </Collapsible>
);

export const asSpan: JsxChild = <Collapsible as="span" />;

// @ts-expect-error open is a boolean
export const openNotBoolean: JsxChild = <Collapsible open="yes" />;

// @ts-expect-error the callback receives a boolean, not a string
export const callbackWrongType: JsxChild = <Collapsible onOpenChange={(open: string) => open} />;

// @ts-expect-error a button has no href
export const hrefOnButton: JsxChild = <Collapsible.Trigger href="/x" />;

// @ts-expect-error forceMount is a boolean
export const forceMountNotBoolean: JsxChild = <Collapsible.Content forceMount="always" />;

// @ts-expect-error `as` only accepts tag names from the closed table or a component
export const unknownTag: JsxChild = <Collapsible as="blink" />;
