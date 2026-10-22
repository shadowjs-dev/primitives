// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { NavigationMenu } from "../../src/index";

type Props = Record<string, unknown>;

/** Two items with flyouts; every root prop passes through. */
export function Demo(props: Props): JsxChild {
  return (
    <NavigationMenu data-testid="root" aria-label="Main" {...props}>
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger data-testid="products">Products</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="products-content">
            <NavigationMenu.Link href="/a" active data-testid="link-a">
              Product A
            </NavigationMenu.Link>
            <NavigationMenu.Link href="/b" data-testid="link-b">
              Product B
            </NavigationMenu.Link>
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
  );
}

/** A trigger outside a root. */
export function Orphan(): JsxChild {
  return <NavigationMenu.Trigger>x</NavigationMenu.Trigger>;
}
