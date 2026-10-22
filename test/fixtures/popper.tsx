import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Popper, PopperAnchor, PopperArrow, PopperContent } from "../../src/index";

export function Demo(props: Record<string, unknown>): JsxChild {
  return (
    <Popper>
      <PopperAnchor data-testid="anchor">anchor</PopperAnchor>
      <PopperContent
        data-testid="content"
        side={props["side"] as "top" | undefined}
        sideOffset={4}
        align="start"
      >
        content
        <PopperArrow data-testid="arrow" />
      </PopperContent>
    </Popper>
  );
}

export function InShow(props: { show: boolean }): JsxChild {
  return (
    <Show when={props.show}>
      <Popper>
        <PopperAnchor data-testid="anchor">anchor</PopperAnchor>
        <PopperContent data-testid="content">
          <PopperArrow />
        </PopperContent>
      </Popper>
    </Show>
  );
}
