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
import { getSlideEdges, valueToPercent } from "./logic";

/**
 * Props of {@link SliderRange}.
 * @see {@link SliderRange}
 * @see {@link Slider}
 * @since 1.0.0
 */
export type SliderRangeProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The filled part of the track: from the track's start (one thumb) or from the lowest thumb to
 * the highest (several). Its inline style sets the two edges in percent (`left`/`right`, or
 * `bottom`/`top` when vertical), aware of RTL and `inverted`; positioning is left to the stylesheet.
 * It carries `data-orientation` and `data-disabled` (value `""`, while disabled). Keyboard: none; the
 * range handles no keys. ARIA: it sets no role or ARIA attribute; the thumbs are the `role="slider"`
 * elements that take the keys (see `Slider.Thumb`).
 *
 * @param props See {@link SliderRangeProps}.
 * @returns The rendered range.
 * @throws When rendered outside a `Slider` root.
 * @example
 * import { Slider } from "@shadow-js/primitives";
 *
 * <Slider.Range class="absolute h-full rounded bg-primary" />;
 * @see {@link SliderTrack}
 * @since 1.0.0
 */
export function SliderRange<T extends PolymorphicTarget = "span">(
  props: SliderRangeProps<T>,
): JsxChild {
  const context = sliderContext.use("Slider.Range");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return context.orientation();
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      get style() {
        const percents = context
          .values()
          .map((value) => valueToPercent(value, context.min(), context.max()));
        const edges = getSlideEdges(context.slideDirection());
        const from = percents.length > 1 ? Math.min(...percents) : 0;
        const to = percents.length > 0 ? 100 - Math.max(...percents) : 100;
        return { [edges.start]: `${from}%`, [edges.end]: `${to}%` };
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "span"} {...merged} />;
}
