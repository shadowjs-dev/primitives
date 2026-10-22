import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { DismissableLayer } from "../../src/index";

interface LayerProps {
  open: boolean;
  onDismiss: () => void;
  name: string;
  modal?: boolean;
  children?: JsxChild;
}

export function Layer(props: LayerProps): JsxChild {
  return (
    <Show when={props.open}>
      <DismissableLayer
        data-testid={props.name}
        disableOutsidePointerEvents={props.modal}
        onDismiss={props.onDismiss}
      >
        <button type="button" data-testid={`${props.name}-button`}>
          {props.name}
        </button>
        {props.children}
      </DismissableLayer>
    </Show>
  );
}

export function Nested(props: {
  outer: boolean;
  inner: boolean;
  closeOuter: () => void;
  closeInner: () => void;
}): JsxChild {
  return (
    <div>
      <button type="button" data-testid="page">
        page
      </button>
      <Layer name="outer" open={props.outer} onDismiss={props.closeOuter}>
        <Layer name="inner" open={props.inner} onDismiss={props.closeInner} />
      </Layer>
    </div>
  );
}

export function AsSection(props: { onDismiss: () => void }): JsxChild {
  return (
    <DismissableLayer as="section" data-testid="section" onDismiss={props.onDismiss}>
      content
    </DismissableLayer>
  );
}
