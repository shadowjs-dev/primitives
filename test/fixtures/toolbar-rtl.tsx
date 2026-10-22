// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { Direction } from "../../src/index";
import { DirectionProvider, Toolbar } from "../../src/index";

type Props = Record<string, unknown>;

/** Arabic labels on every item; every root prop passes through. */
export function Arabic(props: Props): JsxChild {
  return (
    <Toolbar data-testid="root" aria-label="تنسيق" {...props}>
      <Toolbar.Button data-testid="one">واحد</Toolbar.Button>
      <Toolbar.Button data-testid="two">اثنان</Toolbar.Button>
      <Toolbar.Separator data-testid="sep" />
      <Toolbar.ToggleItem data-testid="toggle" defaultPressed={false}>
        مائل
      </Toolbar.ToggleItem>
      <Toolbar.Link data-testid="link" href="/docs">
        الوثائق
      </Toolbar.Link>
    </Toolbar>
  );
}

/** Two buttons with no dir prop, inside a DirectionProvider set to `props.dir`. */
export function Provided(props: { dir: Direction }): JsxChild {
  return (
    <DirectionProvider dir={props.dir}>
      <Toolbar data-testid="root" aria-label="تنسيق">
        <Toolbar.Button data-testid="one">واحد</Toolbar.Button>
        <Toolbar.Button data-testid="two">اثنان</Toolbar.Button>
      </Toolbar>
    </DirectionProvider>
  );
}
