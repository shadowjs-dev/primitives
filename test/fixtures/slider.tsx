// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Slider } from "../../src/index";

type Props = Record<string, unknown>;

/** A one-thumb slider; every Slider prop can be passed through `props`. */
export function Demo(props: Props): JsxChild {
  return (
    <Slider data-testid="slider" {...props}>
      <Slider.Track data-testid="track">
        <Slider.Range data-testid="range" />
      </Slider.Track>
      <Slider.Thumb data-testid="thumb" aria-label="Volume" />
    </Slider>
  );
}

/** A two-thumb range slider with the default Minimum / Maximum names. */
export function Range(props: Props): JsxChild {
  return (
    <Slider data-testid="slider" {...props}>
      <Slider.Track data-testid="track">
        <Slider.Range data-testid="range" />
      </Slider.Track>
      <Slider.Thumb data-testid="thumb-0" />
      <Slider.Thumb data-testid="thumb-1" />
    </Slider>
  );
}

/** Three thumbs. */
export function Triple(props: Props): JsxChild {
  return (
    <Slider data-testid="slider" {...props}>
      <Slider.Track>
        <Slider.Range />
      </Slider.Track>
      <Slider.Thumb data-testid="thumb-0" />
      <Slider.Thumb data-testid="thumb-1" />
      <Slider.Thumb data-testid="thumb-2" />
    </Slider>
  );
}

/** A slider whose single thumb has no name (dev warning). */
export function Unnamed(props: Props): JsxChild {
  return (
    <Slider data-testid="slider" {...props}>
      <Slider.Thumb data-testid="thumb" />
    </Slider>
  );
}

/** Sliders inside a real form with a reset button. */
export function InForm(props: Props): JsxChild {
  return (
    <form data-testid="form" id="f1">
      <Slider data-testid="slider" name="volume" {...props}>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb data-testid="thumb-0" aria-label="Low" />
        {props["second"] === true ? <Slider.Thumb data-testid="thumb-1" aria-label="High" /> : null}
      </Slider>
      <button type="reset" data-testid="reset">
        reset
      </button>
    </form>
  );
}

/** A slider attached to a form it is not inside of. */
export function Associated(props: Props): JsxChild {
  return (
    <div>
      <Slider name="vol" form="f2" {...props}>
        <Slider.Thumb data-testid="thumb" aria-label="Volume" />
      </Slider>
      <form data-testid="form" id="f2" />
    </div>
  );
}

/** A thumb outside any slider (throws). */
export function Orphan(): JsxChild {
  return <Slider.Thumb />;
}

/** Two thumbs with application names: aria-label on one, aria-labelledby on the other. */
export function Named(props: Props): JsxChild {
  return (
    <div>
      <span id="max-label">Maximum price</span>
      <Slider data-testid="slider" {...props}>
        <Slider.Thumb data-testid="thumb-0" aria-label="Minimum price" />
        <Slider.Thumb data-testid="thumb-1" aria-labelledby="max-label" />
      </Slider>
    </div>
  );
}

/** A thumb with an application keydown handler. */
export function Hooked(props: Props): JsxChild {
  return (
    <Slider data-testid="slider" {...props}>
      <Slider.Thumb data-testid="thumb" aria-label="Volume" onKeyDown={props["onThumbKeyDown"] as (event: KeyboardEvent) => void} />
    </Slider>
  );
}
