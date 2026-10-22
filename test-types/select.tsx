// Type tests: valid usage compiles, misuse is a compile error (`@ts-expect-error` must fire).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Select } from "../src/index";

export function valid(): JsxChild {
  return (
    <Select
      defaultValue="a"
      onValueChange={(value: string) => value}
      defaultOpen
      onOpenChange={(open: boolean) => open}
      name="field"
      form="the-form"
      required
      disabled
      dir="rtl"
      autoComplete="off"
    >
      <Select.Trigger class="trigger" aria-label="Field">
        <Select.Value placeholder="Pick" />
        <Select.Icon>v</Select.Icon>
      </Select.Trigger>
      <Select.Portal container={document.body}>
        <Select.Content
          side="top"
          sideOffset={4}
          align="end"
          avoidCollisions={false}
          collisionPadding={{ top: 4 }}
          forceMount
          onCloseAutoFocus={(event: Event) => event.preventDefault()}
          onEscapeKeyDown={(event: KeyboardEvent) => event.key}
        >
          <Select.ScrollUpButton>up</Select.ScrollUpButton>
          <Select.Viewport>
            <Select.Group>
              <Select.Label>Letters</Select.Label>
              <Select.Item value="a" textValue="A" disabled={false}>
                <Select.ItemText>A</Select.ItemText>
                <Select.ItemIndicator>v</Select.ItemIndicator>
              </Select.Item>
            </Select.Group>
            <Select.Separator />
          </Select.Viewport>
          <Select.ScrollDownButton>down</Select.ScrollDownButton>
          <Select.Arrow width={10} height={5} />
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

export function asOther(): JsxChild {
  return (
    <Select>
      <Select.Trigger as="div" />
      <Select.Content as="section">
        <Select.Item as="li" value="a" />
      </Select.Content>
    </Select>
  );
}

export function wrongAs(): JsxChild {
  return (
    <Select>
      {/* @ts-expect-error `href` is not an attribute of a button */}
      <Select.Trigger href="#x" />
      {/* @ts-expect-error `value` is not an attribute of a section */}
      <Select.Content as="section" value="x" />
    </Select>
  );
}

export function wrongProps(): JsxChild {
  return (
    <>
      {/* @ts-expect-error `value` is a string */}
      <Select value={1} />
      {/* @ts-expect-error `onValueChange` receives a string */}
      <Select onValueChange={(value: number) => value} />
      {/* @ts-expect-error `onOpenChange` receives a boolean */}
      <Select onOpenChange={(open: string) => open} />
      {/* @ts-expect-error `dir` takes ltr | rtl */}
      <Select dir="auto" />
      {/* @ts-expect-error `required` is a boolean */}
      <Select required="yes" />
    </>
  );
}

export function wrongItems(): JsxChild {
  return (
    <Select>
      {/* @ts-expect-error an item needs a value */}
      <Select.Item />
      {/* @ts-expect-error `value` is a string */}
      <Select.Item value={2} />
      {/* @ts-expect-error `disabled` is a boolean */}
      <Select.Item value="a" disabled="yes" />
      {/* @ts-expect-error `side` takes top | right | bottom | left */}
      <Select.Content side="middle" />
    </Select>
  );
}
