/**
 * Reading direction for primitives that flip with it (horizontal arrow keys, popper alignment,
 * slider and tab orientation). A `DirectionProvider` sets it for a subtree; `useDirection` resolves
 * the effective value for one part.
 * @packageDocumentation
 */
import type { Accessor } from "@shadow-js/core";
import { createContext, isServer, useContext } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";

/**
 * A reading direction: `"ltr"` (left to right) or `"rtl"` (right to left). Parts that flip with it
 * read it through {@link useDirection}.
 * @see {@link useDirection}
 * @see {@link DirectionProvider}
 * @since 1.0.0
 */
export type Direction = "ltr" | "rtl";

/**
 * Props of {@link DirectionProvider}. The provider sets no ARIA attributes, no data attributes and
 * no keys; it only supplies the direction that the parts below read.
 * @see {@link DirectionProvider}
 * @since 1.0.0
 */
export interface DirectionProviderProps {
  /**
   * The direction for every part below. It changes the arrow-key mapping and alignment of those
   * parts. May be a getter, so it can change over time.
   * @default none (required)
   */
  readonly dir: Direction;
  /**
   * The subtree that reads the direction.
   * @default none
   */
  readonly children?: JsxChild;
}

// The value is an accessor so a reactive `dir` reaches consumers without re-creating the context.
// `null` (not `undefined`) is the default: `undefined` would make `useContext` throw outside a provider.
const DirectionContext = createContext<Accessor<Direction> | null>(null, { name: "Direction" });

/**
 * Provides a reading direction to every primitive below it. It renders no element of its own and
 * handles no keys or ARIA attributes: the parts below use the direction for arrow-key mapping and
 * alignment. The `dir` value is read through an accessor, so a reactive `dir` updates consumers
 * without re-creating the subtree.
 *
 * @param props See {@link DirectionProviderProps}.
 * @returns The subtree.
 * @example
 * import { DirectionProvider, useDirection } from "@shadow-js/primitives";
 *
 * function Forward() {
 *   const dir = useDirection();
 *   return <span>{dir() === "rtl" ? "Back" : "Next"}</span>;
 * }
 *
 * export function App() {
 *   return (
 *     <DirectionProvider dir="rtl">
 *       <Forward />
 *     </DirectionProvider>
 *   );
 * }
 * @see {@link DirectionProviderProps}
 * @see {@link useDirection}
 * @since 1.0.0
 */
export function DirectionProvider(props: DirectionProviderProps): JsxChild {
  const value: Accessor<Direction> = () => props.dir;
  return <DirectionContext.Provider value={value}>{props.children}</DirectionContext.Provider>;
}

/** The `dir` of `<html>` when it is "ltr" or "rtl"; `undefined` on the server or when unset. Internal. @internal */
export function documentDirection(): Direction | undefined {
  if (isServer || typeof document === "undefined") return undefined;
  const value = document.documentElement.getAttribute("dir")?.toLowerCase();
  return value === "rtl" || value === "ltr" ? value : undefined;
}

/**
 * Resolves the reading direction of a part: its own `dir` prop, else the nearest
 * {@link DirectionProvider}, else what `near` returns (a part that renders in a portal away from the tree it belongs to reads the
 * direction of its anchor's surroundings), else the `dir` attribute of `<html>` (read each time the accessor
 * runs, on the client only; `"ltr"` and `"rtl"` are accepted, case-insensitively), else `"ltr"`.
 * Call it during setup, like any hook. It sets no ARIA attributes and handles no keys itself; a
 * part uses the result to map arrow keys.
 *
 * @param local An accessor of the part's own `dir` prop.
 * @param near An accessor of a direction found elsewhere, used when no prop or provider gives one (the popper reads the
 * `dir` attribute above its anchor, so it reaches the portaled content). Optional.
 * @returns An accessor of the effective direction.
 * @example
 * import { type Direction, useDirection } from "@shadow-js/primitives";
 *
 * export function arrowKeys(props: { dir?: Direction }) {
 *   const dir = useDirection(() => props.dir);
 *   return () => (dir() === "rtl" ? "ArrowLeft" : "ArrowRight");
 * }
 * @see {@link DirectionProvider}
 * @see {@link Direction}
 * @since 1.0.0
 */
export function useDirection(
  local?: () => Direction | undefined,
  near?: () => Direction | undefined,
): Accessor<Direction> {
  const inherited = useContext(DirectionContext);
  return (): Direction => local?.() ?? inherited?.() ?? near?.() ?? documentDirection() ?? "ltr";
}
