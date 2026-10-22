// Type tests: valid usage compiles, misuse is a compile error (`@ts-expect-error` must fire).
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Tooltip } from "../src/index";

export function valid(): JsxChild {
  return (
    <Tooltip.Provider delayDuration={400} skipDelayDuration={100} disableHoverableContent>
      <Tooltip
        defaultOpen
        delayDuration={0}
        disableHoverableContent={false}
        onOpenChange={(open: boolean) => open}
      >
        <Tooltip.Trigger class="trigger" disabled>
          Save
        </Tooltip.Trigger>
        <Tooltip.Portal forceMount container={document.body}>
          <Tooltip.Content
            side="right"
            sideOffset={4}
            align="start"
            avoidCollisions={false}
            collisionPadding={8}
            arrowPadding={2}
            ariaLabel="Save the document"
            forceMount
            onEscapeKeyDown={(event: KeyboardEvent) => event.key}
            onPointerDownOutside={(event: Event) => event.preventDefault()}
          >
            Save
            <Tooltip.Arrow width={10} height={5} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip>
    </Tooltip.Provider>
  );
}

export function asLink(): JsxChild {
  return (
    <Tooltip>
      <Tooltip.Trigger as="a" href="#more">
        More
      </Tooltip.Trigger>
    </Tooltip>
  );
}

export function wrongAs(): JsxChild {
  return (
    <Tooltip>
      {/* @ts-expect-error `href` is not an attribute of a button */}
      <Tooltip.Trigger href="#more">More</Tooltip.Trigger>
      {/* @ts-expect-error `value` is not an attribute of a section */}
      <Tooltip.Content as="section" value="x" />
    </Tooltip>
  );
}

export function wrongProps(): JsxChild {
  return (
    <Tooltip.Provider>
      {/* @ts-expect-error `delayDuration` is a number of milliseconds */}
      <Tooltip delayDuration="slow" />
      {/* @ts-expect-error `disableHoverableContent` is a boolean */}
      <Tooltip disableHoverableContent="yes" />
      <Tooltip>
        {/* @ts-expect-error `side` takes top | right | bottom | left */}
        <Tooltip.Content side="middle" />
        {/* @ts-expect-error `ariaLabel` is a string */}
        <Tooltip.Content ariaLabel={3} />
      </Tooltip>
      {/* @ts-expect-error `onOpenChange` receives a boolean */}
      <Tooltip onOpenChange={(open: string) => open} />
      {/* @ts-expect-error `skipDelayDuration` is a number */}
      <Tooltip.Provider skipDelayDuration="soon" />
    </Tooltip.Provider>
  );
}
