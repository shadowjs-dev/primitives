// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Toolbar } from "../../src/index";

type Props = Record<string, unknown>;

/** Three buttons, a separator, a toggle item and a link: every prop of the root passes through. */
export function Demo(props: Props): JsxChild {
  return (
    <Toolbar data-testid="root" aria-label="Formatting" {...props}>
      <Toolbar.Button data-testid="one">One</Toolbar.Button>
      <Toolbar.Button data-testid="two" disabled={props["disabled"] === "two"}>
        Two
      </Toolbar.Button>
      <Toolbar.Separator data-testid="sep" />
      <Toolbar.ToggleItem data-testid="toggle" defaultPressed={false}>
        Italic
      </Toolbar.ToggleItem>
      <Toolbar.Link data-testid="link" href="/docs">
        Docs
      </Toolbar.Link>
    </Toolbar>
  );
}

/** A toolbar part outside a root. */
export function Orphan(): JsxChild {
  return <Toolbar.Button>x</Toolbar.Button>;
}
