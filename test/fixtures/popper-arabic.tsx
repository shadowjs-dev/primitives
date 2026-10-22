import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Popper, PopperAnchor, PopperContent } from "../../src/index";

/** A popper with Arabic text, inside a wrapper with the given `dir`. */
export function Arabic(props: { wrapperDir?: "ltr" | "rtl"; side?: "top" | "bottom" }): JsxChild {
  return (
    <div dir={props.wrapperDir}>
      <Popper>
        <PopperAnchor data-testid="anchor">فتح القائمة</PopperAnchor>
        <PopperContent data-testid="content" side={props.side} align="start">
          محتوى القائمة
        </PopperContent>
      </Popper>
    </div>
  );
}
