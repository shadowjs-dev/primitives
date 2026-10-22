// Type tests: valid usage compiles, misuse is rejected by `@ts-expect-error` (an unused directive is an error).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Combobox, comboboxDefaultFilter, filterComboboxItems } from "../src/index";

export const single: JsxChild = (
  <Combobox
    defaultValue="a"
    onValueChange={(value: string | null) => value}
    onInputValueChange={(text: string, details) => [text, details.reason]}
    shouldFilter={false}
    allowCustomValue
    inline
    filter={(item, query) => item.label.includes(query)}
    itemToString={(value: string) => value.toUpperCase()}
  >
    <Combobox.Anchor as="section">
      <Combobox.Input placeholder="Search" />
      <Combobox.Trigger aria-label="Open" />
      <Combobox.Clear />
    </Combobox.Anchor>
    <Combobox.Portal>
      <Combobox.Content
        forceMount
        side="bottom"
        align="start"
        onEscapeKeyDown={(event: KeyboardEvent) => event}
      >
        <Combobox.Group>
          <Combobox.Label>Fruits</Combobox.Label>
          <Combobox.Item value="a" label="Apple" disabled>
            Apple
          </Combobox.Item>
        </Combobox.Group>
        <Combobox.Separator />
        <Combobox.Empty>None</Combobox.Empty>
        <Combobox.Loading>...</Combobox.Loading>
        <Combobox.Arrow />
      </Combobox.Content>
    </Combobox.Portal>
  </Combobox>
);

export const multiple: JsxChild = (
  <Combobox multiple defaultValue={["a"]} onValueChange={(value: string[]) => value.length}>
    <Combobox.Chips>
      {(chip) => (
        <Combobox.Chip value={chip.value}>
          {chip.label()}
          <Combobox.ChipRemove />
        </Combobox.Chip>
      )}
    </Combobox.Chips>
    <Combobox.Input />
  </Combobox>
);

// @ts-expect-error a single combobox takes a string or null, not a list
export const listWithoutMultiple: JsxChild = <Combobox value={["a"]} />;

// @ts-expect-error a multiple combobox takes a list
export const stringWithMultiple: JsxChild = <Combobox multiple value="a" />;

// @ts-expect-error every item needs a value
export const itemWithoutValue: JsxChild = <Combobox.Item>Apple</Combobox.Item>;

// @ts-expect-error the value is a string
export const numericValue: JsxChild = <Combobox.Item value={1} />;

// @ts-expect-error a chip needs the value it stands for
export const chipWithoutValue: JsxChild = <Combobox.Chip />;

// @ts-expect-error dir is "ltr" or "rtl"
export const badDirection: JsxChild = <Combobox dir="auto" />;

export const matches: boolean = comboboxDefaultFilter({ value: "a", label: "Apple" }, "app");
export const filtered: { value: string; label: string }[] = filterComboboxItems(
  [{ value: "a", label: "Apple" }],
  "a",
);
