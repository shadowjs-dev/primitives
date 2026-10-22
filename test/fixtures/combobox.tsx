// biome-ignore-all lint/a11y: test fixtures render bare markup around the primitive under test
import { useSignal } from "@shadow-js/core";
import { For, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Combobox, Dialog } from "../../src/index";

const FRUITS: readonly { value: string; label: string; disabled?: boolean }[] = [
  { value: "apple", label: "Apple" },
  { value: "apricot", label: "Apricot" },
  { value: "banana", label: "Banana" },
  { value: "cafe", label: "Café au lait" },
  { value: "cherry", label: "Cherry" },
  { value: "durian", label: "Durian", disabled: true },
];

interface CommonProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (value: string, details: { reason: string }) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  form?: string;
  dir?: "ltr" | "rtl";
  filter?: (item: { value: string; label: string }, query: string) => boolean;
  shouldFilter?: boolean;
  allowCustomValue?: boolean;
  openOnFocus?: boolean;
  autoHighlight?: boolean;
  loop?: boolean;
  itemToString?: (value: string) => string;
  resultsMessage?: (count: number) => string;
  forceMount?: boolean;
  contentProps?: Record<string, unknown>;
  inputProps?: Record<string, unknown>;
}

interface SingleProps extends CommonProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

interface MultiProps extends CommonProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

function Options(): JsxChild {
  return (
    <For each={FRUITS}>
      {(fruit) => (
        <Combobox.Item
          value={fruit.value}
          label={fruit.label}
          disabled={fruit.disabled}
          data-testid={`item-${fruit.value}`}
        >
          {fruit.label}
        </Combobox.Item>
      )}
    </For>
  );
}

/** A single-select combobox in a portal with a trigger, a clear button and an empty message. */
export function Demo(props: SingleProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        outside
      </button>
      <Combobox
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
        inputValue={props.inputValue}
        defaultInputValue={props.defaultInputValue}
        onInputValueChange={props.onInputValueChange}
        disabled={props.disabled}
        required={props.required}
        name={props.name}
        form={props.form}
        dir={props.dir}
        filter={props.filter}
        shouldFilter={props.shouldFilter}
        allowCustomValue={props.allowCustomValue}
        openOnFocus={props.openOnFocus}
        autoHighlight={props.autoHighlight}
        loop={props.loop}
        itemToString={props.itemToString}
        resultsMessage={props.resultsMessage}
      >
        <Combobox.Label data-testid="label">Fruit</Combobox.Label>
        <Combobox.Anchor data-testid="anchor">
          <Combobox.Input data-testid="input" {...props.inputProps} />
          <Combobox.Clear data-testid="clear">x</Combobox.Clear>
          <Combobox.Trigger data-testid="trigger">v</Combobox.Trigger>
        </Combobox.Anchor>
        <Combobox.Portal>
          <Combobox.Content
            data-testid="content"
            forceMount={props.forceMount}
            sideOffset={4}
            {...props.contentProps}
          >
            <Options />
            <Combobox.Empty data-testid="empty">No fruit found</Combobox.Empty>
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox>
    </div>
  );
}

/** A multiple-select combobox with chips. */
export function Multi(props: MultiProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        outside
      </button>
      <Combobox
        multiple
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
        inputValue={props.inputValue}
        defaultInputValue={props.defaultInputValue}
        onInputValueChange={props.onInputValueChange}
        disabled={props.disabled}
        required={props.required}
        name={props.name}
        form={props.form}
        dir={props.dir}
        allowCustomValue={props.allowCustomValue}
        itemToString={props.itemToString}
      >
        <Combobox.Anchor data-testid="anchor">
          <Combobox.Chips data-testid="chips">
            {(chip) => (
              <Combobox.Chip value={chip.value} data-testid={`chip-${chip.value}`}>
                {chip.label()}
                <Combobox.ChipRemove data-testid={`remove-${chip.value}`}>x</Combobox.ChipRemove>
              </Combobox.Chip>
            )}
          </Combobox.Chips>
          <Combobox.Input data-testid="input" aria-label="Fruits" />
        </Combobox.Anchor>
        <Combobox.Portal>
          <Combobox.Content data-testid="content" {...props.contentProps}>
            <Options />
            <Combobox.Empty data-testid="empty">No fruit found</Combobox.Empty>
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox>
    </div>
  );
}

/** The list rendered in place (no portal): it takes part in server rendering. */
export function Inline(props: SingleProps): JsxChild {
  return (
    <div>
      <Combobox
        defaultValue={props.defaultValue}
        defaultOpen={props.defaultOpen}
        defaultInputValue={props.defaultInputValue}
        itemToString={props.itemToString}
        name={props.name}
      >
        <Combobox.Label>Fruit</Combobox.Label>
        <Combobox.Input data-testid="input" />
        <Combobox.Trigger>v</Combobox.Trigger>
        <Combobox.Content data-testid="content">
          <Combobox.Group>
            <Combobox.Label>Citrus-free</Combobox.Label>
            <Options />
          </Combobox.Group>
          <Combobox.Empty>No fruit found</Combobox.Empty>
        </Combobox.Content>
      </Combobox>
    </div>
  );
}

