// Type tests: valid usage compiles, misuse is a compile error (`@ts-expect-error` must fire).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { HoverCard } from "../src/index";

export function valid(): JsxChild {
  return (
    <HoverCard defaultOpen openDelay={300} closeDelay={100} onOpenChange={(open: boolean) => open}>
      <HoverCard.Trigger href="/ada" class="link" target="_blank">
        @ada
      </HoverCard.Trigger>
      <HoverCard.Portal forceMount container={document.body}>
        <HoverCard.Content
          side="top"
          sideOffset={6}
          align="start"
          alignOffset={2}
          avoidCollisions={false}
          collisionPadding={8}
          sticky="always"
          hideWhenDetached
          arrowPadding={2}
          dir="rtl"
          forceMount
          onEscapeKeyDown={(event: KeyboardEvent) => event.key}
          onPointerDownOutside={(event: Event) => event.preventDefault()}
          onInteractOutside={(event: Event) => event.preventDefault()}
        >
          Ada Lovelace
          <HoverCard.Arrow width={10} height={5} />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard>
  );
}

export function asButton(): JsxChild {
  return (
    <HoverCard>
      <HoverCard.Trigger as="button" type="button">
        More
      </HoverCard.Trigger>
    </HoverCard>
  );
}

export function wrongAs(): JsxChild {
  return (
    <HoverCard>
      {/* @ts-expect-error `value` is not an attribute of an anchor */}
      <HoverCard.Trigger value="x">More</HoverCard.Trigger>
      {/* @ts-expect-error `href` is not an attribute of a section */}
      <HoverCard.Content as="section" href="/x" />
    </HoverCard>
  );
}

export function wrongProps(): JsxChild {
  return (
    <div>
      {/* @ts-expect-error `openDelay` is a number of milliseconds */}
      <HoverCard openDelay="slow" />
      {/* @ts-expect-error `closeDelay` is a number of milliseconds */}
      <HoverCard closeDelay="soon" />
      {/* @ts-expect-error `onOpenChange` receives a boolean */}
      <HoverCard onOpenChange={(open: string) => open} />
      <HoverCard>
        {/* @ts-expect-error `side` takes top | right | bottom | left */}
        <HoverCard.Content side="middle" />
        {/* @ts-expect-error `align` takes start | center | end */}
        <HoverCard.Content align="left" />
        {/* @ts-expect-error `sideOffset` is a number */}
        <HoverCard.Content sideOffset="4px" />
      </HoverCard>
    </div>
  );
}
