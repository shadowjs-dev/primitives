import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Tooltip } from "../../src/index";

interface DemoProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
  forceMount?: boolean;
  contentProps?: Record<string, unknown>;
}

/** Two tooltips in one provider, a button outside, and content with an arrow. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <Tooltip.Provider
      delayDuration={props.delayDuration}
      skipDelayDuration={props.skipDelayDuration}
      disableHoverableContent={props.disableHoverableContent}
    >
      <button type="button" data-testid="outside">
        outside
      </button>
      <Tooltip
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
      >
        <Tooltip.Trigger data-testid="trigger-a">Bold</Tooltip.Trigger>
        <Tooltip.Portal forceMount={props.forceMount}>
          <Tooltip.Content data-testid="content-a" forceMount={props.forceMount} {...props.contentProps}>
            Make it bold
            <Tooltip.Arrow data-testid="arrow-a" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger data-testid="trigger-b">Italic</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content data-testid="content-b">Make it italic</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip>
    </Tooltip.Provider>
  );
}

/** A tooltip with no provider around it. */
export function Alone(): JsxChild {
  return (
    <Tooltip>
      <Tooltip.Trigger data-testid="trigger">Alone</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content data-testid="content">Tip</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip>
  );
}

/** Content without a portal: renders on the server when open. */
export function Inline(props: DemoProps): JsxChild {
  return (
    <div>
      <Tooltip open={props.open} defaultOpen={props.defaultOpen}>
        <Tooltip.Trigger>Hint</Tooltip.Trigger>
        <Tooltip.Content>Helpful text</Tooltip.Content>
      </Tooltip>
    </div>
  );
}

/** Parts rendered as other elements. */
export function AsOther(): JsxChild {
  return (
    <Tooltip defaultOpen>
      <Tooltip.Trigger as="a" href="#more" data-testid="trigger">
        More
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content as="section" data-testid="content">
          Tip
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip>
  );
}

/** A part used without its root. */
export function Orphan(): JsxChild {
  return <Tooltip.Trigger>Orphan</Tooltip.Trigger>;
}
