import { For, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperProvider } from "../popper/index";
import { HiddenInput } from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  type ComboboxContextValue,
  type ComboboxProps,
  type ComboboxRootView,
  comboboxContext,
  createComboboxContext,
} from "./context";

/**
 * Root of a combobox: holds the selection, the input text, the open state and the item registry,
 * and provides them to the parts. It renders no element except the visually hidden form inputs
 * (when `name` is set).
 *
 * Follows the WAI-ARIA 1.2 combobox pattern with a listbox popup and list autocomplete: the
 * input keeps DOM focus and points at the highlighted option with `aria-activedescendant`.
 * Controlled with `value` / `inputValue` / `open`, or uncontrolled with the `default*` props. With
 * `multiple` the value is a `string[]` and the selection is shown as chips.
 *
 * Keyboard and ARIA: the input is `role="combobox"` (`aria-expanded`, `aria-controls` while open);
 * the list is `role="listbox"` of `option` items. Arrow keys move the highlight, Enter selects it,
 * Escape closes the list (a second Escape clears the field) and Tab closes it. See `Combobox.Input`.
 *
 * @param props See {@link ComboboxProps}.
 * @returns The provider around the children, plus hidden form inputs when `name` is set.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Anchor>
 *         <Combobox.Input placeholder="Pick a fruit" />
 *         <Combobox.Trigger>v</Combobox.Trigger>
 *       </Combobox.Anchor>
 *       <Combobox.Portal>
 *         <Combobox.Content>
 *           <Combobox.Item value="apple">Apple</Combobox.Item>
 *           <Combobox.Item value="banana">Banana</Combobox.Item>
 *           <Combobox.Empty>No fruit found</Combobox.Empty>
 *         </Combobox.Content>
 *       </Combobox.Portal>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxProps}
 */
export function ComboboxRoot(props: ComboboxProps): JsxChild {
  const view = partProps<ComboboxRootView>(props);
  const context = createComboboxContext(view);
  return (
    <comboboxContext.Provider value={context}>
      <PopperProvider
        anchor={() => context.anchor() ?? context.input()}
        setAnchor={(anchor) => {
          if (anchor === undefined || anchor instanceof HTMLElement)
            context.setAnchorElement(anchor);
        }}
      >
        {view.children}
      </PopperProvider>
      <FormValue context={context} view={view} />
    </comboboxContext.Provider>
  );
}

/**
 * The native form participation: one hidden text input per selected value (a single one, empty
 * when nothing is selected, for a single combobox) so `FormData`, `required`, `form="id"` and
 * reset behave like a native field.
 */
function FormValue(props: {
  readonly context: ComboboxContextValue;
  readonly view: ComboboxRootView;
}): JsxChild {
  const { context, view } = props;
  return (
    <Show
      when={context.multiple()}
      fallback={
        <HiddenInput
          type="text"
          name={view.name}
          value={context.selected()[0] ?? ""}
          required={context.required()}
          disabled={context.disabled()}
          form={view.form}
          onReset={context.reset}
        />
      }
    >
      <For each={context.selected()}>
        {(value: string) => (
          <HiddenInput
            type="text"
            name={view.name}
            value={value}
            disabled={context.disabled()}
            form={view.form}
            onReset={context.reset}
          />
        )}
      </For>
      <Show when={context.required() && context.selected().length === 0}>
        <HiddenInput
          type="text"
          name={view.name}
          value=""
          required
          disabled={context.disabled()}
          form={view.form}
          onReset={context.reset}
        />
      </Show>
    </Show>
  );
}
