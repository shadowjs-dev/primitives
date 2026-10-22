// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PasswordToggleField } from "../../src/index";

type Props = Record<string, unknown>;

/** A password field with its toggle; root props pass through, and the toggle takes an aria-label. */
export function Demo(props: Props): JsxChild {
  return (
    <PasswordToggleField data-testid="root" {...props}>
      <PasswordToggleField.Input data-testid="input" />
      <PasswordToggleField.Toggle data-testid="toggle" />
    </PasswordToggleField>
  );
}

/** Parts that take their own label and autocomplete. */
export function Labeled(): JsxChild {
  return (
    <PasswordToggleField>
      <PasswordToggleField.Input data-testid="input" autocomplete="new-password" />
      <PasswordToggleField.Toggle data-testid="toggle" aria-label="Reveal the code" />
    </PasswordToggleField>
  );
}

/** The input has an id of the application; the toggle's aria-controls must name that id. */
export function WithId(): JsxChild {
  return (
    <PasswordToggleField>
      <PasswordToggleField.Input data-testid="input" id="account-password" />
      <PasswordToggleField.Toggle data-testid="toggle" />
    </PasswordToggleField>
  );
}

/** A toggle outside a root. */
export function Orphan(): JsxChild {
  return <PasswordToggleField.Toggle>x</PasswordToggleField.Toggle>;
}

/** The toggle comes before the input in the markup; the toggle's aria-controls must still name the input. */
export function ToggleFirst(): JsxChild {
  return (
    <PasswordToggleField>
      <PasswordToggleField.Toggle data-testid="toggle" />
      <PasswordToggleField.Input data-testid="input" id="account-password" />
    </PasswordToggleField>
  );
}

/** The input's id follows a prop, so a change must reach the toggle's aria-controls. */
export function Reidentified(props: { readonly id: string }): JsxChild {
  return (
    <PasswordToggleField>
      <PasswordToggleField.Input data-testid="input" id={props.id} />
      <PasswordToggleField.Toggle data-testid="toggle" />
    </PasswordToggleField>
  );
}

/** The input is rendered only while `present` is true. */
export function Removable(props: { readonly present: boolean }): JsxChild {
  return (
    <PasswordToggleField>
      {props.present ? <PasswordToggleField.Input data-testid="input" id="gone" /> : null}
      <PasswordToggleField.Toggle data-testid="toggle" />
    </PasswordToggleField>
  );
}
