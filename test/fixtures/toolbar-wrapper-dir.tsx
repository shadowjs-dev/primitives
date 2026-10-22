// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Toolbar } from "../../src/index";

/** Three buttons inside a plain wrapper whose only direction signal is `dir="rtl"` on the ancestor. */
export function Wrapped(): JsxChild {
  return (
    <div dir="rtl" data-testid="wrapper">
      <Toolbar data-testid="root" aria-label="تنسيق">
        <Toolbar.Button data-testid="one">واحد</Toolbar.Button>
        <Toolbar.Button data-testid="two">اثنان</Toolbar.Button>
        <Toolbar.Button data-testid="three">ثلاثة</Toolbar.Button>
      </Toolbar>
    </div>
  );
}
