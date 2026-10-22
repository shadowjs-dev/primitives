import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { HoverCard } from "../../src/index";

interface DemoProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  forceMount?: boolean;
  contentProps?: Record<string, unknown>;
  triggerProps?: Record<string, unknown>;
}

/** A hover card with a link and a button inside, and a button outside. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="outside">
        outside
      </button>
      <HoverCard
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
        openDelay={props.openDelay}
        closeDelay={props.closeDelay}
      >
        <HoverCard.Trigger href="/ada" data-testid="trigger" {...props.triggerProps}>
          @ada
        </HoverCard.Trigger>
        <HoverCard.Portal forceMount={props.forceMount}>
          <HoverCard.Content data-testid="content" forceMount={props.forceMount} {...props.contentProps}>
            <p data-testid="text">Ada Lovelace</p>
            <a href="/ada/posts" data-testid="inner-link">
              Posts
            </a>
            <button type="button" data-testid="inner-button">
              Follow
            </button>
            <HoverCard.Arrow data-testid="arrow" />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard>
    </div>
  );
}

/** Content without a portal: renders on the server when open. */
export function Inline(props: DemoProps): JsxChild {
  return (
    <div>
      <HoverCard open={props.open} defaultOpen={props.defaultOpen}>
        <HoverCard.Trigger href="/ada">@ada</HoverCard.Trigger>
        <HoverCard.Content>
          <a href="/ada/posts">Posts</a>
        </HoverCard.Content>
      </HoverCard>
    </div>
  );
}

/** Parts rendered as other elements. */
export function AsOther(): JsxChild {
  return (
    <HoverCard defaultOpen>
      <HoverCard.Trigger as="button" type="button" data-testid="trigger">
        More
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content as="section" data-testid="content">
          Card
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard>
  );
}

/** A part used without its root. */
export function Orphan(): JsxChild {
  return <HoverCard.Trigger href="/x">Orphan</HoverCard.Trigger>;
}
