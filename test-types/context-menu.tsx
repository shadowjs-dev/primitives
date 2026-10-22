// biome-ignore-all lint/a11y: fixtures check typing; accessibility rules do not apply to them
/**
 * Type tests for ContextMenu: valid usage compiles, misuse is a compile error
 * (`@ts-expect-error` proves each rejection).
 * @since 1.0.0
 */
import { ContextMenu } from "../src/index";

declare function sink(...values: readonly unknown[]): void;

sink(
  <ContextMenu onOpenChange={(open: boolean) => open} modal={false} dir="rtl">
    <ContextMenu.Trigger as="div" disabled class="area">
      right click
    </ContextMenu.Trigger>
    <ContextMenu.Portal>
      <ContextMenu.Content side="left" onInteractOutside={(event) => event.preventDefault()}>
        <ContextMenu.Item onSelect={(event) => event.preventDefault()}>copy</ContextMenu.Item>
        <ContextMenu.CheckboxItem checked>bookmarks</ContextMenu.CheckboxItem>
        <ContextMenu.RadioGroup defaultValue="a">
          <ContextMenu.RadioItem value="a">a</ContextMenu.RadioItem>
        </ContextMenu.RadioGroup>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>more</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>x</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.Content>
    </ContextMenu.Portal>
  </ContextMenu>,
);

// The trigger takes the attributes of the element it renders as.
sink(<ContextMenu.Trigger as="section" id="x" />);

// Misuse is a compile error.
// @ts-expect-error a context menu has no `open` prop: it opens where the user asks
sink(<ContextMenu open />);
// @ts-expect-error `onOpenChange` receives a boolean
sink(<ContextMenu onOpenChange={(open: string) => open} />);
// @ts-expect-error `modal` is a boolean
sink(<ContextMenu modal="yes" />);
// @ts-expect-error `disabled` is a boolean
sink(<ContextMenu.Trigger disabled="yes" />);
// @ts-expect-error `href` does not exist on a span
sink(<ContextMenu.Trigger href="/x" />);
// @ts-expect-error `side` is one of the four sides
sink(<ContextMenu.Content side="middle" />);
