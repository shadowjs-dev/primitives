import { ProgressIndicator, ProgressLabel, ProgressRoot, ProgressValue } from "./progress";

export type {
  ProgressContextValue,
  ProgressIndicatorProps,
  ProgressLabelProps,
  ProgressOwnProps,
  ProgressProps,
  ProgressValueProps,
} from "./progress";
export { progressContext } from "./progress";
export type { ProgressState } from "./value";
export {
  DEFAULT_PROGRESS_MAX,
  defaultValueLabel,
  isValidMax,
  isValidValue,
  progressState,
  resolveMax,
  resolveValue,
} from "./value";
export { ProgressIndicator, ProgressLabel, ProgressRoot, ProgressValue };

/**
 * The progress primitive (WAI-ARIA progressbar): `Progress` and `Progress.Indicator`. Each part is
 * also exported by name (`ProgressIndicator`) for tree shaking. Keyboard: none; the bar is not
 * focusable. ARIA: `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and
 * `aria-valuetext` (the last two omitted while indeterminate).
 *
 * @example
 * import { Progress } from "@shadow-js/primitives";
 *
 * export function Loading() {
 *   return (
 *     <Progress value={60} aria-label="Loading">
 *       <Progress.Indicator style={{ transform: "translateX(-40%)" }} />
 *     </Progress>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ProgressRoot}
 */
export const Progress: typeof ProgressRoot & {
  readonly Indicator: typeof ProgressIndicator;
  readonly Label: typeof ProgressLabel;
  readonly Value: typeof ProgressValue;
} = Object.assign(ProgressRoot, {
  Indicator: ProgressIndicator,
  Label: ProgressLabel,
  Value: ProgressValue,
});
