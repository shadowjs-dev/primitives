/**
 * Compile-time checks for `Switch`. Nothing here runs: `tsc -p packages/primitives/tsconfig.json`
 * must pass, and every `@ts-expect-error` line must be an error (if one stops being an error, the
 * directive itself fails the check).
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Switch } from "../src/index";

export const valid: JsxChild = (
  <Switch
    checked
    defaultChecked={false}
    onCheckedChange={(checked: boolean) => void checked}
    disabled
    required
    name="n"
    value="v"
    form="f"
    class="x"
  >
    <Switch.Thumb class="thumb" />
  </Switch>
);

// @ts-expect-error checked is a boolean, not a string
export const stringChecked: JsxChild = <Switch checked="yes" />;

// @ts-expect-error a switch has no "indeterminate" state
export const indeterminate: JsxChild = <Switch checked="indeterminate" />;

const takesString = (checked: string): void => void checked;
// @ts-expect-error the callback receives a boolean
export const wrongCallback: JsxChild = <Switch onCheckedChange={takesString} />;

// @ts-expect-error value is submitted as text
export const numericValue: JsxChild = <Switch value={1} />;

// @ts-expect-error unknown props are rejected on the default button
export const unknownProp: JsxChild = <Switch notAProp="x" />;

// `as` retargets the attribute types: an anchor takes href, a button does not.
export const asAnchor: JsxChild = <Switch as="a" href="/x" />;
// @ts-expect-error the default button has no href
export const buttonHref: JsxChild = <Switch href="/x" />;
