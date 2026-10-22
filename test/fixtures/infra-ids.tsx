import { useId } from "@shadow-js/core";
import { useBaseId } from "../../src/index";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";

function Probe(): JsxChild {
  const id = useId();
  return <span data-testid="probe" id={id} />;
}

/** A dynamic attribute before a conditional branch: client and server create different owner counts. */
export function Page(props: { cls: string; show: boolean }): JsxChild {
  return (
    <div>
      <p class={props.cls}>text</p>
      <Show when={props.show}>
        <Probe />
      </Show>
    </div>
  );
}

export function Plain(): JsxChild {
  return (
    <div>
      <Probe />
      <Probe />
    </div>
  );
}

function BaseProbe(): JsxChild {
  const base = useBaseId();
  return <span data-testid="probe" id={base()} />;
}

/** The same shape as `Page`, with the id taken by `useBaseId`. */
export function BasePage(props: { cls: string; show: boolean }): JsxChild {
  return (
    <div>
      <p class={props.cls}>text</p>
      <Show when={props.show}>
        <BaseProbe />
      </Show>
      <BaseProbe />
    </div>
  );
}
