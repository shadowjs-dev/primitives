/**
 * `mergeElementProps`: merges the props a primitive computes with the props the application passed,
 * the way a headless library has to. Plain attributes follow `mergeProps` (the right-most defined
 * value wins), and four families are combined instead of replaced:
 *
 * - event handlers (`onClick`, `onKeyDown`, ...): all run, the highest-priority source first; the
 *   lower-priority ones are skipped once an earlier handler called `preventDefault()`, except
 *   handlers marked with `alwaysRun`;
 * - `class`, `className`: every value is kept, as an array that the renderer joins into one class list;
 * - `classList`: the objects are merged;
 * - `style`: objects are merged (higher priority wins per property); a string source makes the
 *   result a CSS text;
 * - `ref`: every ref is called with the element.
 *
 * The result is a live view: nothing is read at merge time, so getters stay reactive. Composed
 * values are cached by the identity of their inputs, so a prop that did not change keeps the same
 * identity and the element is not rewritten.
 * @packageDocumentation
 */
import { alwaysRun, isAlwaysRun, toCallable } from "./compose";

/**
 * A source accepted by {@link mergeElementProps}: a props object, an accessor that returns one, or
 * `null`, `undefined` or `false` (skipped). The sources are read when the merged value is read, so an
 * accessor stays reactive.
 * @see {@link mergeElementProps}
 * @see {@link MergedElementProps}
 * @since 1.0.0
 */
export type ElementPropsSource =
  | object
  | (() => object | null | undefined | false)
  | null
  | undefined
  | false;

/**
 * The merged props returned by {@link mergeElementProps}: a read-only live view, ready to be spread
 * on an element or passed to a component. Assigning to or deleting a key fails.
 * @see {@link mergeElementProps}
 * @see {@link ElementPropsSource}
 * @since 1.0.0
 */
export type MergedElementProps = Record<string, unknown>;

const UNSAFE_KEYS: ReadonlySet<PropertyKey> = new Set<PropertyKey>([
  "__proto__",
  "constructor",
  "prototype",
]);

/** A composed value and the inputs it was built from. */
interface CacheEntry {
  inputs: readonly unknown[];
  value: unknown;
}

function isEventKey(key: string): boolean {
  return key.length > 2 && key.startsWith("on");
}

function sameInputs(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
}

