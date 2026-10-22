import { onCleanup, onMount, splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  composeRefs,
  createCollection,
  type Direction,
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useControllableState,
  useRefSignal,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import { type SliderContextValue, sliderContext } from "./context";
import {
  getClosestThumbIndex,
  getNextSortedValues,
  getSlideDirection,
  getValueFromPointer,
  type SlideDirection,
} from "./logic";

/**
 * Own props of {@link SliderRoot}.
 *
 * Accessibility: each thumb is a focusable `role="slider"` with `aria-valuemin`, `aria-valuenow`,
 * `aria-valuemax` and `aria-orientation`; keys are handled by the thumbs (see {@link SliderThumb}).
 * The root sets `aria-disabled` while disabled.
 *
 * Data attributes: `data-orientation` (`horizontal` | `vertical`) on the root, track, range and thumbs;
 * `data-disabled` (value `""`) on the root, track, range and thumbs while disabled; `dir` on the root.
 * @see {@link SliderRoot}
 * @see {@link Slider}
 * @since 1.0.0
 */
export interface SliderOwnProps {
  /**
   * Controlled values, one per thumb. Controlled when set (not `undefined`).
   * @default none (uncontrolled when omitted)
   */
  readonly value?: readonly number[] | undefined;
  /**
   * Initial values when uncontrolled.
   * @default `[min]`
   */
  readonly defaultValue?: readonly number[] | undefined;
  /**
   * Called with a copy of the new values on every change (keyboard and pointer).
   * @default none
   */
  readonly onValueChange?: ((value: number[]) => void) | undefined;
  /**
   * Called when the user finishes a change: after a keyboard step and on pointer release.
   * @default none
   */
  readonly onValueCommit?: ((value: number[]) => void) | undefined;
  /**
   * Smallest value.
   * @default `0`
   */
  readonly min?: number | undefined;
  /**
   * Largest value.
   * @default `100`
   */
  readonly max?: number | undefined;
  /**
   * Distance between allowed values.
   * @default `1`
   */
  readonly step?: number | undefined;
  /**
   * Minimum distance between neighboring thumbs, in steps.
   * @default `0`
   */
  readonly minStepsBetweenThumbs?: number | undefined;
  /**
   * Axis of the slider. Vertical sliders run from the bottom (or from the top when `inverted`).
   * @default `"horizontal"`
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Reading direction. A right-to-left slider grows leftwards.
   * @default the surrounding direction (the nearest direction provider, else the document's `dir`, else `"ltr"`)
   */
  readonly dir?: Direction | undefined;
  /**
   * Runs the slider the other way (maximum at the start edge).
   * @default `false`
   */
  readonly inverted?: boolean | undefined;
  /**
   * Disables pointer and keyboard interaction and the form inputs.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
  /**
   * Form field name. One thumb submits `name`, several submit `name[]` once per thumb.
   * @default none
   */
  readonly name?: string | undefined;
  /**
   * Id of the `<form>` the slider belongs to when it is not a descendant of one.
   * @default none
   */
  readonly form?: string | undefined;
}

/**
 * Props of {@link SliderRoot}: the own props and the attributes of the chosen element.
 * @see {@link SliderRoot}
 * @see {@link Slider}
 * @since 1.0.0
 */
export type SliderProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  SliderOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const sameNumbers = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((entry, index) => entry === b[index]);

/** What the pointer is doing while a drag is in progress. */
interface Drag {
  readonly pointerId: number;
  readonly index: number;
  readonly startValues: readonly number[];
}

/**
 * An input where the user selects a value, or several for a range, by dragging a thumb along a
 * track. Follows the WAI-ARIA slider and multi-thumb slider patterns: every thumb is a
 * `role="slider"` focusable element; arrow keys move one step, Shift+Arrow and PageUp/PageDown ten,
 * Home and End jump to the ends; a press on the track moves the nearest thumb there and the drag
 * continues outside the slider (pointer capture).
 *
 * Controlled with `value` / `onValueChange`, or uncontrolled with `defaultValue`. With a `name` it
 * renders one hidden input per thumb so the slider takes part in native forms (reset restores the
 * default value).
 *
 * @param props See {@link SliderProps}.
 * @returns The rendered slider root.
 * @example
 * import { Slider } from "@shadow-js/primitives";
 *
 * <Slider defaultValue={[25]} max={100} step={5}>
 *   <Slider.Track>
 *     <Slider.Range />
 *   </Slider.Track>
 *   <Slider.Thumb aria-label="Volume" />
 * </Slider>;
 * @see {@link Slider}
 * @since 1.0.0
 */
export function SliderRoot<T extends PolymorphicTarget = "span">(props: SliderProps<T>): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "value",
    "defaultValue",
    "onValueChange",
    "onValueCommit",
    "min",
    "max",
    "step",
    "minStepsBetweenThumbs",
    "orientation",
    "dir",
    "inverted",
    "disabled",
    "name",
    "form",
    "onPointerDown",
    "onPointerMove",
    "onPointerUp",
  ]);
  const min = (): number => (own.min as number | undefined) ?? 0;
  const max = (): number => (own.max as number | undefined) ?? 100;
  const step = (): number => (own.step as number | undefined) ?? 1;
  const minSteps = (): number => (own.minStepsBetweenThumbs as number | undefined) ?? 0;
  const orientation = (): Orientation =>
    own.orientation === "vertical" ? "vertical" : "horizontal";
  const inverted = (): boolean => own.inverted === true;
  const disabled = (): boolean => own.disabled === true;
  const [root, setRoot] = useRefSignal<HTMLElement>();
  // The root carries its own dir attribute, so the search starts above it, at the parent.
  const dir = useDirectionAround(
    () => own.dir as Direction | undefined,
    () => root()?.parentElement,
  );
  const slideDirection = (): SlideDirection => getSlideDirection(orientation(), dir(), inverted());
  const defaultValues = (): readonly number[] =>
    (own.defaultValue as readonly number[] | undefined) ?? [min()];

  const [values, setValues] = useControllableState<readonly number[]>({
    value: () => own.value as readonly number[] | undefined,
    defaultValue: defaultValues,
    onChange: () => {
      const handler = own.onValueChange as ((value: number[]) => void) | undefined;
      if (handler === undefined) return undefined;
      return (next: readonly number[]) => handler([...next]);
    },
    equals: sameNumbers,
    name: "Slider value",
  });

  const thumbs = createCollection<null>();
  let rendered = 0;
  const commit = (next: readonly number[]): void => {
    untrack(() => (own.onValueCommit as ((value: number[]) => void) | undefined)?.([...next]));
  };

  const updateValue = (index: number, next: number, andCommit: boolean): boolean => {
    const previous = untrack(values);
    const updated = getNextSortedValues(previous, next, index, {
      min: min(),
      max: max(),
      step: step(),
      minStepsBetweenThumbs: minSteps(),
    });
    if (sameNumbers(previous, updated)) return false;
    setValues(updated);
    if (andCommit) commit(updated);
    return true;
  };

  const context: SliderContextValue = {
    values,
    defaultValues,
    min,
    max,
    step,
    minStepsBetweenThumbs: minSteps,
    orientation,
    dir,
    inverted,
    disabled,
    slideDirection,
    name: () => own.name as string | undefined,
    form: () => own.form as string | undefined,
    thumbs,
    claimIndex: () => {
      const index = rendered;
      rendered += 1;
      return index;
    },
    updateValue,
    reset: () => setValues(untrack(defaultValues)),
  };

  let element: HTMLElement | undefined;
  let drag: Drag | undefined;

  const valueAt = (event: PointerEvent): number | undefined => {
    if (element === undefined) return undefined;
    const rect = element.getBoundingClientRect();
    const direction = untrack(slideDirection);
    const vertical = direction === "from-bottom" || direction === "from-top";
    return getValueFromPointer(
      vertical ? event.clientY : event.clientX,
      rect,
      min(),
      max(),
      step(),
      direction,
    );
  };

  const focusThumb = (index: number): void => {
    thumbs.getItems()[index]?.element.focus();
  };

  const endDrag = (andCommit: boolean): void => {
    const finished = drag;
    if (finished === undefined) return;
    drag = undefined;
    if (element?.hasPointerCapture(finished.pointerId) === true) {
      element.releasePointerCapture(finished.pointerId);
    }
    if (!andCommit) return;
    const now = untrack(values);
    if (!sameNumbers(now, finished.startValues)) commit(now);
  };
  onCleanup(() => endDrag(false));
  // Not events the framework delegates, and listeners it binds natively are not removed when the
  // element is disposed, so these two are added and removed here.
  onMount(() => {
    const node = element;
    // Set after mount: a ref runs before the root is inserted, so its ancestors are not known yet.
    setRoot(node);
    if (node === undefined) return;
    const end = (event: Event): void => {
      if (drag !== undefined && (event as PointerEvent).pointerId === drag.pointerId) endDrag(true);
    };
    node.addEventListener("pointercancel", end);
    node.addEventListener("lostpointercapture", end);
    onCleanup(() => {
      node.removeEventListener("pointercancel", end);
      node.removeEventListener("lostpointercapture", end);
    });
  });

  const onPointerDown = (event: PointerEvent): void => {
    if (disabled() || event.button !== 0 || element === undefined) return;
    // A second finger or button while dragging must not restart the drag.
    if (drag !== undefined) return;
    const target = event.target instanceof Element ? event.target : null;
    const thumbElement = target?.closest<HTMLElement>('[role="slider"]') ?? null;
    const startValues = untrack(values);
    const grabbed = thumbElement !== null && thumbs.has(thumbElement);
    const value = grabbed ? undefined : valueAt(event);
    if (!grabbed && value === undefined) return;
    const index =
      thumbElement !== null && grabbed
        ? thumbs.indexOf(thumbElement)
        : getClosestThumbIndex(startValues, value ?? min());
    element.setPointerCapture(event.pointerId);
    // The browser would focus the root (or nothing) on mousedown; a thumb is focused by hand.
    event.preventDefault();
    drag = { pointerId: event.pointerId, index, startValues };
    // A press on a thumb only grabs it; a press elsewhere moves the nearest thumb to the pointer.
    if (value !== undefined) updateValue(index, value, false);
    focusThumb(index);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (drag === undefined || event.pointerId !== drag.pointerId) return;
    const value = valueAt(event);
    if (value !== undefined) updateValue(drag.index, value, false);
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (drag === undefined || event.pointerId !== drag.pointerId) return;
    endDrag(true);
  };

  const merged = mergeElementProps(
    {
      get dir() {
        return dir();
      },
      get "aria-disabled"() {
        return disabled() ? true : undefined;
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      get "data-orientation"() {
        return orientation();
      },
      // Without it the browser claims touch drags for scrolling and the thumb never follows.
      style: { touchAction: "none" },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => {
        element = node;
      }),
      onPointerDown: composeEventHandlers(() => own.onPointerDown, onPointerDown),
      onPointerMove: composeEventHandlers(() => own.onPointerMove, onPointerMove),
      onPointerUp: composeEventHandlers(() => own.onPointerUp, onPointerUp),
    },
  );

  return (
    <sliderContext.Provider value={context}>
      <Polymorphic as={own.as ?? "span"} {...merged} />
    </sliderContext.Provider>
  );
}
