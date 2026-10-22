// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Slider } from "../../src/index";

type Props = Record<string, unknown>;

/** A one-thumb slider with an Arabic thumb label; every Slider prop can be passed through `props`. */
export function Arabic(props: Props): JsxChild {
  return (
    <Slider data-testid="slider" {...props}>
      <Slider.Track data-testid="track">
        <Slider.Range data-testid="range" />
      </Slider.Track>
      <Slider.Thumb data-testid="thumb" aria-label="مستوى الصوت" />
    </Slider>
  );
}
