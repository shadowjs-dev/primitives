import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Show } from "@shadow-js/web";
import { Progress } from "../../src/index";

interface DemoProps {
  value?: number | null;
  max?: number;
  getValueLabel?: (value: number, max: number) => string;
  extra?: Record<string, unknown>;
}

/** A progress bar with an indicator. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <Progress
      data-testid="progress"
      aria-label="Upload"
      value={props.value}
      max={props.max}
      getValueLabel={props.getValueLabel}
      {...props.extra}
    >
      <Progress.Indicator data-testid="indicator" />
    </Progress>
  );
}

/** Rendered as another element. */
export function AsSection(): JsxChild {
  return (
    <Progress as="section" value={10} data-testid="progress">
      <Progress.Indicator as="span" data-testid="indicator" />
    </Progress>
  );
}

/** An indicator outside a bar. */
export function Orphan(): JsxChild {
  return <Progress.Indicator />;
}

export function OrphanLabel(): JsxChild { return <Progress.Label />; }
export function OrphanValue(): JsxChild { return <Progress.Value />; }

/** Optional label and visible value, with caller-defined labels. */
export function Parts(props: { value?: number | null; label?: boolean; labelId?: string; getValueLabel?: (value: number, max: number) => string }): JsxChild {
  return (
    <Progress value={props.value} max={20} getValueLabel={props.getValueLabel} data-testid="progress">
      <Show when={props.label !== false}>
        <Progress.Label id={props.labelId} data-testid="label">Upload</Progress.Label>
      </Show>
      <Progress.Value data-testid="value" />
      <Progress.Indicator data-testid="indicator" />
    </Progress>
  );
}

/** A bar whose `lang` decides the digits of its value text. */
export function Localized(props: { lang?: string; value?: number }): JsxChild {
  return (
    <Progress data-testid="progress" lang={props.lang} value={props.value ?? 40} max={100} aria-label="Upload">
      <Progress.Value data-testid="value" />
      <Progress.Indicator data-testid="indicator" />
    </Progress>
  );
}
