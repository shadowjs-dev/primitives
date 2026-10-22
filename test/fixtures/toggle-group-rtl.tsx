// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { Direction } from "../../src/index";
import { DirectionProvider, ToggleGroup } from "../../src/index";

type Props = Record<string, unknown>;

/** Three Arabic-labeled items; every group prop passes through `props`, so `type` picks single or multiple. */
export function Arabic(props: Props): JsxChild {
  return (
    <ToggleGroup data-testid="group" aria-label="نمط" {...(props as { type: "single" })}>
      <ToggleGroup.Item value="a" data-testid="a">
        واحد
      </ToggleGroup.Item>
      <ToggleGroup.Item value="b" data-testid="b">
        اثنان
      </ToggleGroup.Item>
      <ToggleGroup.Item value="c" data-testid="c">
        ثلاثة
      </ToggleGroup.Item>
    </ToggleGroup>
  );
}

/** Two single-type items with no dir prop, inside a DirectionProvider set to `props.dir`. */
export function Provided(props: { dir: Direction }): JsxChild {
  return (
    <DirectionProvider dir={props.dir}>
      <ToggleGroup data-testid="group" aria-label="نمط" type="single">
        <ToggleGroup.Item value="a" data-testid="a">
          واحد
        </ToggleGroup.Item>
        <ToggleGroup.Item value="b" data-testid="b">
          اثنان
        </ToggleGroup.Item>
      </ToggleGroup>
    </DirectionProvider>
  );
}
