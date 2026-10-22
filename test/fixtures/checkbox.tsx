// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Checkbox } from "../../src/index";

type Props = Record<string, unknown>;

/** A checkbox with an indicator; every Checkbox prop can be passed through `props`. */
export function Demo(props: Props): JsxChild {
  return (
    <Checkbox data-testid="checkbox" {...props}>
      <Checkbox.Indicator data-testid="indicator">ok</Checkbox.Indicator>
    </Checkbox>
  );
}

/** An indicator that is always mounted. */
export function Forced(props: Props): JsxChild {
  return (
    <Checkbox data-testid="checkbox" {...props}>
      <Checkbox.Indicator data-testid="indicator" forceMount>
        ok
      </Checkbox.Indicator>
    </Checkbox>
  );
}

/** A checkbox inside a real form with a reset button. */
export function InForm(props: Props): JsxChild {
  return (
    <form data-testid="form" id="f1">
      <Checkbox data-testid="checkbox" name="terms" {...props} />
      <button type="reset" data-testid="reset">
        reset
      </button>
    </form>
  );
}

/** A checkbox outside the form, attached with `form="id"`. */
export function Associated(props: Props): JsxChild {
  return (
    <div>
      <Checkbox data-testid="checkbox" name="news" form="f2" {...props} />
      <form data-testid="form" id="f2" />
    </div>
  );
}

/** A form with a text field and a checkbox, to prove Enter does not submit through the checkbox. */
export function Submitting(props: Props): JsxChild {
  return (
    <form data-testid="form" onSubmit={props["onSubmit"] as (event: Event) => void}>
      <input name="q" data-testid="text" />
      <Checkbox data-testid="checkbox" name="terms" />
      <button type="submit">go</button>
    </form>
  );
}

/** A checkbox rendered as a div. */
export function AsDiv(props: Props): JsxChild {
  return <Checkbox as="div" data-testid="checkbox" {...props} />;
}

/** An indicator outside a checkbox (throws). */
export function Orphan(): JsxChild {
  return <Checkbox.Indicator />;
}
