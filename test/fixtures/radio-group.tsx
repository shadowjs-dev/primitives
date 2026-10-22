// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { RadioGroup } from "../../src/index";

type Props = Record<string, unknown>;

/** Three items, the middle one optionally disabled; every group prop can be passed through `props`. */
export function Demo(props: Props): JsxChild {
  return (
    <RadioGroup data-testid="group" aria-label="Plan" {...props}>
      <RadioGroup.Item value="a" data-testid="a">
        <RadioGroup.Indicator data-testid="ia" />
        A
      </RadioGroup.Item>
      <RadioGroup.Item value="b" data-testid="b" disabled={props["disableB"] === true}>
        <RadioGroup.Indicator data-testid="ib" />
        B
      </RadioGroup.Item>
      <RadioGroup.Item value="c" data-testid="c">
        <RadioGroup.Indicator data-testid="ic" forceMount />
        C
      </RadioGroup.Item>
    </RadioGroup>
  );
}

/** A group with a page button before and after, to prove the group is one tab stop. */
export function Surrounded(props: Props): JsxChild {
  return (
    <div>
      <button type="button" data-testid="before">
        before
      </button>
      <Demo {...props} />
      <button type="button" data-testid="after">
        after
      </button>
    </div>
  );
}

/** The group inside a real form, with a text field and a reset button. */
export function InForm(props: Props): JsxChild {
  return (
    <form data-testid="form" id="f1" onSubmit={props["onSubmit"] as (event: Event) => void}>
      <input name="q" data-testid="text" />
      <Demo name="plan" {...props} />
      <button type="reset" data-testid="reset">
        reset
      </button>
    </form>
  );
}

/** The group outside the form, attached with `form="id"`. */
export function Associated(props: Props): JsxChild {
  return (
    <div>
      <Demo name="plan" form="f2" {...props} />
      <form data-testid="form" id="f2" />
    </div>
  );
}

/** Items rendered as divs. */
export function AsDiv(props: Props): JsxChild {
  return (
    <RadioGroup as="section" data-testid="group" {...props}>
      <RadioGroup.Item as="div" value="a" data-testid="a" />
      <RadioGroup.Item as="div" value="b" data-testid="b" />
    </RadioGroup>
  );
}

/** An item outside a group (throws). */
export function Orphan(): JsxChild {
  return <RadioGroup.Item value="a" />;
}

/** An indicator outside an item (throws). */
export function OrphanIndicator(): JsxChild {
  return (
    <RadioGroup>
      <RadioGroup.Indicator />
    </RadioGroup>
  );
}
