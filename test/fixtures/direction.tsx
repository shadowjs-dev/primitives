import type { Accessor } from "@shadow-js/core";
import { useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { Direction } from "../../src/index";
import { DirectionProvider, useDirection } from "../../src/index";

export function Probe(props: { id: string; dir?: Direction }): JsxChild {
  const dir = useDirection(() => props.dir);
  return (
    <span id={props.id} data-dir={dir()}>
      {dir()}
    </span>
  );
}

export function Overridden(): JsxChild {
  return (
    <DirectionProvider dir="rtl">
      <Probe id="provided" />
      <Probe id="local" dir="ltr" />
    </DirectionProvider>
  );
}

export function Nested(): JsxChild {
  return (
    <DirectionProvider dir="rtl">
      <Probe id="outer" />
      <DirectionProvider dir="ltr">
        <Probe id="inner" />
      </DirectionProvider>
    </DirectionProvider>
  );
}

export function Bare(): JsxChild {
  return <Probe id="bare" />;
}

const signal = useSignal<Direction>("ltr");

/** The direction the `Reactive` fixture provides. */
export function setDirection(value: Direction): void {
  signal[1](value);
}

export function Reactive(): JsxChild {
  return (
    <DirectionProvider dir={signal[0]()}>
      <Probe id="reactive" />
    </DirectionProvider>
  );
}

export function Capture(props: { sink: (dir: Accessor<Direction>) => void }): JsxChild {
  props.sink(useDirection());
  return <i />;
}
