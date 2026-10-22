import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperProvider } from "../popper/index";
import { createSelectContext, type SelectProps, selectContext } from "./context";
import { SelectNative } from "./native-select";

/**
 * Root of a select: holds the value and the open state and provides them to the parts. It renders
 * no element of its own besides the hidden native `<select>` that appears when `name` is given.
 *
 * Follows the WAI-ARIA select-only combobox pattern (`Select.Trigger`) with a listbox popup
 * (`Select.Content`). Controlled with `value` / `onValueChange` and `open` / `onOpenChange`, or
 * uncontrolled with `defaultValue` / `defaultOpen`. A native `<select>` is rendered when `name` is
 * set, so `FormData`, `required`, `form="id"`, `autoComplete` and form reset work. Only a single
 * value is supported (no `multiple`).
 *
 * @param props See {@link SelectProps}.
 * @returns The provided parts and, when `name` is set, the hidden native `select`.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select name="fruit" defaultValue="apple">
 *   <Select.Trigger><Select.Value placeholder="Pick a fruit" /><Select.Icon /></Select.Trigger>
 *   <Select.Portal>
 *     <Select.Content>
 *       <Select.Viewport>
 *         <Select.Item value="apple"><Select.ItemText>Apple</Select.ItemText></Select.Item>
 *       </Select.Viewport>
 *     </Select.Content>
 *   </Select.Portal>
 * </Select>;
 * @see {@link Select}
 * @since 1.0.0
 */
export function SelectRoot(props: SelectProps): JsxChild {
  const context = createSelectContext(props);
  return (
    <selectContext.Provider value={context}>
      <PopperProvider anchor={context.trigger} setAnchor={() => undefined}>
        {props.children}
        <SelectNative context={context} root={props} />
      </PopperProvider>
    </selectContext.Provider>
  );
}
