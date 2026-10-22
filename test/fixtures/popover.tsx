import { useSignal } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Popover } from "../../src/index";

interface DemoProps {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentProps?: Record<string, unknown>;
  forceMount?: boolean;
}

/** A complete popover in a portal, with a form and a button outside to press. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        outside
      </button>
      <Popover
        open={props.open}
        defaultOpen={props.defaultOpen}
        modal={props.modal}
        onOpenChange={props.onOpenChange}
      >
        <Popover.Trigger data-testid="trigger">Dimensions</Popover.Trigger>
        <Popover.Portal forceMount={props.forceMount}>
          <Popover.Content
            data-testid="content"
            forceMount={props.forceMount}
            sideOffset={4}
            {...props.contentProps}
          >
            <Popover.Title>Dimensions</Popover.Title>
            <Popover.Description>Set the size.</Popover.Description>
            <input data-testid="first" />
            <input data-testid="last" />
            <Popover.Arrow data-testid="arrow" />
            <Popover.Close data-testid="close">Done</Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
      <button type="button" data-testid="after">
        after
      </button>
    </div>
  );
}

/** Content without a portal: renders on the server when open. */
export function Inline(props: DemoProps): JsxChild {
  return (
    <div>
      <Popover open={props.open} defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content aria-label="Inline">
          <Popover.Title>Inline</Popover.Title>
          <button type="button">Inside</button>
        </Popover.Content>
      </Popover>
    </div>
  );
}

/** A popover opened from inside another popover. */
export function Nested(): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        page
      </button>
      <Popover>
        <Popover.Trigger data-testid="outer-trigger">Outer</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content data-testid="outer-content" aria-label="Outer">
            <button type="button" data-testid="outer-button">
              outer action
            </button>
            <Popover>
              <Popover.Trigger data-testid="inner-trigger">Inner</Popover.Trigger>
              <Popover.Portal>
                <Popover.Content data-testid="inner-content" aria-label="Inner">
                  <button type="button" data-testid="inner-button">
                    inner action
                  </button>
                </Popover.Content>
              </Popover.Portal>
            </Popover>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </div>
  );
}

/** A custom anchor that is not the trigger, which can be removed. */
export function CustomAnchor(props: { showAnchor?: boolean }): JsxChild {
  return (
    <Popover defaultOpen>
      <Show when={props.showAnchor !== false}>
        <Popover.Anchor data-testid="anchor">anchor</Popover.Anchor>
      </Show>
      <Popover.Trigger data-testid="trigger">Open</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content data-testid="content" aria-label="Anchored">
          body
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
}

/** Parts rendered as other elements. */
export function AsOther(): JsxChild {
  return (
    <Popover defaultOpen>
      <Popover.Trigger as="a" href="#more" data-testid="trigger">
        More
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content as="section" data-testid="content" aria-label="More">
          <Popover.Close as="a" href="#x" data-testid="close">
            x
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
}

/** A part used without its root. */
export function Orphan(): JsxChild {
  return <Popover.Trigger>Orphan</Popover.Trigger>;
}

/** Title and description absent: only an aria-label names the content. */
export function Unlabeled(): JsxChild {
  return (
    <Popover defaultOpen>
      <Popover.Portal>
        <Popover.Content data-testid="content">plain</Popover.Content>
      </Popover.Portal>
    </Popover>
  );
}

/** A popover with no Popover.Trigger: an anchor and a button of the application's own. */
export function NoTrigger(): JsxChild {
  const [open, setOpen] = useSignal(false);
  return (
    <div>
      <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
        Open
      </button>
      <Popover open={open()} onOpenChange={(next: boolean) => setOpen(next)}>
        <Popover.Anchor data-testid="anchor">anchor</Popover.Anchor>
        <Popover.Portal>
          <Popover.Content data-testid="content" aria-label="Controlled">
            <input data-testid="first" />
            <Popover.Close data-testid="close">Done</Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </div>
  );
}
