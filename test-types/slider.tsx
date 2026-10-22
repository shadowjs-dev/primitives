/**
 * Compile-time checks for `Slider`. Nothing here runs: `tsc -p packages/primitives/tsconfig.json`
 * must pass, and every `@ts-expect-error` line must be an error.
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Slider } from "../src/index";

export const valid: JsxChild = (
  <Slider
    value={[1, 2]}
    defaultValue={[1]}
    onValueChange={(value: number[]) => void value}
    onValueCommit={(value: number[]) => void value}
    min={0}
    max={10}
    step={0.5}
    minStepsBetweenThumbs={1}
    orientation="vertical"
    dir="rtl"
    inverted
    disabled
    name="n"
    form="f"
    class="x"
  >
    <Slider.Track class="track">
      <Slider.Range class="range" />
    </Slider.Track>
    <Slider.Thumb aria-label="Low" class="thumb" />
  </Slider>
);

// onValueChange receives number[] (inferred, no annotation needed).
export const inferred: JsxChild = <Slider onValueChange={(value) => value.map((n) => n + 1)} />;

// @ts-expect-error the value is a list of numbers, one per thumb
export const scalarValue: JsxChild = <Slider value={5} />;

// @ts-expect-error orientation is a closed union
export const badOrientation: JsxChild = <Slider orientation="diagonal" />;

// @ts-expect-error dir is "ltr" | "rtl"
export const badDir: JsxChild = <Slider dir="auto" />;

const takesString = (value: string[]): void => void value;
// @ts-expect-error the callback receives numbers
export const wrongCallback: JsxChild = <Slider onValueChange={takesString} />;

// @ts-expect-error step is a number
export const stringStep: JsxChild = <Slider step="1" />;

// @ts-expect-error unknown props are rejected
export const unknownProp: JsxChild = <Slider notAProp="x" />;

// `as` retargets the attribute types of every part.
export const asAnchor: JsxChild = <Slider as="a" href="/x" />;
// @ts-expect-error the default span has no href
export const spanHref: JsxChild = <Slider href="/x" />;
export const thumbAsButton: JsxChild = <Slider.Thumb as="button" type="button" />;
