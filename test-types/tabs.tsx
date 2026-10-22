// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Tabs } from "../src/index";

export const valid: JsxChild = (
  <Tabs
    defaultValue="a"
    onValueChange={(value: string) => value}
    orientation="vertical"
    dir="rtl"
    activationMode="manual"
  >
    <Tabs.List loop={false} aria-label="Sections">
      <Tabs.Trigger value="a" disabled>
        A
      </Tabs.Trigger>
      <Tabs.Trigger as="a" href="#b" value="b">
        B
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="a" forceMount as="section">
      Panel
    </Tabs.Content>
  </Tabs>
);

// @ts-expect-error every tab needs a value
export const triggerWithoutValue: JsxChild = <Tabs.Trigger>A</Tabs.Trigger>;

// @ts-expect-error every panel needs a value
export const contentWithoutValue: JsxChild = <Tabs.Content>A</Tabs.Content>;

// @ts-expect-error the value is a string
export const numericValue: JsxChild = <Tabs.Trigger value={1} />;

// @ts-expect-error orientation is "horizontal" or "vertical"
export const badOrientation: JsxChild = <Tabs orientation="diagonal" />;

// @ts-expect-error activationMode is "automatic" or "manual"
export const badActivation: JsxChild = <Tabs activationMode="lazy" />;

// @ts-expect-error the callback receives the value as a string
export const badCallback: JsxChild = <Tabs onValueChange={(value: number) => value} />;

// @ts-expect-error a button has no href
export const hrefOnButton: JsxChild = <Tabs.Trigger value="a" href="/x" />;

// @ts-expect-error loop is a boolean
export const loopNotBoolean: JsxChild = <Tabs.List loop="yes" />;
