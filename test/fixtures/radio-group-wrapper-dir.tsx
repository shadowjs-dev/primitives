// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { RadioGroup } from "../../src/index";

/** Three items inside a plain wrapper whose only direction signal is `dir="rtl"` on the ancestor. */
export function Wrapped(): JsxChild {
  return (
    <div dir="rtl" data-testid="wrapper">
      <RadioGroup data-testid="group" aria-label="خطة">
        <RadioGroup.Item value="a" data-testid="a">
          <RadioGroup.Indicator data-testid="ia" />
          واحد
        </RadioGroup.Item>
        <RadioGroup.Item value="b" data-testid="b">
          <RadioGroup.Indicator data-testid="ib" />
          اثنان
        </RadioGroup.Item>
        <RadioGroup.Item value="c" data-testid="c">
          <RadioGroup.Indicator data-testid="ic" />
          ثلاثة
        </RadioGroup.Item>
      </RadioGroup>
    </div>
  );
}
