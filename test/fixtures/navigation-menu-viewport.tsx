// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { NavigationMenu } from "../../src/index";

type Props = Record<string, unknown>;

/** Two items, an indicator inside the list and a viewport after it; every root prop passes through. */
export function Demo(props: Props): JsxChild {
  return (
    <NavigationMenu data-testid="root" aria-label="Main" {...props}>
      <NavigationMenu.List data-testid="list">
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
        <NavigationMenu.Indicator data-testid="indicator" />
      </NavigationMenu.List>
      <NavigationMenu.Viewport data-testid="viewport" />
    </NavigationMenu>
  );
}

/** The same items with no viewport, so content renders inline. */
export function NoViewport(): JsxChild {
  return (
    <NavigationMenu data-testid="root" aria-label="Main">
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger data-testid="products">Products</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="products-content">
            <NavigationMenu.Link href="/a">Product A</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  );
}

/** A viewport outside a root. */
export function OrphanViewport(): JsxChild {
  return <NavigationMenu.Viewport />;
}

/** An indicator outside a root. */
export function OrphanIndicator(): JsxChild {
  return <NavigationMenu.Indicator />;
}
