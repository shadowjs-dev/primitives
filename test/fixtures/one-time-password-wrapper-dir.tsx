// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { OneTimePasswordField } from "../../src/index";

type Props = Record<string, unknown>;

/** A three-slot code inside a wrapper with `dir="rtl"`; every root prop can be passed through `props`. */
export function InRtlWrapper(props: Props): JsxChild {
  return (
    <div data-testid="wrapper" dir="rtl">
      <OneTimePasswordField data-testid="root" aria-label="Code" length={3} {...props}>
        <OneTimePasswordField.Input index={0} data-testid="slot-0" />
        <OneTimePasswordField.Input index={1} data-testid="slot-1" />
        <OneTimePasswordField.Input index={2} data-testid="slot-2" />
      </OneTimePasswordField>
    </div>
  );
}
