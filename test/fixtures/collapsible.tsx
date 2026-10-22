import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Collapsible } from "../../src/index";

interface DemoProps {
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  forceMount?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentProps?: Record<string, unknown>;
  triggerProps?: Record<string, unknown>;
}

/** A collapsible with a trigger and a content part. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <Collapsible
      data-testid="root"
      open={props.open}
      defaultOpen={props.defaultOpen}
      disabled={props.disabled}
      onOpenChange={props.onOpenChange}
    >
      <Collapsible.Trigger data-testid="trigger" {...props.triggerProps}>
        Toggle
      </Collapsible.Trigger>
      <Collapsible.Content data-testid="content" forceMount={props.forceMount} {...props.contentProps}>
        <p>Details</p>
      </Collapsible.Content>
    </Collapsible>
  );
}

/** Every part rendered as another element. */
export function AsOther(): JsxChild {
  return (
    <Collapsible as="section" data-testid="root" defaultOpen>
      <Collapsible.Trigger as="div" data-testid="trigger">
        Toggle
      </Collapsible.Trigger>
      <Collapsible.Content as="article" data-testid="content">
        Details
      </Collapsible.Content>
    </Collapsible>
  );
}

/** A part used without its root. */
export function Orphan(): JsxChild {
  return <Collapsible.Trigger>Orphan</Collapsible.Trigger>;
}

/** An open collapsible whose content part is never rendered. */
export function OpenWithoutContent(): JsxChild {
  return (
    <Collapsible defaultOpen>
      <Collapsible.Trigger data-testid="trigger">Toggle</Collapsible.Trigger>
    </Collapsible>
  );
}
