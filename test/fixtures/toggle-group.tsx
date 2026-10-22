// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { ToggleGroup } from "../../src/index";

type Props = Record<string, unknown>;

/** Three items, the middle one optionally disabled. `props.type` picks single or multiple. */
export function Demo(props: Props): JsxChild {
  return (
    <ToggleGroup data-testid="group" aria-label="Style" {...(props as { type: "single" })}>
      <ToggleGroup.Item value="a" data-testid="a">
        A
      </ToggleGroup.Item>
      <ToggleGroup.Item value="b" data-testid="b" disabled={props["disableB"] === true}>
        B
      </ToggleGroup.Item>
      <ToggleGroup.Item value="c" data-testid="c">
        C
      </ToggleGroup.Item>
    </ToggleGroup>
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

/** A group rendered as a section with a link item. */
export function Polymorphic(props: Props): JsxChild {
  return (
    <ToggleGroup as="section" data-testid="group" {...(props as { type: "single" })}>
      <ToggleGroup.Item as="a" href="#x" value="a" data-testid="a">
        A
      </ToggleGroup.Item>
    </ToggleGroup>
  );
}

/** An item outside a group (throws). */
export function Orphan(): JsxChild {
  return <ToggleGroup.Item value="a" />;
}
