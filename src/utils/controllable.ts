/**
 * Controlled / uncontrolled state in one helper, the contract every primitive follows
 * (`open` / `defaultOpen` / `onOpenChange`, `value` / `defaultValue` / `onValueChange`).
 * @packageDocumentation
 */
import { type Accessor, untrack, useEffect, useSignal } from "@shadow-js/core";

/**
 * Options of {@link useControllableState}. The options set no ARIA attributes, no keyboard behavior
 * and no data attributes; the component that calls the hook owns those.
 * @typeParam T The state type.
 * @see {@link useControllableState}
 * @since 1.0.0
 */
export interface ControllableStateOptions<T> {
  /**
   * The controlled value; `undefined` means the state is uncontrolled. Tracked.
   * @default none (required; `undefined` at run time means uncontrolled)
   */
  readonly value: () => T | undefined;
  /**
   * The initial uncontrolled value. Read once.
   * @default none (required)
   */
  readonly defaultValue: () => T;
  /**
   * Called with every new value, in both modes, when it differs from the current one. Read at the
   * time of the change.
   * @default none
   */
  readonly onChange?: () => ((value: T) => void) | undefined;
  /**
   * Whether two values are the same. A new value that is the same does not store or report.
   * @default `Object.is`
   */
  readonly equals?: (a: T, b: T) => boolean;
  /**
   * Name used in the dev warning about switching modes, e.g. `"Dialog open"`. Without it the
   * warning says "A component".
   * @default none
   */
  readonly name?: string;
}

/**
 * The pair {@link useControllableState} returns: an accessor of the current value and a setter.
 * @typeParam T The state type.
 * @see {@link useControllableState}
 * @since 1.0.0
 */
export type ControllableState<T> = readonly [
  value: Accessor<T>,
  set: (next: T | ((previous: T) => T)) => void,
];

/**
 * State that is controlled when the application passes a value and uncontrolled otherwise. The
 * setter reports every change through `onChange`; when uncontrolled it also stores the value, when
 * controlled the application decides by passing the new value back. Switching between the two modes
 * is allowed but warns once per switch in development (`console.warn` with the prefix
 * `[primitives CONTROLLED_CHANGE]`), because it is almost always a bug. The hook sets no ARIA
 * attributes and handles no keys.
 *
 * @param options See {@link ControllableStateOptions}.
 * @returns `[value, set]`, see {@link ControllableState}.
 * @example
 * import { useControllableState } from "@shadow-js/primitives";
 *
 * export function useOpenState(props: {
 *   open?: boolean;
 *   defaultOpen?: boolean;
 *   onOpenChange?: (open: boolean) => void;
 * }) {
 *   return useControllableState<boolean>({
 *     value: () => props.open,
 *     defaultValue: () => props.defaultOpen ?? false,
 *     onChange: () => props.onOpenChange,
 *   });
 * }
 * @see {@link ControllableStateOptions}
 * @since 1.0.0
 */
export function useControllableState<T>(
  options: ControllableStateOptions<T>,
): ControllableState<T> {
  const equals = options.equals ?? Object.is;
  const [uncontrolled, setUncontrolled] = useSignal<T>(untrack(options.defaultValue), {
    equals: false,
  });
  const isControlled = (): boolean => options.value() !== undefined;
  const value: Accessor<T> = () => {
    const controlled = options.value();
    return controlled !== undefined ? controlled : uncontrolled();
  };
  const set = (next: T | ((previous: T) => T)): void => {
    const previous = untrack(value);
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
    if (equals(previous, resolved)) return;
    if (!untrack(isControlled)) setUncontrolled(() => resolved);
    untrack(() => options.onChange?.()?.(resolved));
  };
  if (__DEV__) {
    let was: boolean | undefined;
    useEffect(() => {
      const now = isControlled();
      if (was !== undefined && was !== now) {
        console.warn(
          `[primitives CONTROLLED_CHANGE] ${options.name ?? "A component"} changed from ${
            was ? "controlled to uncontrolled" : "uncontrolled to controlled"
          }. Decide between a controlled and an uncontrolled component for its lifetime.`,
        );
      }
      was = now;
    });
  }
  return [value, set];
}
