// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Menubar } from "../../src/index";

/** A two-menu menubar inside a wrapper with `dir="rtl"`; the Menubar itself gets no dir prop. */
export function InRtlWrapper(): JsxChild {
  return (
    <div data-testid="wrapper" dir="rtl">
      <Menubar data-testid="bar">
        <Menubar.Menu value="file">
          <Menubar.Trigger data-testid="t-file">File</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-file">
              <Menubar.Item data-testid="new">New</Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger data-testid="t-edit">Edit</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content data-testid="c-edit">
              <Menubar.Item data-testid="undo">Undo</Menubar.Item>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
      </Menubar>
    </div>
  );
}
