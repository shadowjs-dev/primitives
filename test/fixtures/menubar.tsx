import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Menubar } from "../../src/index";

interface DemoProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  dir?: "ltr" | "rtl";
  loop?: boolean;
  onNew?: (event: Event) => void;
  fileProps?: Record<string, unknown>;
}

/** File / Edit / View menus and a disabled Help between them and the end. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="before">
        before
      </button>
      <Menubar
        data-testid="bar"
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        dir={props.dir}
        loop={props.loop}
      >
        <Menubar.Menu value="file">
          <Menubar.Trigger data-testid="t-file" {...props.fileProps}>
            File
          </Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-file">
              <Menubar.Item data-testid="new" onSelect={props.onNew}>
                New
              </Menubar.Item>
              <Menubar.Item data-testid="open">Open</Menubar.Item>
              <Menubar.Sub>
                <Menubar.SubTrigger data-testid="share">Share</Menubar.SubTrigger>
                <Menubar.SubContent data-testid="share-content">
                  <Menubar.Item data-testid="email">Email</Menubar.Item>
                </Menubar.SubContent>
              </Menubar.Sub>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger data-testid="t-edit">Edit</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-edit">
              <Menubar.Item data-testid="undo">Undo</Menubar.Item>
              <Menubar.Item data-testid="redo">Redo</Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
        <Menubar.Menu value="help">
          <Menubar.Trigger data-testid="t-help" disabled>
            Help
          </Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-help">
              <Menubar.Item>About</Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
        <Menubar.Menu value="view">
          <Menubar.Trigger data-testid="t-view">View</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-view">
              <Menubar.CheckboxItem data-testid="grid" checked>
                <Menubar.ItemIndicator>ok</Menubar.ItemIndicator>
                Grid
              </Menubar.CheckboxItem>
              <Menubar.Separator />
              <Menubar.Item data-testid="zoom">Zoom</Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
      </Menubar>
      <button type="button" data-testid="after">
        after
      </button>
    </div>
  );
}

/** Menus without values: each gets a generated one. */
export function AutoValues(props: DemoProps): JsxChild {
  return (
    <Menubar onValueChange={props.onValueChange}>
      <Menubar.Menu>
        <Menubar.Trigger data-testid="t-one">One</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content data-testid="c-one">
            <Menubar.Item>A</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger data-testid="t-two">Two</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content data-testid="c-two">
            <Menubar.Item>B</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar>
  );
}

/** Content in place (no portal): renders on the server when its menu is open. */
export function Inline(props: DemoProps): JsxChild {
  return (
    <Menubar defaultValue={props.defaultValue}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>New</Menubar.Item>
          <Menubar.Item>Open</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Undo</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  );
}

/** Polymorphic parts. */
export function AsParts(): JsxChild {
  return (
    <Menubar as="nav" data-testid="bar" defaultValue="file">
      <Menubar.Menu value="file">
        <Menubar.Trigger as="a" href="#file" data-testid="t-file">
          File
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content as="section" data-testid="c-file">
            <Menubar.Item as="a" href="#new" data-testid="new">
              New
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar>
  );
}

/** A part used outside its root. */
export function Orphan(): JsxChild {
  return <Menubar.Trigger>Orphan</Menubar.Trigger>;
}
