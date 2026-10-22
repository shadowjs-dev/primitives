// biome-ignore-all lint/a11y: fixtures check typing; accessibility rules do not apply to them
/**
 * Type tests for Menubar: valid usage compiles, misuse is a compile error
 * (`@ts-expect-error` proves each rejection).
 * @since 1.0.0
 */
import { Menubar } from "../src/index";

declare function sink(...values: readonly unknown[]): void;

sink(
  <Menubar value="file" onValueChange={(value: string) => value} dir="rtl" loop class="bar">
    <Menubar.Menu value="file">
      <Menubar.Trigger disabled>File</Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content sideOffset={8} onInteractOutside={(event) => event.preventDefault()}>
          <Menubar.Item>new</Menubar.Item>
          <Menubar.Separator />
          <Menubar.CheckboxItem checked={false}>grid</Menubar.CheckboxItem>
          <Menubar.Sub>
            <Menubar.SubTrigger>share</Menubar.SubTrigger>
            <Menubar.SubContent>
              <Menubar.Item>email</Menubar.Item>
            </Menubar.SubContent>
          </Menubar.Sub>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>
    <Menubar.Menu>
      <Menubar.Trigger as="a" href="/x">
        Edit
      </Menubar.Trigger>
    </Menubar.Menu>
  </Menubar>,
);

sink(<Menubar defaultValue="" as="nav" />);

// Misuse is a compile error.
// @ts-expect-error `value` is the string value of the open menu
sink(<Menubar value={1} />);
// @ts-expect-error `onValueChange` receives a string
sink(<Menubar onValueChange={(value: number) => value} />);
// @ts-expect-error `loop` is a boolean
sink(<Menubar loop="yes" />);
// @ts-expect-error `dir` is "ltr" or "rtl"
sink(<Menubar dir="up" />);
// @ts-expect-error `value` of a menu is a string
sink(<Menubar.Menu value={1} />);
// @ts-expect-error `disabled` is a boolean
sink(<Menubar.Trigger disabled="yes" />);
// @ts-expect-error `href` does not exist on a button
sink(<Menubar.Trigger href="/x" />);