/** Items in labeled groups with a separator. */
export function Grouped(props: SingleProps): JsxChild {
  return (
    <Combobox defaultOpen={props.defaultOpen} defaultInputValue={props.defaultInputValue}>
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Content data-testid="content">
          <Combobox.Group data-testid="group-a">
            <Combobox.Label data-testid="group-a-label">A fruits</Combobox.Label>
            <Combobox.Item value="apple">Apple</Combobox.Item>
            <Combobox.Item value="apricot">Apricot</Combobox.Item>
          </Combobox.Group>
          <Combobox.Separator data-testid="separator" />
          <Combobox.Group data-testid="group-b">
            <Combobox.Label data-testid="group-b-label">B fruits</Combobox.Label>
            <Combobox.Item value="banana">Banana</Combobox.Item>
          </Combobox.Group>
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}

interface AsyncProps {
  search: (query: string) => Promise<string[]>;
  autoHighlight?: boolean;
  onSearch?: (query: string, reason: string) => void;
}

/**
 * A server-filtered combobox. Every keystroke asks `search` for results; a response is applied
 * only when it belongs to the latest request (a token compare), so a slow old response can never
 * overwrite a newer one.
 */
export function Async(props: AsyncProps): JsxChild {
  const [results, setResults] = useSignal<string[]>([]);
  const [loading, setLoading] = useSignal(false);
  let latest = 0;
  return (
    <Combobox
      shouldFilter={false}
      autoHighlight={props.autoHighlight}
      onInputValueChange={(text, details) => {
        props.onSearch?.(text, details.reason);
        if (details.reason !== "input") return;
        latest += 1;
        const mine = latest;
        setLoading(true);
        props.search(text).then((found) => {
          if (mine !== latest) return;
          setResults(found);
          setLoading(false);
        });
      }}
    >
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Content data-testid="content">
          <Show when={loading()}>
            <Combobox.Loading data-testid="loading">Searching...</Combobox.Loading>
          </Show>
          <For each={results()}>
            {(name) => <Combobox.Item value={name}>{name}</Combobox.Item>}
          </For>
          <Combobox.Empty data-testid="empty">No results</Combobox.Empty>
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}

/** A native form around single and multiple comboboxes. */
export function InForm(props: { submitted?: (data: FormData) => void }): JsxChild {
  return (
    <form
      data-testid="form"
      onSubmit={(event: Event) => {
        event.preventDefault();
        props.submitted?.(new FormData(event.currentTarget as HTMLFormElement));
      }}
    >
      <Combobox name="fruit" defaultValue="banana">
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Content>
            <Options />
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox>
      <Combobox multiple name="basket" defaultValue={["apple", "cherry"]}>
        <Combobox.Input data-testid="input-multi" aria-label="Basket" />
        <Combobox.Portal>
          <Combobox.Content>
            <Options />
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox>
      <button type="submit" data-testid="submit">
        send
      </button>
      <button type="reset" data-testid="reset">
        reset
      </button>
    </form>
  );
}

/** Every part rendered as another element. */
export function AsOther(): JsxChild {
  return (
    <Combobox defaultOpen defaultValue="apple">
      <Combobox.Anchor as="section" data-testid="anchor">
        <Combobox.Input data-testid="input" />
        <Combobox.Trigger as="span" data-testid="trigger">
          v
        </Combobox.Trigger>
      </Combobox.Anchor>
      <Combobox.Portal>
        <Combobox.Content as="ul" data-testid="content">
          <Combobox.Item as="li" value="apple" data-testid="item">
            Apple
          </Combobox.Item>
          <Combobox.Arrow data-testid="arrow" />
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}

/** A part used without its root. */
export function Orphan(): JsxChild {
  return <Combobox.Input />;
}

/** The application owns the item list; `items` may change at any time, even while the list is open. */
export function Dynamic(props: {
  items: string[];
  autoHighlight?: boolean;
  defaultOpen?: boolean;
  defaultValue?: string;
  labelOf?: (name: string) => string;
}): JsxChild {
  return (
    <Combobox
      shouldFilter={false}
      autoHighlight={props.autoHighlight}
      defaultOpen={props.defaultOpen}
      defaultValue={props.defaultValue}
    >
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Content data-testid="content">
          <For each={props.items}>
            {(name) => <Combobox.Item value={name}>{props.labelOf?.(name) ?? name}</Combobox.Item>}
          </For>
          <Combobox.Empty data-testid="empty">No results</Combobox.Empty>
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}

/** A combobox inside a modal dialog: both are dismissable layers on the same document. */
export function InDialog(): JsxChild {
  return (
    <Dialog defaultOpen>
      <Dialog.Portal>
        <Dialog.Content data-testid="dialog">
          <Dialog.Title>Pick</Dialog.Title>
          <Combobox>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Content data-testid="content">
                <Combobox.Item value="a" data-testid="item-a">
                  Alpha
                </Combobox.Item>
                <Combobox.Item value="b" data-testid="item-b">
                  Beta
                </Combobox.Item>
              </Combobox.Content>
            </Combobox.Portal>
          </Combobox>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

/** A search field with its results in place (`inline`), like a command palette. */
export function Palette(props: {
  open?: boolean;
  onValueChange?: (value: string | null) => void;
  onEscape?: (event: KeyboardEvent) => void;
}): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        outside
      </button>
      <Combobox inline autoHighlight open={props.open} onValueChange={props.onValueChange}>
        <Combobox.Input data-testid="input" aria-label="Search" />
        <Combobox.Content data-testid="content" onEscapeKeyDown={props.onEscape}>
          <Options />
          <Combobox.Empty data-testid="empty">No fruit found</Combobox.Empty>
        </Combobox.Content>
      </Combobox>
    </div>
  );
}
