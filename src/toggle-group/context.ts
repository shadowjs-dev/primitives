import type { Accessor } from "@shadow-js/core";
import { createPartContext, type PartContext, type RovingFocus } from "../utils/index";

/**
 * What `ToggleGroup.Item` reads from its group: the pressed values, how to press and release them,
 * the disabled flag, and the roving focus group. A custom item reads it with
 * {@link toggleGroupContext}.
 * @since 1.0.0
 * @see {@link toggleGroupContext}
 */
export interface ToggleGroupContextValue {
  /**
   * `"single"` when the group allows one pressed item, else `"multiple"`.
   */
  readonly type: Accessor<"single" | "multiple">;
  /**
   * The pressed values; a single group has at most one. Tracked.
   */
  readonly value: Accessor<readonly string[]>;
  /**
   * Presses the item with this value. A single group replaces the pressed value; a multiple group adds it.
   */
  readonly activate: (value: string) => void;
  /**
   * Releases the item with this value.
   */
  readonly deactivate: (value: string) => void;
  /**
   * Whether the whole group is disabled. Tracked.
   */
  readonly disabled: Accessor<boolean>;
  /**
   * Whether arrow keys, Home and End move focus between items (one tab stop). Tracked.
   */
  readonly rovingFocus: Accessor<boolean>;
  /**
   * The roving focus group that the items register with.
   */
  readonly roving: RovingFocus;
}

/**
 * The context of a `ToggleGroup` root. A custom item inside a group reads it with
 * `toggleGroupContext.use("MyItem")`, which throws outside a group.
 *
 * @example
 * import { toggleGroupContext } from "@shadow-js/primitives";
 *
 * export function GroupMode() {
 *   const group = toggleGroupContext.use("GroupMode");
 *   return <span>{group.type()}</span>;
 * }
 * @since 1.0.0
 * @see {@link ToggleGroupContextValue}
 */
export const toggleGroupContext: PartContext<ToggleGroupContextValue> =
  createPartContext<ToggleGroupContextValue>("ToggleGroup");
