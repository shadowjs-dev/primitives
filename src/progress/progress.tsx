import { type Accessor, onCleanup, splitProps, untrack, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createPartContext,
  mergeElementProps,
  type PartContext,
  type PartRegistration,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useBaseId,
  usePartRegistration,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  defaultValueLabel,
  isValidMax,
  isValidValue,
  type ProgressState,
  progressState,
  resolveMax,
  resolveValue,
} from "./value";

/**
 * What the indicator reads from its progress bar. @internal
 * @see {@link ProgressRoot}
 */
export interface ProgressContextValue {
  readonly value: Accessor<number | null>;
  readonly max: Accessor<number>;
  readonly state: Accessor<ProgressState>;
  /** The formatted value, absent while indeterminate. */
  readonly valueLabel: Accessor<string | undefined>;
  /** @internal */
  readonly labelId: Accessor<string>;
  /** @internal */
  readonly label: PartRegistration;
  /** @internal */
  readonly setLabel: (read: Accessor<string | undefined> | undefined) => void;
}

/**
 * The context a `Progress` root shares with its `Progress.Indicator`. Read it with `use()` from a
 * custom part that sits inside a `Progress`; it throws outside one.
 *
 * @example
 * import { progressContext } from "@shadow-js/primitives";
 *
 * export function ProgressReadout() {
 *   const progress = progressContext.use("ProgressReadout");
 *   return <span>{progress.value() ?? "loading"}</span>;
 * }
 * @since 1.0.0
 * @see {@link ProgressRoot}
 */
export const progressContext: PartContext<ProgressContextValue> =
  createPartContext<ProgressContextValue>("Progress");

/**
 * Own props of {@link Progress}. Accessibility: the bar is a `role="progressbar"` with
 * `aria-valuemin="0"`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext` (the last two left out
 * while indeterminate). Data attributes: `data-state` (`"loading"`, `"complete"` or
 * `"indeterminate"`), `data-max` (always) and `data-value` (left out while indeterminate).
 * @see {@link ProgressRoot}
 * @since 1.0.0
 */
export interface ProgressOwnProps {
  /**
   * The current value, from 0 to `max`. `null` (or omitted) is indeterminate: the work is under
   * way but its extent is unknown. An invalid number falls back to indeterminate with a warning in
   * development.
   * @default null (indeterminate)
   */
  readonly value?: number | null | undefined;
  /**
   * The value at which the work is complete. An invalid one falls back to the default.
   * @default 100
   */
  readonly max?: number | undefined;
  /**
   * Builds the text alternative announced with the value (`aria-valuetext`), called untracked.
   * The same formatter supplies `Progress.Value`.
   * @default the rounded percentage, for example `"40%"`, in the digits of the bar's `lang`
   */
  readonly getValueLabel?: ((value: number, max: number) => string) | undefined;
}

/**
 * Props of {@link Progress}.
 * @see {@link ProgressRoot}
 * @since 1.0.0
 */
export type ProgressProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  ProgressOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Displays how far a task has got (the WAI-ARIA progressbar pattern). Renders a `div` with
 * `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax` and `aria-valuenow` and
 * `aria-valuetext` (the last two are left out while indeterminate), and
 * `data-state="loading" | "complete" | "indeterminate"`, `data-max` (always) and `data-value` (left out while
 * indeterminate). Keyboard: none; the bar is not focusable. Give it an `aria-label` or
 * `aria-labelledby`.
 *
 * @param props See {@link ProgressProps}.
 * @returns The progress bar, with its indicator inside.
 * @example
 * import { Progress } from "@shadow-js/primitives";
 *
 * export function Upload() {
 *   return (
 *     <Progress value={40} aria-label="Upload">
 *       <Progress.Indicator style={{ width: "40%" }} />
 *     </Progress>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ProgressIndicator}
 */
export function ProgressRoot<T extends PolymorphicTarget = "div">(
  props: ProgressProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & ProgressOwnProps>(props), [
    "as",
    "value",
    "max",
    "getValueLabel",
  ]);
  const max = (): number => resolveMax(own.max);
  const value = (): number | null => resolveValue(own.value, max());
  const state = (): ProgressState => progressState(value(), max());
  const base = useBaseId();
  const label = usePartRegistration();
  let customLabelId: Accessor<string | undefined> | undefined;
  const labelId = (): string => customLabelId?.() ?? base();
  const locale = (): string | undefined => {
    const lang = (rest as Loose)["lang"];
    return typeof lang === "string" && lang !== "" ? lang : undefined;
  };
  const valueLabel = (): string | undefined => {
    const current = value();
    const lang = locale();
    const format = own.getValueLabel;
    return current === null
      ? undefined
      : untrack(() =>
          format === undefined ? defaultValueLabel(current, max(), lang) : format(current, max()),
        );
  };

  if (__DEV__) {
    useEffect(() => {
      const requested = own.max;
      if (requested !== undefined && !isValidMax(requested)) {
        console.warn(
          `[primitives PROGRESS_INVALID_MAX] Invalid \`max\` of ${String(requested)} supplied to Progress. Only numbers greater than 0 are valid. Defaulting to 100.`,
        );
      }
    });
    useEffect(() => {
      const requested = own.value;
      if (requested !== undefined && requested !== null && !isValidValue(requested, max())) {
        console.warn(
          `[primitives PROGRESS_INVALID_VALUE] Invalid \`value\` of ${String(requested)} supplied to Progress. It must be a number from 0 to ${max()} (or null for indeterminate). The progress bar is treated as indeterminate.`,
        );
      }
    });
  }

  const merged = mergeElementProps(
    {
      role: "progressbar",
      get "aria-labelledby"() {
        return label.present() ? labelId() : undefined;
      },
      "aria-valuemin": 0,
      get "aria-valuemax"() {
        return max();
      },
      get "aria-valuenow"() {
        return value() ?? undefined;
      },
      get "aria-valuetext"() {
        return valueLabel();
      },
      get "data-state"() {
        return state();
      },
      get "data-value"() {
        return value() ?? undefined;
      },
      get "data-max"() {
        return max();
      },
    },
    rest,
  );
  return (
    <progressContext.Provider
      value={{
        value,
        max,
        state,
        valueLabel,
        labelId,
        label,
        setLabel: (read) => (customLabelId = read),
      }}
    >
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </progressContext.Provider>
  );
}

