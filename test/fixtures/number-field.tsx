// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { NumberField } from "../../src/index";

type Props = Record<string, unknown>;

/** A number field with both buttons; every NumberField prop can be passed through `props`. */
export function Demo(props: Props): JsxChild {
  return (
    <NumberField data-testid="field" {...props}>
      <NumberField.Decrement data-testid="decrement" aria-label="Decrease">
        -
      </NumberField.Decrement>
      <NumberField.Input
        data-testid="input"
        aria-label="Quantity"
        {...(props["inputProps"] as object | undefined)}
      />
      <NumberField.Increment data-testid="increment" aria-label="Increase">
        +
      </NumberField.Increment>
    </NumberField>
  );
}

/** Just the input, with an application id. */
export function CustomId(props: Props): JsxChild {
  return (
    <NumberField data-testid="field" {...props}>
      <NumberField.Input data-testid="input" id="my-input" aria-label="Quantity" />
      <NumberField.Increment data-testid="increment" aria-label="Increase" />
    </NumberField>
  );
}

/** A field inside a real form with a reset and a submit button. */
export function InForm(props: Props): JsxChild {
  return (
    <form data-testid="form" id="f1">
      <NumberField name="qty" {...props}>
        <NumberField.Input data-testid="input" aria-label="Quantity" />
      </NumberField>
      <button type="reset" data-testid="reset">
        reset
      </button>
    </form>
  );
}

/** A field attached to a form it is not inside of. */
export function Associated(props: Props): JsxChild {
  return (
    <div>
      <NumberField name="amount" form="f2" {...props}>
        <NumberField.Input data-testid="input" aria-label="Amount" />
      </NumberField>
      <form data-testid="form" id="f2" />
    </div>
  );
}

/** A button outside any field (throws). */
export function Orphan(): JsxChild {
  return <NumberField.Increment aria-label="x" />;
}

/** The steppers without an aria-label of their own: they take the default (or the messages) names. */
export function Unlabeled(props: Props): JsxChild {
  return (
    <NumberField data-testid="field" {...props}>
      <NumberField.Decrement data-testid="decrement">-</NumberField.Decrement>
      <NumberField.Input data-testid="input" aria-label="Quantity" />
      <NumberField.Increment data-testid="increment">+</NumberField.Increment>
    </NumberField>
  );
}
