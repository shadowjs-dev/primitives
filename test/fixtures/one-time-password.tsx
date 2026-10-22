// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { splitProps, useMemo } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import { OneTimePasswordField, oneTimePasswordContext, type OneTimePasswordContextValue, createOneTimePasswordPattern } from "../../src/index";

type Props = Record<string, unknown>;

/** Six slots; every root prop passes through. */
export function Demo(props: Props): JsxChild {
  const [own, rest] = splitProps(props, ["pattern"]);
  const filter = useMemo(() => own.pattern === undefined ? undefined : createOneTimePasswordPattern(own.pattern as string));
  return (
    <OneTimePasswordField data-testid="root" aria-label="Code" filter={filter()} {...rest}>
      <OneTimePasswordField.Input index={0} data-testid="slot-0" />
      <OneTimePasswordField.Input index={1} data-testid="slot-1" />
      <OneTimePasswordField.Input index={2} data-testid="slot-2" />
      <OneTimePasswordField.Input index={3} data-testid="slot-3" />
      <OneTimePasswordField.Input index={4} data-testid="slot-4" />
      <OneTimePasswordField.Input index={5} data-testid="slot-5" />
    </OneTimePasswordField>
  );
}

/** A slot outside a root. */
export function Orphan(): JsxChild {
  return <OneTimePasswordField.Input index={0} />;
}

export function ToggleSlot(props: { show: boolean }): JsxChild {
  return <OneTimePasswordField length={2} aria-label="Code">
    <OneTimePasswordField.Input index={0} data-testid="slot-0" />
    <Show when={props.show}><OneTimePasswordField.Input index={1} data-testid="slot-1" /></Show>
  </OneTimePasswordField>;
}

function Probe(props: { capture: (context: OneTimePasswordContextValue) => void }): JsxChild { props.capture(oneTimePasswordContext.use("Probe")); return null; }
export function Capture(props: { capture: (context: OneTimePasswordContextValue) => void; onComplete: (value: string) => void }): JsxChild {
  return <OneTimePasswordField value="" onComplete={props.onComplete}><Probe capture={props.capture} /></OneTimePasswordField>;
}
export function Duplicate(): JsxChild {
  return <OneTimePasswordField length={1}><OneTimePasswordField.Input index={0} /><OneTimePasswordField.Input index={0} /></OneTimePasswordField>;
}

export function InForm(props: Props): JsxChild { return <form data-testid="form"><Demo {...props} /></form>; }

export function Bounded(props: { length: number; index?: number; defaultValue?: string }): JsxChild {
  return (
    <OneTimePasswordField length={props.length} defaultValue={props.defaultValue} name="code" aria-label="Code">
      <OneTimePasswordField.Input index={props.index ?? props.length - 1} data-testid="last" />
    </OneTimePasswordField>
  );
}
