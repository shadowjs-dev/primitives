// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { ToggleGroup } from "../../src/index";

/** Three single-type items inside a plain wrapper whose only direction signal is `dir="rtl"` on the ancestor. */
export function Wrapped(): JsxChild {
  return (
    <div dir="rtl" data-testid="wrapper">
      <ToggleGroup data-testid="group" aria-label="نمط" type="single">
        <ToggleGroup.Item value="a" data-testid="a">
          واحد
        </ToggleGroup.Item>
        <ToggleGroup.Item value="b" data-testid="b">
          اثنان
        </ToggleGroup.Item>
        <ToggleGroup.Item value="c" data-testid="c">
          ثلاثة
        </ToggleGroup.Item>
      </ToggleGroup>
    </div>
  );
}
