// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Switch } from "../../src/index";

type Props = Record<string, unknown>;

/** A bare switch; every Switch prop can be passed through `props`. */
export function Demo(props: Props): JsxChild {
  return (
    <Switch data-testid="switch" {...props}>
      <Switch.Thumb data-testid="thumb" />
    </Switch>
  );
}

/** A switch inside a real form, plus a submit and a reset button. */
export function InForm(props: Props): JsxChild {
  return (
    <form data-testid="form" id="f1">
      <Switch data-testid="switch" name="airplane" {...props}>
        <Switch.Thumb />
      </Switch>
      <button type="reset" data-testid="reset">
        reset
      </button>
    </form>
  );
}

/** A switch outside the form, attached with `form="id"`. */
export function Associated(props: Props): JsxChild {
  return (
    <div>
      <Switch data-testid="switch" name="wifi" form="f2" {...props} />
      <form data-testid="form" id="f2" />
    </div>
  );
}

/** A switch rendered as a div. */
export function AsDiv(props: Props): JsxChild {
  return <Switch as="div" data-testid="switch" {...props} />;
}

/** A thumb outside any switch (throws). */
export function Orphan(): JsxChild {
  return <Switch.Thumb />;
}
