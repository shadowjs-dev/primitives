/**
 * Compile-time checks for `Toggle`. Nothing here runs: `tsc -p packages/primitives/tsconfig.json`
 * must pass, and every `@ts-expect-error` line must be an error (if one stops being an error, the
 * directive itself fails the check).
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Toggle } from "../src/index";

const takesString = (pressed: string): void => void pressed;

export const valid: JsxChild = (
  <Toggle
    pressed
    defaultPressed={false}
    onPressedChange={(pressed: boolean) => void pressed}
    disabled
    class="x"
    aria-label="Bold"
  >
    B
  </Toggle>
);

// @ts-expect-error pressed is a boolean
export const stringPressed: JsxChild = <Toggle pressed="yes" />;

// @ts-expect-error the callback receives a boolean
export const wrongCallback: JsxChild = <Toggle onPressedChange={takesString} />;

// @ts-expect-error unknown props are rejected
export const unknownProp: JsxChild = <Toggle notAProp="x" />;

export const asAnchor: JsxChild = <Toggle as="a" href="/x" />;
// @ts-expect-error the default button has no href
export const buttonHref: JsxChild = <Toggle href="/x" />;
