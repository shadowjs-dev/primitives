// biome-ignore-all lint/a11y: fixtures check typing; accessibility rules do not apply to them
/**
 * Type tests for DropdownMenu and the shared Menu core: valid usage compiles, misuse is a compile
 * error (`@ts-expect-error` proves each rejection).
 * @since 1.0.0
 */
import { DropdownMenu, Menu } from "../src/index";

declare function sink(...values: readonly unknown[]): void;

sink(
  <DropdownMenu>
    <DropdownMenu.Trigger>options</DropdownMenu.Trigger>
    <DropdownMenu.Portal container={() => document.body} forceMount>
      <DropdownMenu.Content
        loop
        side="bottom"
        sideOffset={4}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.detail.originalEvent.button}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenu.Label>actions</DropdownMenu.Label>
        <DropdownMenu.Group>
          <DropdownMenu.Item disabled textValue="New" onSelect={(event) => event.preventDefault()}>
            new
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.CheckboxItem
          checked="indeterminate"
          onCheckedChange={(checked: boolean) => checked}
        >
          <DropdownMenu.ItemIndicator forceMount>ok</DropdownMenu.ItemIndicator>
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.RadioGroup value="a" onValueChange={(value: string) => value}>
          <DropdownMenu.RadioItem value="a">a</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
        <DropdownMenu.Separator />
        <DropdownMenu.Sub onOpenChange={(open: boolean) => open}>
          <DropdownMenu.SubTrigger>more</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent sideOffset={2}>
            <DropdownMenu.Item>deep</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Arrow width={10} height={5} />
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu>,
);

// Controlled and uncontrolled.
sink(<DropdownMenu open onOpenChange={(open: boolean) => open} />);
sink(<DropdownMenu defaultOpen modal={false} dir="rtl" />);

// Parts take the attributes of the element they render as.
sink(<DropdownMenu.Trigger as="a" href="/x" />);
sink(<DropdownMenu.Trigger disabled />);
sink(<DropdownMenu.Item as="a" href="/x" />);
sink(<DropdownMenu.Content as="section" />);

// The core is usable on its own.
sink(
  <Menu open onOpenChange={(open: boolean) => open} modal={false}>
    <Menu.Anchor />
    <Menu.Portal>
      <Menu.Content>
        <Menu.Item>x</Menu.Item>
      </Menu.Content>
    </Menu.Portal>
  </Menu>,
);

// Misuse is a compile error.
// @ts-expect-error `open` is a boolean
sink(<DropdownMenu open="yes" />);
// @ts-expect-error `onOpenChange` receives a boolean
sink(<DropdownMenu onOpenChange={(open: string) => open} />);
// @ts-expect-error `dir` is "ltr" or "rtl"
sink(<DropdownMenu dir="up" />);
// @ts-expect-error `href` does not exist on a button
sink(<DropdownMenu.Trigger href="/x" />);
// @ts-expect-error a radio item needs its value
sink(<DropdownMenu.RadioItem>x</DropdownMenu.RadioItem>);
// @ts-expect-error `checked` is a boolean or "indeterminate"
sink(<DropdownMenu.CheckboxItem checked="yes" />);
// @ts-expect-error `onCheckedChange` receives a boolean
sink(<DropdownMenu.CheckboxItem onCheckedChange={(checked: string) => checked} />);
// @ts-expect-error `disabled` is a boolean
sink(<DropdownMenu.Item disabled="yes" />);
// @ts-expect-error `loop` is a boolean
sink(<DropdownMenu.Content loop="yes" />);
// @ts-expect-error `as` takes a tag name or a component
sink(<DropdownMenu.Item as="not-a-tag-in-the-table" />);
