import { onCleanup, untrack, useEffect } from "@shadow-js/core";
import { For } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { SelectContextValue, SelectProps } from "./context";

/** Visually hidden but still focusable and validatable, so the browser can anchor its "required" bubble. */
const HIDDEN_STYLE =
  "position:absolute;pointer-events:none;opacity:0;margin:0;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);transform:translateX(-100%)";

/**
 * The native `<select>` that makes a custom select take part in forms: `FormData`, `required`
 * validation, `form="id"`, `autocomplete` and reset. Its options mirror the items the select
 * knows about (open listbox or closed-state registry), plus the current value, so the submitted
 * value is right even before any item has rendered (server markup, `defaultValue`).
 *
 * Renders nothing without a `name`: an unnamed control is never submitted.
 *
 * @internal
 */
export function SelectNative(props: {
  readonly context: SelectContextValue;
  readonly root: SelectProps;
}): JsxChild {
  const { context } = props;
  if (props.root.name === undefined) return null;
  let element: HTMLSelectElement | undefined;
  let mounted = false;
  let lastValue: string | undefined;
  // The option marked `selected` is what a native reset goes back to (and what the server markup
  // submits before hydration); the state itself resets to `defaultValue`.
  const initial = untrack(context.value);
  const resetValue = untrack(() => props.root.defaultValue ?? "");

  const options = (): string[] => {
    const seen = new Set<string>();
    const list: string[] = [];
    // Items register after mount; before that the markup must equal what the server rendered.
    for (const item of context.settled() ? context.collection.items() : []) {
      if (seen.has(item.data.value)) continue;
      seen.add(item.data.value);
      list.push(item.data.value);
    }
    const current = context.value();
    if (current !== "" && !seen.has(current)) list.push(current);
    if (initial !== "" && initial !== current && !seen.has(initial)) list.push(initial);
    return list;
  };
  const textOf = (value: string): string => {
    const item = context.collection.items().find((candidate) => candidate.data.value === value);
    return (
      item?.data.textValue ?? (value === context.value() ? (context.selectedText() ?? "") : "")
    );
  };

  // Options are created before the property is set, so the value is applied in an effect that also
  // re-runs when the option list changes.
  useEffect(() => {
    const select = element;
    if (select === undefined) return;
    options();
    const value = context.value();
    const changed = mounted && value !== lastValue;
    select.value = value;
    lastValue = value;
    mounted = true;
    if (changed) {
      // Form libraries listen for these on the control, as they would on a real select.
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  useEffect(() => {
    const form = element?.form;
    if (form === null || form === undefined) return;
    const onReset = (): void => {
      untrack(() => context.setValue(resetValue));
    };
    form.addEventListener("reset", onReset);
    onCleanup(() => form.removeEventListener("reset", onReset));
  });

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: the control exists only for the browser (form data, validation); the visible combobox is the accessible one, and focus sent here is forwarded to it.
    <select
      ref={(node: HTMLSelectElement) => {
        element = node;
      }}
      aria-hidden="true"
      tabindex={-1}
      name={props.root.name}
      form={props.root.form}
      required={props.root.required}
      disabled={props.root.disabled}
      autocomplete={props.root.autoComplete}
      style={HIDDEN_STYLE}
      // A failed `required` check focuses the hidden control; the visible one is what the user sees.
      onFocus={() => context.trigger()?.focus()}
    >
      <option value="" selected={initial === ""} />
      <For each={options()}>
        {(value: string) => (
          <option value={value} selected={value === initial}>
            {textOf(value)}
          </option>
        )}
      </For>
    </select>
  );
}
