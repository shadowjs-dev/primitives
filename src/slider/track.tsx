import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { sliderContext } from "./context";

/**
 * Props of {@link SliderTrack}.
 * @see {@link SliderTrack}
 * @see {@link Slider}
 * @since 1.0.0
 */
export type SliderTrackProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The rail the thumbs travel along. Renders a `span` with `data-orientation` and `data-disabled`
 * (value `""`, while disabled); the application styles it (it normally is `position: relative`). Keyboard: none; the track handles no keys. ARIA: it sets no
 * role or ARIA attribute; the thumbs (see `Slider.Thumb`) do.
 *
 * @param props See {@link SliderTrackProps}.
 * @returns The rendered track.
 * @throws When rendered outside a `Slider` root.
 * @example
 * import { Slider } from "@shadow-js/primitives";
 *
 * <Slider.Track class="track"><Slider.Range class="range" /></Slider.Track>;
 * @see {@link SliderRange}
 * @since 1.0.0
 */
export function SliderTrack<T extends PolymorphicTarget = "span">(
  props: SliderTrackProps<T>,
): JsxChild {
  const context = sliderContext.use("Slider.Track");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return context.orientation();
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "span"} {...merged} />;
}