/** CSS text for a style object (`backgroundColor` becomes `background-color`). */
function styleText(style: Record<string, unknown>): string {
  let text = "";
  for (const name of Object.keys(style)) {
    const value = style[name];
    if (value === null || value === undefined || value === false) continue;
    const property = name.startsWith("--")
      ? name
      : name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    text += `${property}:${String(value)};`;
  }
  return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Combines style values, lowest priority first. Objects merge; a string turns the result into text. */
function combineStyles(values: readonly unknown[]): unknown {
  if (values.every(isRecord)) return Object.assign({}, ...values);
  return values
    .map((value) => (isRecord(value) ? styleText(value) : typeof value === "string" ? value : ""))
    .map((text) => text.trim().replace(/;+$/, ""))
    .filter((text) => text !== "")
    .join(";");
}

/** Combines handlers, lowest priority first. The highest priority runs first. */
function combineHandlers(values: readonly unknown[]): unknown {
  const callables = values
    .map((value) => ({ call: toCallable(value), always: isAlwaysRun(value) }))
    .filter((entry) => entry.call !== undefined);
  if (callables.length === 1) return values.find((value) => toCallable(value) !== undefined);
  const composed = (event: Event): void => {
    // Highest priority first. A failing handler must not skip the others, so errors are collected.
    const errors: unknown[] = [];
    for (let index = callables.length - 1; index >= 0; index -= 1) {
      const entry = callables[index];
      if (entry === undefined || entry.call === undefined) continue;
      if (event.defaultPrevented && !entry.always) continue;
      try {
        entry.call(event as never);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1)
      throw new AggregateError(
        errors,
        __DEV__ ? "Several event handlers threw." : "PRIMITIVES_HANDLERS",
      );
  };
  return composed;
}

/** Combines refs, lowest priority first. */
function combineRefs(values: readonly unknown[]): unknown {
  const refs = values.filter(
    (value): value is (element: unknown) => void => typeof value === "function",
  );
  if (refs.length === 1) return refs[0];
  return (element: unknown): void => {
    for (const ref of refs) ref(element);
  };
}

/** Keys of the `class` family, kept as arrays of every source's value. */
function combineClasses(values: readonly unknown[]): unknown {
  return values;
}

function combineClassList(values: readonly unknown[]): unknown {
  return Object.assign({}, ...values.filter(isRecord));
}

type Combiner = (values: readonly unknown[]) => unknown;

/** The combiner for a key, or `undefined` when the right-most defined value simply wins. */
function combinerFor(key: string): Combiner | undefined {
  if (key === "class" || key === "className") return combineClasses;
  if (key === "classList") return combineClassList;
  if (key === "style") return combineStyles;
  if (key === "ref") return combineRefs;
  if (isEventKey(key)) return combineHandlers;
  return undefined;
}

/**
 * Merges props sources into one live props object, with the semantics described in the module
 * header. Sources run from lowest to highest priority, like `mergeProps`: put the primitive's own
 * props first and the application's last. The merge itself sets no keys or ARIA attributes; the
 * sources decide them. A merged event handler calls the handlers of that event from the highest
 * priority down. Once one of them calls `preventDefault()`, the lower-priority handlers are skipped,
 * unless they are marked with {@link alwaysRun}. If a handler throws, the rest still run and the
 * error is rethrown afterward (several errors as an `AggregateError`).
 *
 * @param sources See {@link ElementPropsSource}. Props objects, accessors returning one, or nothing
 *   (skipped).
 * @returns A read-only live view usable as `{...merged}` in JSX or as a component's props. See
 *   {@link MergedElementProps}.
 * @example
 * import { mergeElementProps } from "@shadow-js/primitives";
 *
 * export function Tab(props: {
 *   selected: boolean;
 *   onSelect: () => void;
 *   rest?: Record<string, unknown>;
 * }) {
 *   const merged = mergeElementProps(
 *     { role: "tab", "aria-selected": props.selected ? "true" : "false", onClick: props.onSelect },
 *     props.rest,
 *   );
 *   return <button {...merged} />;
 * }
 * @see {@link ElementPropsSource}
 * @see {@link MergedElementProps}
 * @see {@link alwaysRun}
 * @since 1.0.0
 */
export function mergeElementProps(...sources: readonly ElementPropsSource[]): MergedElementProps {
  const caches = new Map<string, CacheEntry>();

  /** The objects the sources stand for right now, in priority order low to high. */
  const resolve = (): object[] => {
    const objects: object[] = [];
    for (const source of sources) {
      const value = typeof source === "function" ? source() : source;
      if (value !== null && value !== undefined && value !== false && typeof value === "object") {
        objects.push(value);
      }
    }
    return objects;
  };

  const keysOf = (objects: readonly object[]): string[] => {
    const seen = new Set<string>();
    for (const object of objects) {
      for (const key of Reflect.ownKeys(object)) {
        if (typeof key !== "string" || UNSAFE_KEYS.has(key)) continue;
        if (!Object.prototype.propertyIsEnumerable.call(object, key)) continue;
        seen.add(key);
      }
    }
    return [...seen];
  };

  const read = (objects: readonly object[], key: string): unknown => {
    const combiner = combinerFor(key);
    if (combiner === undefined) {
      for (let index = objects.length - 1; index >= 0; index -= 1) {
        const object = objects[index];
        if (object === undefined || !(key in object)) continue;
        const value: unknown = Reflect.get(object, key);
        if (value !== undefined) return value;
      }
      return undefined;
    }
    const values: unknown[] = [];
    for (const object of objects) {
      if (!(key in object)) continue;
      const value: unknown = Reflect.get(object, key);
      if (value !== undefined && value !== null && value !== false) values.push(value);
    }
    if (values.length === 0) return undefined;
    if (values.length === 1) return values[0];
    const cached = caches.get(key);
    if (cached !== undefined && sameInputs(cached.inputs, values)) return cached.value;
    const value = combiner(values);
    caches.set(key, { inputs: values, value });
    return value;
  };

  return new Proxy<MergedElementProps>(
    {},
    {
      get(target, key) {
        if (typeof key !== "string") return Reflect.get(target, key) as unknown;
        if (UNSAFE_KEYS.has(key)) return undefined;
        return read(resolve(), key);
      },
      has(target, key) {
        if (typeof key !== "string") return Reflect.has(target, key);
        return keysOf(resolve()).includes(key);
      },
      ownKeys() {
        return keysOf(resolve());
      },
      getOwnPropertyDescriptor(_target, key) {
        if (typeof key !== "string") return undefined;
        const objects = resolve();
        if (!keysOf(objects).includes(key)) return undefined;
        return { enumerable: true, configurable: true, get: () => read(resolve(), key) };
      },
      set: () => false,
      defineProperty: () => false,
      deleteProperty: () => false,
    },
  );
}

/**
 * {@link alwaysRun} from `./compose`, re-exported so a part can mark its own always-run handlers next
 * to the merge call. It is the same function: marking a handler with either name works.
 * @example
 * import { alwaysRun, mergeElementProps } from "@shadow-js/primitives";
 *
 * export function guarded(onPointerDown: (event: PointerEvent) => void) {
 *   return mergeElementProps({ onPointerDown: alwaysRun(onPointerDown) });
 * }
 * @see {@link alwaysRun}
 * @see {@link mergeElementProps}
 * @since 1.0.0
 */
export { alwaysRun };
