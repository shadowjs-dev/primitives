// biome-ignore-all lint/a11y: fixtures render bare controls on purpose
import { For, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Dialog, Select, SelectItemAlignedContent } from "../../src/index";

interface DemoProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  dir?: "ltr" | "rtl";
  autoComplete?: string;
  forceMount?: boolean;
  placeholder?: string;
  triggerProps?: Record<string, unknown>;
  contentProps?: Record<string, unknown>;
  valueChildren?: string;
}

/** A complete select in a portal with a button outside to press. Banana is disabled. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        outside
      </button>
      <Select
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
        name={props.name}
        form={props.form}
        required={props.required}
        disabled={props.disabled}
        dir={props.dir}
        autoComplete={props.autoComplete}
      >
        <Select.Trigger data-testid="trigger" {...props.triggerProps}>
          <Select.Value data-testid="value" placeholder={props.placeholder ?? "Pick a fruit"}>
            {props.valueChildren}
          </Select.Value>
          <Select.Icon data-testid="icon" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content data-testid="content" forceMount={props.forceMount} {...props.contentProps}>
            <Select.Viewport data-testid="viewport">
              <Select.Item value="apple" data-testid="apple">
                <Select.ItemText>Apple</Select.ItemText>
                <Select.ItemIndicator data-testid="indicator-apple">v</Select.ItemIndicator>
              </Select.Item>
              <Select.Item value="apricot" data-testid="apricot">
                <Select.ItemText>Apricot</Select.ItemText>
              </Select.Item>
              <Select.Item value="banana" data-testid="banana" disabled>
                <Select.ItemText>Banana</Select.ItemText>
              </Select.Item>
              <Select.Item value="blueberry" data-testid="blueberry">
                <Select.ItemText>Blueberry</Select.ItemText>
              </Select.Item>
              <Select.Item value="cherry" data-testid="cherry">
                <Select.ItemText>Cherry</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
            <Select.Arrow data-testid="arrow" />
          </Select.Content>
        </Select.Portal>
      </Select>
    </div>
  );
}

/** Content without a portal: renders on the server when open. */
export function Inline(props: DemoProps): JsxChild {
  return (
    <div>
      <Select
        value={props.value}
        defaultValue={props.defaultValue}
        defaultOpen={props.defaultOpen}
        name={props.name}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Pick a fruit">{props.valueChildren}</Select.Value>
        </Select.Trigger>
        <Select.Content data-testid="content">
          <Select.Viewport>
            <Select.Item value="apple">
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="cherry">
              <Select.ItemText>Cherry</Select.ItemText>
            </Select.Item>
          </Select.Viewport>
        </Select.Content>
      </Select>
    </div>
  );
}

/** Groups with labels and a separator. */
export function Grouped(): JsxChild {
  return (
    <Select defaultOpen>
      <Select.Trigger data-testid="trigger">
        <Select.Value placeholder="Pick" />
      </Select.Trigger>
      <Select.Content data-testid="content">
        <Select.Group data-testid="fruits">
          <Select.Label data-testid="fruits-label">Fruits</Select.Label>
          <Select.Item value="apple">
            <Select.ItemText>Apple</Select.ItemText>
          </Select.Item>
        </Select.Group>
        <Select.Separator data-testid="separator" />
        <Select.Group data-testid="veg">
          <Select.Label data-testid="veg-label">Vegetables</Select.Label>
          <Select.Item value="carrot">
            <Select.ItemText>Carrot</Select.ItemText>
          </Select.Item>
        </Select.Group>
        <Select.Group data-testid="unlabeled">
          <Select.Item value="rice">
            <Select.ItemText>Rice</Select.ItemText>
          </Select.Item>
        </Select.Group>
      </Select.Content>
    </Select>
  );
}

/** A select inside a form, with buttons to submit and reset it. */
export function InForm(props: DemoProps): JsxChild {
  return (
    <form id="the-form" data-testid="form">
      <Select
        name={props.name ?? "fruit"}
        defaultValue={props.defaultValue}
        value={props.value}
        required={props.required}
        disabled={props.disabled}
        autoComplete={props.autoComplete}
        onValueChange={props.onValueChange}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Pick a fruit" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content data-testid="content">
            <Select.Item value="apple" data-testid="apple">
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="cherry" data-testid="cherry">
              <Select.ItemText>Cherry</Select.ItemText>
            </Select.Item>
          </Select.Content>
        </Select.Portal>
      </Select>
      <button type="reset" data-testid="reset">
        reset
      </button>
    </form>
  );
}

/** The select belongs to a form elsewhere in the document through `form="id"`. */
export function FormAttribute(): JsxChild {
  return (
    <div>
      <form id="remote-form" data-testid="remote-form" />
      <Select name="fruit" form="remote-form" defaultValue="cherry">
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content>
            <Select.Item value="apple">
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="cherry">
              <Select.ItemText>Cherry</Select.ItemText>
            </Select.Item>
          </Select.Content>
        </Select.Portal>
      </Select>
    </div>
  );
}

