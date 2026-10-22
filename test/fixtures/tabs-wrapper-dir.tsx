// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Tabs } from "../../src/index";

/** Three tabs inside a plain wrapper whose only direction signal is `dir="rtl"` on the ancestor. */
export function Wrapped(): JsxChild {
  return (
    <div dir="rtl" data-testid="wrapper">
      <Tabs data-testid="root" defaultValue="a">
        <Tabs.List data-testid="list" aria-label="x">
          <Tabs.Trigger data-testid="a" value="a">
            a
          </Tabs.Trigger>
          <Tabs.Trigger data-testid="b" value="b">
            b
          </Tabs.Trigger>
          <Tabs.Trigger data-testid="c" value="c">
            c
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A</Tabs.Content>
        <Tabs.Content value="b">B</Tabs.Content>
        <Tabs.Content value="c">C</Tabs.Content>
      </Tabs>
    </div>
  );
}
