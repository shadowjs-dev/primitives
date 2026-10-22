// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { NavigationMenu } from "../../src/index";

/** Two triggers inside a wrapper with `dir="rtl"`; the NavigationMenu itself gets no dir prop. */
export function InRtlWrapper(): JsxChild {
  return (
    <div data-testid="wrapper" dir="rtl">
      <NavigationMenu data-testid="root" aria-label="Main">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger data-testid="products">Products</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="products-content">
              <NavigationMenu.Link href="/a">Product A</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="company">
            <NavigationMenu.Trigger data-testid="company">Company</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="company-content">
              <NavigationMenu.Link href="/about">About</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </div>
  );
}
