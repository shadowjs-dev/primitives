import { For } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { mergeElementProps, type RovingFocus, useRovingFocus } from "../../src/index";

interface ItemSpec {
  id: string;
  disabled?: boolean;
  active?: boolean;
}

function Row(props: { group: RovingFocus; spec: ItemSpec }): JsxChild {
  // Built once per row: calling `group.item()` inside the JSX spread would run it on every update.
  const merged = mergeElementProps(
    props.group.item({
      id: () => props.spec.id,
      disabled: () => props.spec.disabled === true,
      active: () => props.spec.active === true,
    }),
  );
  return (
    <button type="button" id={props.spec.id} {...merged}>
      {props.spec.id}
    </button>
  );
}

export function Bar(props: {
  items: ItemSpec[];
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  loop?: boolean;
  tabStop?: string;
}): JsxChild {
  const group = useRovingFocus({
    orientation: () => props.orientation,
    dir: () => props.dir ?? "ltr",
    loop: () => props.loop ?? true,
    currentTabStopId: () => props.tabStop,
  });
  return (
    <div role="toolbar">
      <For each={props.items}>{(spec) => <Row group={group} spec={spec} />}</For>
    </div>
  );
}
