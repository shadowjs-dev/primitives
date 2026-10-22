// Type tests: valid usage compiles, misuse is a compile error (`@ts-expect-error` must fire).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Popover } from "../src/index";

export function valid(): JsxChild {
  return (
    <Popover defaultOpen modal onOpenChange={(open: boolean) => open}>
      <Popover.Trigger class="trigger" disabled>
        Open
      </Popover.Trigger>
      <Popover.Anchor class="anchor" />
      <Popover.Portal forceMount container={document.body}>
        <Popover.Content
          side="top"
          sideOffset={4}
          align="end"
          alignOffset={2}
          avoidCollisions={false}
          collisionPadding={{ top: 4 }}
          sticky="always"
          hideWhenDetached
          arrowPadding={2}
          dir="rtl"
          forceMount
          onOpenAutoFocus={(event: Event) => event.preventDefault()}
          onCloseAutoFocus={(event: Event) => event.preventDefault()}
          onEscapeKeyDown={(event: KeyboardEvent) => event.key}
          aria-label="Details"
        >
          <Popover.Title>Title</Popover.Title>
          <Popover.Description>Description</Popover.Description>
          <Popover.Arrow width={10} height={5} />
          <Popover.Close>Close</Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
}

export function asLink(): JsxChild {
  return (
    <Popover>
      <Popover.Trigger as="a" href="#more">
        More
      </Popover.Trigger>
    </Popover>
  );
}

export function wrongAs(): JsxChild {
  return (
    <Popover>
      {/* @ts-expect-error `href` is not an attribute of a button */}
      <Popover.Trigger href="#more">More</Popover.Trigger>
      {/* @ts-expect-error `value` is not an attribute of a section */}
      <Popover.Content as="section" value="x" />
    </Popover>
  );
}

export function wrongProps(): JsxChild {
  return (
    <Popover>
      {/* @ts-expect-error `side` takes top | right | bottom | left */}
      <Popover.Content side="middle" />
      {/* @ts-expect-error `align` takes start | center | end */}
      <Popover.Content align="left" />
      {/* @ts-expect-error `sideOffset` is a number */}
      <Popover.Content sideOffset="4px" />
      {/* @ts-expect-error `modal` is a boolean */}
      <Popover modal="yes" />
      {/* @ts-expect-error `onOpenChange` receives a boolean */}
      <Popover onOpenChange={(open: string) => open} />
    </Popover>
  );
}

export function wrongPortal(): JsxChild {
  return (
    <Popover>
      {/* @ts-expect-error `container` is an element, not a string */}
      <Popover.Portal container="body" />
    </Popover>
  );
}
