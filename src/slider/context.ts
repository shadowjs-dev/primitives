import type { Accessor } from "@shadow-js/core";
import {
  type Collection,
  createPartContext,
  type Direction,
  type Orientation,
  type PartContext,
} from "../utils/index";
import type { SlideDirection } from "./logic";

/**
 * What every slider part reads from its root.
 * @see {@link SliderRoot}
 * @internal
 */
export interface SliderContextValue {
  /** The thumb values, one per thumb. Tracked. */
  readonly values: Accessor<readonly number[]>;
  /** The values a form reset restores. */
  readonly defaultValues: Accessor<readonly number[]>;
  readonly min: Accessor<number>;
  readonly max: Accessor<number>;
  readonly step: Accessor<number>;
  readonly minStepsBetweenThumbs: Accessor<number>;
  readonly orientation: Accessor<Orientation>;
  readonly dir: Accessor<Direction>;
  readonly inverted: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  /** Where the minimum sits, derived from orientation, direction and `inverted`. */
  readonly slideDirection: Accessor<SlideDirection>;
  readonly name: Accessor<string | undefined>;
  readonly form: Accessor<string | undefined>;
  /** The thumbs in document order. */
  readonly thumbs: Collection<null>;
  /**
   * The index a thumb has before it registered (server render and first client render): the order
   * in which thumbs were rendered. Replaced by the document-order index once mounted.
   */
  readonly claimIndex: () => number;
  /**
   * Moves one thumb. The value is snapped and held between its neighbors. Returns whether
   * anything changed. `commit` also reports through `onValueCommit` (keyboard).
   */
  readonly updateValue: (index: number, next: number, commit: boolean) => boolean;
  /** Restores `defaultValues` (form reset). */
  readonly reset: () => void;
}

/**
 * The context every slider part reads its root from. Exposed for building custom parts on top of
 * the slider; use the parts themselves otherwise. Reading it outside a `Slider` throws.
 *
 * @example
 * import { sliderContext } from "@shadow-js/primitives";
 *
 * export function ValueReadout() {
 *   const slider = sliderContext.use("ValueReadout");
 *   return <output>{slider.values().join(", ")}</output>;
 * }
 * @see {@link Slider}
 * @since 1.0.0
 */
export const sliderContext: PartContext<SliderContextValue> =
  createPartContext<SliderContextValue>("Slider");
