import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Popper, PopperAnchor, PopperContent } from "../../src/index";

/** A popper whose anchor sits inside a wrapper with the given `dir` attribute. */
export function InWrapper(props: { wrapperDir?: "auto" | "ltr" | "rtl"; contentDir?: "ltr" | "rtl" }): JsxChild {
  return (
    <div dir={props.wrapperDir}>
      <Popper>
        <PopperAnchor data-testid="anchor">anchor</PopperAnchor>
        <PopperContent data-testid="content" dir={props.contentDir}>
          content
        </PopperContent>
      </Popper>
    </div>
  );
}
