import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { VisuallyHidden, visuallyHiddenStyle } from "../../src/index";

export { visuallyHiddenStyle };

export function Plain(): JsxChild {
  return (
    <p>
      <VisuallyHidden>Close</VisuallyHidden>
    </p>
  );
}

export function Custom(): JsxChild {
  return (
    <VisuallyHidden class="sr" style={{ margin: "0" }} id="vh">
      Label
    </VisuallyHidden>
  );
}

export function AsLabel(): JsxChild {
  return (
    <VisuallyHidden as="label" id="vh">
      Label
    </VisuallyHidden>
  );
}