/** A select inside a modal dialog. */
export function InDialog(props: { onDialogOpenChange?: (open: boolean) => void }): JsxChild {
  return (
    <Dialog defaultOpen onOpenChange={props.onDialogOpenChange}>
      <Dialog.Portal>
        <Dialog.Content data-testid="dialog">
          <Dialog.Title>Settings</Dialog.Title>
          <Dialog.Description>Pick one</Dialog.Description>
          <Select>
            <Select.Trigger data-testid="trigger">
              <Select.Value placeholder="Pick a fruit" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content data-testid="content">
                <Select.Item value="apple" data-testid="apple">
                  <Select.ItemText>Apple</Select.ItemText>
                </Select.Item>
                <Select.Item value="cherry" data-testid="cherry">
                  <Select.ItemText>Cherry</Select.ItemText>
                </Select.Item>
              </Select.Content>
            </Select.Portal>
          </Select>
          <Dialog.Close data-testid="close">Done</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

/** Parts rendered as other elements. */
export function AsOther(): JsxChild {
  return (
    <Select defaultOpen defaultValue="a">
      <Select.Trigger as="div" data-testid="trigger">
        <Select.Value as="strong" data-testid="value" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content as="section" data-testid="content">
          <Select.Item as="li" value="a" data-testid="item">
            <Select.ItemText as="em">A</Select.ItemText>
          </Select.Item>
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

/** A part used without its root. */
export function Orphan(): JsxChild {
  return <Select.Trigger>Orphan</Select.Trigger>;
}

/** An item with the forbidden empty value. */
export function EmptyValueItem(): JsxChild {
  return (
    <Select defaultOpen>
      <Select.Content>
        <Select.Item value="">
          <Select.ItemText>None</Select.ItemText>
        </Select.Item>
      </Select.Content>
    </Select>
  );
}

/** Twenty-five items, for paging keys and the scroll buttons. */
export function Long(props: { count?: number; defaultValue?: string }): JsxChild {
  const values = Array.from({ length: props.count ?? 25 }, (_, index) => `item-${index}`);
  return (
    <Select defaultOpen defaultValue={props.defaultValue}>
      <Select.Trigger data-testid="trigger">
        <Select.Value placeholder="Pick" />
      </Select.Trigger>
      <Select.Content data-testid="content">
        <Select.ScrollUpButton data-testid="up">up</Select.ScrollUpButton>
        <Select.Viewport data-testid="viewport">
          <For each={values}>
            {(value: string) => (
              <Select.Item value={value} data-testid={value}>
                <Select.ItemText>{value}</Select.ItemText>
              </Select.Item>
            )}
          </For>
        </Select.Viewport>
        <Select.ScrollDownButton data-testid="down">down</Select.ScrollDownButton>
      </Select.Content>
    </Select>
  );
}

/** Items that can be added and relabeled after mount. */
export function Dynamic(props: { label?: string; show?: boolean }): JsxChild {
  return (
    <Select defaultValue="x">
      <Select.Trigger data-testid="trigger">
        <Select.Value data-testid="value" placeholder="none" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content data-testid="content">
          <Select.Item value="x" data-testid="x">
            <Select.ItemText>{props.label ?? "Ex"}</Select.ItemText>
          </Select.Item>
          <Select.Item value="y" textValue="Why" data-testid="y">
            <Select.ItemText>Y</Select.ItemText>
          </Select.Item>
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

/** The selected item can disappear (a filtered list). */
export function Filtered(props: { show?: boolean }): JsxChild {
  return (
    <Select defaultValue="cherry">
      <Select.Trigger data-testid="trigger">
        <Select.Value data-testid="value" placeholder="none" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.Item value="apple">
            <Select.ItemText>Apple</Select.ItemText>
          </Select.Item>
          <Show when={props.show !== false}>
            <Select.Item value="cherry">
              <Select.ItemText>Cherry</Select.ItemText>
            </Select.Item>
          </Show>
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

/** The same select with the item-aligned content. */
export function Aligned(props: { defaultValue?: string; contentProps?: Record<string, unknown> }): JsxChild {
  return (
    <Select defaultValue={props.defaultValue} defaultOpen>
      <Select.Trigger data-testid="trigger">
        <Select.Value placeholder="Pick a fruit" />
      </Select.Trigger>
      <Select.Portal>
        <SelectItemAlignedContent data-testid="content" {...props.contentProps}>
          <Select.Viewport>
            <Select.Item value="apple" data-testid="apple">
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="apricot" data-testid="apricot">
              <Select.ItemText>Apricot</Select.ItemText>
            </Select.Item>
          </Select.Viewport>
        </SelectItemAlignedContent>
      </Select.Portal>
    </Select>
  );
}
