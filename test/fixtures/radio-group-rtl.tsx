// biome-ignore-all lint/a11y: test fixture exercising headless parts without labels
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { Direction } from "../../src/index";
import { DirectionProvider, RadioGroup } from "../../src/index";

type Props = Record<string, unknown>;

/** Three Arabic-labeled items; every group prop passes through `props`. */
export function Arabic(props: Props): JsxChild {
  return (
    <RadioGroup data-testid="group" aria-label="خطة" {...props}>
      <RadioGroup.Item value="a" data-testid="a">
        <RadioGroup.Indicator data-testid="ia" />
        واحد
      </RadioGroup.Item>
      <RadioGroup.Item value="b" data-testid="b">
        <RadioGroup.Indicator data-testid="ib" />
        اثنان
      </RadioGroup.Item>
      <RadioGroup.Item value="c" data-testid="c">
        <RadioGroup.Indicator data-testid="ic" />
        ثلاثة
      </RadioGroup.Item>
    </RadioGroup>
  );
}

/** Two items with no dir prop, inside a DirectionProvider set to `props.dir`. */
export function Provided(props: { dir: Direction }): JsxChild {
  return (
    <DirectionProvider dir={props.dir}>
      <RadioGroup data-testid="group" aria-label="خطة">
        <RadioGroup.Item value="a" data-testid="a">
          <RadioGroup.Indicator data-testid="ia" />
          واحد
        </RadioGroup.Item>
        <RadioGroup.Item value="b" data-testid="b">
          <RadioGroup.Indicator data-testid="ib" />
          اثنان
        </RadioGroup.Item>
      </RadioGroup>
    </DirectionProvider>
  );
}
