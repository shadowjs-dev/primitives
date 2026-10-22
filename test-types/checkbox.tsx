/**
 * Compile-time checks for `Checkbox`. Nothing here runs: `tsc -p packages/primitives/tsconfig.json`
 * must pass, and every `@ts-expect-error` line must be an error (if one stops being an error, the
 * directive itself fails the check).
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Checkbox, type CheckedState } from "../src/index";

const report = (checked: CheckedState): void => void checked;
const takesBoolean = (checked: boolean): void => void checked;
const takesString = (checked: string): void => void checked;

export const valid: JsxChild = (
  <Checkbox
    checked="indeterminate"
    defaultChecked={false}
    onCheckedChange={report}
    disabled
    required
    name="n"
    value="v"
    form="f"
    class="x"
  >
    <Checkbox.Indicator forceMount class="i">
      x
    </Checkbox.Indicator>
  </Checkbox>
);

export const triState: JsxChild = <Checkbox checked={true} onCheckedChange={report} />;

// @ts-expect-error checked accepts only a boolean or "indeterminate"
export const stringChecked: JsxChild = <Checkbox checked="yes" />;

// @ts-expect-error "mixed" is the ARIA value, the prop says "indeterminate"
export const mixed: JsxChild = <Checkbox defaultChecked="mixed" />;

// @ts-expect-error the callback can receive "indeterminate", so a boolean-only handler is rejected
export const booleanOnly: JsxChild = <Checkbox onCheckedChange={takesBoolean} />;

// @ts-expect-error the callback never receives an arbitrary string
export const wrongCallback: JsxChild = <Checkbox onCheckedChange={takesString} />;

// @ts-expect-error value is submitted as text
export const numericValue: JsxChild = <Checkbox value={1} />;

// @ts-expect-error forceMount is a boolean
export const badForceMount: JsxChild = <Checkbox.Indicator forceMount="yes" />;

// @ts-expect-error unknown props are rejected
export const unknownProp: JsxChild = <Checkbox notAProp="x" />;
