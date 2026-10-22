import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { ContextMenu } from "../../src/index";

interface DemoProps {
  modal?: boolean;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  forceMount?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAlpha?: (event: Event) => void;
  contentProps?: Record<string, unknown>;
  triggerProps?: Record<string, unknown>;
}

/** A context menu in a portal over a large area, with a button before and after it. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="before">
        before
      </button>
      <ContextMenu modal={props.modal} dir={props.dir} onOpenChange={props.onOpenChange}>
        <ContextMenu.Trigger
          as="div"
          data-testid="trigger"
          disabled={props.disabled}
          {...props.triggerProps}
        >
          Right click here
        </ContextMenu.Trigger>
        <ContextMenu.Portal forceMount={props.forceMount}>
          <ContextMenu.Content
            data-testid="content"
            forceMount={props.forceMount}
            {...props.contentProps}
          >
            <ContextMenu.Item data-testid="alpha" onSelect={props.onAlpha}>
              Alpha
            </ContextMenu.Item>
            <ContextMenu.Item data-testid="beta">Beta</ContextMenu.Item>
            <ContextMenu.CheckboxItem data-testid="check" checked>
              <ContextMenu.ItemIndicator>ok</ContextMenu.ItemIndicator>
              Bookmarks
            </ContextMenu.CheckboxItem>
            <ContextMenu.Separator />
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger data-testid="sub-trigger">More</ContextMenu.SubTrigger>
              <ContextMenu.SubContent data-testid="sub-content">
                <ContextMenu.Item data-testid="sub-one">Sub one</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
      <button type="button" data-testid="after">
        after
      </button>
    </div>
  );
}

/** The trigger as the default span, content in place (server friendly). */
export function Inline(props: DemoProps): JsxChild {
  return (
    <ContextMenu onOpenChange={props.onOpenChange}>
      <ContextMenu.Trigger data-testid="trigger">Area</ContextMenu.Trigger>
      <ContextMenu.Content data-testid="content">
        <ContextMenu.Item>One</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu>
  );
}

/** A part used outside its root. */
export function Orphan(): JsxChild {
  return <ContextMenu.Trigger>Orphan</ContextMenu.Trigger>;
}
