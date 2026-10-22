import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { HiddenInput, type HiddenInputProps } from "../../src/index";

export function InForm(props: HiddenInputProps & { formId?: string }): JsxChild {
  return (
    <form id={props.formId ?? "f"} data-testid="form">
      <HiddenInput
        type={props.type}
        name={props.name}
        value={props.value}
        checked={props.checked}
        required={props.required}
        disabled={props.disabled}
        indeterminate={props.indeterminate}
        onReset={props.onReset}
      />
    </form>
  );
}

export function Outside(props: { value: string }): JsxChild {
  return (
    <div>
      <form id="remote" data-testid="remote" />
      <HiddenInput type="text" name="n" value={props.value} form="remote" />
    </div>
  );
}
