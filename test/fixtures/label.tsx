import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Label } from "../../src/index";

/** A label for an input, and a label that wraps its control. */
export function Demo(props: { onMouseDown?: (event: MouseEvent) => void }): JsxChild {
  return (
    <div>
      <Label data-testid="label" htmlFor="email" onMouseDown={props.onMouseDown}>
        Email
      </Label>
      <input id="email" data-testid="email" />
      <Label data-testid="wrapping">
        Newsletter
        <input type="checkbox" data-testid="checkbox" />
        <button type="button" data-testid="button">
          Preview
        </button>
      </Label>
    </div>
  );
}

/** A label rendered as a span. */
export function AsSpan(): JsxChild {
  return (
    <Label as="span" data-testid="label" htmlFor="x">
      Text
    </Label>
  );
}
