import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Separator } from "../../src/index";

/** A separator between two paragraphs. */
export function Demo(props: {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}): JsxChild {
  return (
    <div>
      <p>Above</p>
      <Separator
        data-testid="separator"
        orientation={props.orientation}
        decorative={props.decorative}
      />
      <p>Below</p>
    </div>
  );
}

/** A separator rendered as a list item. */
export function AsListItem(): JsxChild {
  return (
    <ul>
      <Separator as="li" data-testid="separator" orientation="vertical" />
    </ul>
  );
}
