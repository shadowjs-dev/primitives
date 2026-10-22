// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Toggle } from "../../src/index";

type Props = Record<string, unknown>;

/** A bare toggle; every Toggle prop can be passed through `props`. */
export function Demo(props: Props): JsxChild {
  return (
    <Toggle data-testid="toggle" {...props}>
      Bold
    </Toggle>
  );
}

/** A toggle rendered as a div. */
export function AsDiv(props: Props): JsxChild {
  return (
    <Toggle as="div" data-testid="toggle" {...props}>
      Bold
    </Toggle>
  );
}
