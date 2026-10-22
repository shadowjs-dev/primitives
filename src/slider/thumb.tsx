import {
  onCleanup,
  onMount,
  splitProps,
  untrack,
  useEffect,
  useMemo,
  useSignal,
} from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  composeRefs,
  HiddenInput,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { sliderContext } from "./context";
import {
  getKeyAction,
  getKeyValue,
  getSlideEdges,
  getThumbInBoundsOffset,
  getThumbLabel,
  valueToPercent,
} from "./logic";

/**
 * Props of {@link SliderThumb}.
 * @see {@link SliderThumb}
 * @see {@link Slider}
 * @since 1.0.0
 */
export type SliderThumbProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** Measured size of the thumb in pixels. */
interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * One draggable handle. It is a focusable `role="slider"` with `aria-valuemin`, `aria-valuenow`,
 * `aria-valuemax` and `aria-orientation`, placed on the track with an inline style (a percentage
 * of the track plus a pixel offset derived from the thumb's own measured size, so it stays inside
 * the track at both ends). Its index is its position in the document, so thumbs keep their index
 * and never cross: thumb `i` shows `values[i]`.
 *
 * Give every thumb an accessible name with `aria-label` or `aria-labelledby`. A range with two
 * thumbs is named "Minimum" and "Maximum" by default and more thumbs "Value i of n"; a lone thumb
 * without a name warns in development.
 *
 * Keys: Arrow keys one step (which arrow raises the value follows RTL, `inverted` and the
 * orientation), Shift+Arrow and PageUp/PageDown ten steps, Home and End the extremes.
 *
 * Data attributes: `data-orientation` and `data-disabled` (value `""`, while disabled). While disabled
 * the thumb is out of the tab order and has `aria-disabled="true"`.
 *
 * @param props See {@link SliderThumbProps}.
 * @returns The thumb and its hidden form input.
 * @throws When rendered outside a `Slider` root.
 * @example
 * import { Slider } from "@shadow-js/primitives";
 *
 * <Slider.Thumb aria-label="Volume" class="thumb" />;
 * @see {@link SliderRoot}
 * @since 1.0.0
 */
export function SliderThumb<T extends PolymorphicTarget = "span">(
  props: SliderThumbProps<T>,
): JsxChild {
  const context = sliderContext.use("Slider.Thumb");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onKeyDown"]);
  const provisional = context.claimIndex();
  let element: HTMLElement | undefined;

  // Before the thumb registered (server render, first client render) its index is the render order.
  const index = useMemo((): number => {
    const found = context.thumbs.items().findIndex((item) => item.element === element);
    return found === -1 ? provisional : found;
  });
  const value = (): number | undefined => context.values()[index()];

  const [size, setSize] = useSignal<Size | undefined>(undefined);
  onMount(() => {
    const node = element;
    if (node === undefined) return undefined;
    const unregister = context.thumbs.register(node, null);
    const measure = (): void => {
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      setSize((previous) =>
        previous !== undefined && previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(node);
    if (__DEV__) {
      const labeled = node.hasAttribute("aria-label") || node.hasAttribute("aria-labelledby");
      if (!labeled && untrack(context.values).length === 1) {
        console.warn(
          "[primitives SLIDER_LABEL] <Slider.Thumb> has no accessible name. Pass aria-label or aria-labelledby.",
        );
      }
    }
    onCleanup(() => {
      observer?.disconnect();
      unregister();
    });
    return undefined;
  });

  // A native form reset puts the hidden input back to its default value; keeping that default in
  // step with the slider's makes the reset and the slider agree whatever the order of events.
  useEffect(() => {
    const hidden = element?.nextElementSibling;
    if (hidden instanceof HTMLInputElement) {
      hidden.defaultValue = String(context.defaultValues()[index()] ?? context.min());
    }
  });

  const inputName = (): string | undefined => {
    const name = context.name();
    if (name === undefined) return undefined;
    return context.values().length > 1 ? `${name}[]` : name;
  };

  const merged = mergeElementProps(
    {
      role: "slider",
      get tabindex() {
        return context.disabled() ? undefined : 0;
      },
      get "aria-valuemin"() {
        return context.min();
      },
      get "aria-valuenow"() {
        return value();
      },
      get "aria-valuemax"() {
        return context.max();
      },
      get "aria-orientation"() {
        return context.orientation();
      },
      get "aria-disabled"() {
        return context.disabled() ? true : undefined;
      },
      get "aria-label"() {
        if (rest["aria-labelledby"] !== undefined) return undefined;
        return getThumbLabel(index(), context.values().length);
      },
      get "data-orientation"() {
        return context.orientation();
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      get style() {
        const current = value();
        const edges = getSlideEdges(context.slideDirection());
        const percent = valueToPercent(current ?? context.min(), context.min(), context.max());
        const measured = size();
        const extent =
          measured === undefined ? undefined : edges.vertical ? measured.height : measured.width;
        const offset =
          extent === undefined ? 0 : getThumbInBoundsOffset(extent, percent, edges.sign);
        // `translate` (not `transform`) so an application's own transform on the thumb cannot move it off the track.
        return {
          position: "absolute",
          [edges.start]: `calc(${percent}% + ${offset}px)`,
          translate: edges.vertical ? "0 50%" : "-50% 0",
          display: current === undefined ? "none" : undefined,
        };
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => {
        element = node;
      }),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown,
        (event: KeyboardEvent) => {
          // Alt+Arrow is "back" in browsers, Ctrl/Cmd+Arrow belongs to the platform: leave them alone.
          if (context.disabled() || event.altKey || event.ctrlKey || event.metaKey) return;
          const action = getKeyAction(event.key, event.shiftKey, context.slideDirection());
          if (action === undefined) return;
          event.preventDefault();
          const current = value();
          if (current === undefined) return;
          context.updateValue(
            index(),
            getKeyValue(action, current, context.min(), context.max(), context.step()),
            true,
          );
        },
      ),
    },
  );

  return (
    <>
      <Polymorphic as={own.as ?? "span"} {...merged} />
      <HiddenInput
        type="text"
        name={inputName()}
        value={value() ?? ""}
        disabled={context.disabled()}
        form={context.form()}
        onReset={() => context.reset()}
      />
    </>
  );
}
