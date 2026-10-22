import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTarget } from "../utils/index";
import { SliderRange } from "./range";
import { type SliderProps, SliderRoot } from "./root";
import { SliderThumb } from "./thumb";
import { SliderTrack } from "./track";

export type { SliderContextValue } from "./context";
export { sliderContext } from "./context";
export type {
  KeyAction,
  NextValuesOptions,
  PointerRect,
  SlideDirection,
  SlideEdges,
} from "./logic";
export {
  clamp as clampSliderValue,
  getClosestThumbIndex,
  getDecimalCount,
  getKeyAction,
  getKeyValue,
  getNextSortedValues,
  getSlideDirection,
  getSlideEdges,
  getThumbInBoundsOffset,
  getThumbLabel,
  getValueFromPointer,
  roundToDecimals,
  snapToStep,
  valueToPercent,
} from "./logic";
export type { SliderRangeProps } from "./range";
export type { SliderOwnProps, SliderProps } from "./root";
export type { SliderThumbProps } from "./thumb";
export type { SliderTrackProps } from "./track";
export { SliderRange, SliderRoot, SliderThumb, SliderTrack };

/**
 * The slider primitive: `Slider`, `Slider.Track`, `Slider.Range` and `Slider.Thumb`. Each part is
 * also exported by name (`SliderRoot`, `SliderTrack`, ...) for tree shaking.
 *
 * Keyboard (on each thumb): Arrow keys move one step, with the arrow that raises the value following
 * direction, orientation and `inverted`; Shift+Arrow, PageUp and PageDown move ten steps; Home and End
 * go to the minimum and maximum. Pointer: a press on the track moves the nearest thumb there, and the
 * drag continues outside the slider. ARIA: each thumb is a `role="slider"` with `aria-valuemin`,
 * `aria-valuenow`, `aria-valuemax` and `aria-orientation`. Name each thumb with `aria-label` or
 * `aria-labelledby`; two thumbs get the default names Minimum and Maximum.
 *
 * @example
 * import { Slider } from "@shadow-js/primitives";
 *
 * <Slider defaultValue={[20, 80]} minStepsBetweenThumbs={5}>
 *   <Slider.Track><Slider.Range /></Slider.Track>
 *   <Slider.Thumb />
 *   <Slider.Thumb />
 * </Slider>;
 * @see {@link SliderRoot}
 * @see {@link SliderThumb}
 * @since 1.0.0
 */
export const Slider: typeof SliderRoot & {
  readonly Track: typeof SliderTrack;
  readonly Range: typeof SliderRange;
  readonly Thumb: typeof SliderThumb;
} = Object.assign(
  <T extends PolymorphicTarget = "span">(props: SliderProps<T>): JsxChild => SliderRoot(props),
  { Track: SliderTrack, Range: SliderRange, Thumb: SliderThumb },
);
