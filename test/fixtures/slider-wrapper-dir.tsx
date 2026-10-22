// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Slider } from "../../src/index";

type Props = Record<string, unknown>;

/** A one-thumb slider inside a wrapper with `dir="rtl"`; every Slider prop can be passed through `props`. */
export function InRtlWrapper(props: Props): JsxChild {
  return (
    <div data-testid="wrapper" dir="rtl">
      <Slider data-testid="slider" {...props}>
        <Slider.Track data-testid="track">
          <Slider.Range data-testid="range" />
        </Slider.Track>
        <Slider.Thumb data-testid="thumb" aria-label="volume" />
      </Slider>
    </div>
  );
}