/**
 * Props of {@link ProgressIndicator}. Accessibility: none; the indicator is decorative and the bar
 * is what is announced. Data attributes: `data-state`, `data-max` (always) and `data-value` (left out while
 * indeterminate), the same as the bar's.
 * @see {@link ProgressIndicator}
 * @since 1.0.0
 */
export type ProgressIndicatorProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * The filled part of the bar. Unstyled: size it from `data-value` / `data-max`, or inline,
 * e.g. `style={{ width: `${value}%` }}`. Carries the same `data-state`, `data-value` and
 * `data-max` as the bar. Keyboard: none. ARIA: none; the bar carries the progressbar role.
 *
 * @param props See {@link ProgressIndicatorProps}.
 * @returns The indicator element.
 * @example
 * import { Progress } from "@shadow-js/primitives";
 *
 * export function Bar() {
 *   return (
 *     <Progress value={40} aria-label="Upload">
 *       <Progress.Indicator class="h-full bg-primary transition-all" style={{ width: "40%" }} />
 *     </Progress>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ProgressRoot}
 */
export function ProgressIndicator<T extends PolymorphicTarget = "div">(
  props: ProgressIndicatorProps<T>,
): JsxChild {
  const context = progressContext.use("Progress.Indicator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return context.state();
      },
      get "data-value"() {
        return context.value() ?? undefined;
      },
      get "data-max"() {
        return context.max();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * Props of {@link ProgressLabel}.
 * @see {@link ProgressLabel}
 * @since 1.0.0
 */
export type ProgressLabelProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

/**
 * The visible name of a progress bar. Mount one label per root; the bar references its id only
 * while it is mounted. A supplied id replaces the generated id. Keyboard: none.
 *
 * @param props Span attributes and a polymorphic `as` target.
 * @returns The label element.
 * @example
 * import { Progress } from "@shadow-js/primitives";
 *
 * export function UploadLabel() {
 *   return <Progress value={40}><Progress.Label>Upload</Progress.Label><Progress.Indicator /></Progress>;
 * }
 * @see {@link ProgressRoot}
 * @since 1.0.0
 */
export function ProgressLabel<T extends PolymorphicTarget = "span">(
  props: ProgressLabelProps<T>,
): JsxChild {
  const context = progressContext.use("Progress.Label");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  context.label.register();
  context.setLabel(() => rest["id"] as string | undefined);
  onCleanup(() => context.setLabel(undefined));
  const merged = mergeElementProps(
    {
      get id() {
        return context.labelId();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "span"} {...merged} />;
}

/**
 * Props of {@link ProgressValue}.
 * @see {@link ProgressValue}
 * @since 1.0.0
 */
export type ProgressValueProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  object,
  T
>;

/**
 * Displays the root's formatted percentage or `getValueLabel` text. Indeterminate bars have no
 * default text. Children override the text, for example with a localized loading message.
 * Keyboard: none; the root announces the value through `aria-valuetext`.
 *
 * @param props Span attributes, optional children and a polymorphic `as` target.
 * @returns The value element.
 * @example
 * import { Progress } from "@shadow-js/primitives";
 *
 * export function UploadValue() {
 *   return <Progress value={40} aria-label="Upload"><Progress.Value /><Progress.Indicator /></Progress>;
 * }
 * @see {@link ProgressRoot}
 * @since 1.0.0
 */
export function ProgressValue<T extends PolymorphicTarget = "span">(
  props: ProgressValueProps<T>,
): JsxChild {
  const context = progressContext.use("Progress.Value");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get children() {
        return context.valueLabel();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "span"} {...merged} />;
}
