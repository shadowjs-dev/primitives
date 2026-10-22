import type { Accessor } from "@shadow-js/core";
import { createPartContext, type PartContext, type PartRegistration } from "../utils/index";

/**
 * What the items and the label inside a group read from it. @internal
 * @since 1.0.0
 * @see {@link ComboboxGroup}
 */
export interface ComboboxGroupContextValue {
  /** The id of the group's heading, used for `aria-labelledby`. */
  readonly labelId: Accessor<string>;
  /** Registration of the group's `Combobox.Label`; `present()` is true while it is mounted. */
  readonly label: PartRegistration;
  /** An item of the group reports whether it is shown; returns the function that removes it. */
  readonly track: (visible: Accessor<boolean>) => () => void;
  /** Tells the group that its items changed. Call it from `onMount` / cleanup. */
  readonly touch: () => void;
}

/**
 * The context a `Combobox.Group` provides to its items and its label. Internal to the primitive:
 * it is not exported from the package entry point. @internal
 * @since 1.0.0
 * @see {@link ComboboxGroup}
 */
export const comboboxGroupContext: PartContext<ComboboxGroupContextValue> =
  createPartContext<ComboboxGroupContextValue>("Combobox.Group");
