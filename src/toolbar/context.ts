/**
 * What the toolbar root shares with its items. @internal
 */
import type { Accessor } from "@shadow-js/core";
import {
  createPartContext,
  type Direction,
  type Orientation,
  type PartContext,
  type RovingFocus,
} from "../utils/index";

/**
 * The state a toolbar shares with its items: its orientation, the reading direction, and the roving
 * focus group that moves focus between them.
 * @since 1.0.0
 * @see {@link toolbarContext}
 */
export interface ToolbarContextValue {
  /** The toolbar's orientation. Call it to read the value. */
  readonly orientation: Accessor<Orientation>;
  /** The effective reading direction. Call it to read the value. */
  readonly dir: Accessor<Direction>;
  /** The roving focus group the items register with. */
  readonly roving: RovingFocus;
}

/**
 * The context of {@link ToolbarRoot}. A part reads it with `toolbarContext.use("Toolbar.Part")`,
 * which throws `[primitives] <Toolbar.Part> must be used within <Toolbar>.` outside a toolbar.
 *
 * @example
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 * import { type ToolbarContextValue, toolbarContext } from "@shadow-js/primitives";
 *
 * export function ToolbarOrientation(): JsxChild {
 *   const state: ToolbarContextValue = toolbarContext.use("Toolbar.Orientation");
 *   return <span>{state.orientation()}</span>;
 * }
 * @see {@link ToolbarContextValue}
 * @since 1.0.0
 */
export const toolbarContext: PartContext<ToolbarContextValue> =
  createPartContext<ToolbarContextValue>("Toolbar");
