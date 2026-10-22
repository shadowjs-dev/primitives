// biome-ignore-all lint/a11y: test fixture exercising headless parts
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { ContextMenu, DropdownMenu } from "../../src/index";

/** A dropdown menu with a submenu inside a wrapper with `dir="rtl"`; the menu gets no dir prop. */
export function DropdownInRtl(): JsxChild {
  return (
    <div data-testid="wrapper" dir="rtl">
      <DropdownMenu>
        <DropdownMenu.Trigger data-testid="trigger">Options</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content data-testid="content">
            <DropdownMenu.Item data-testid="one">One</DropdownMenu.Item>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger data-testid="sub-trigger">More</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent data-testid="sub-content">
                <DropdownMenu.Item data-testid="sub-one">Share</DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu>
    </div>
  );
}

/** The same dropdown inside a wrapper with `dir="ltr"`, in a document that is rtl. */
export function DropdownInLtr(): JsxChild {
  return (
    <div data-testid="wrapper" dir="ltr">
      <DropdownMenu>
        <DropdownMenu.Trigger data-testid="trigger">Options</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content data-testid="content">
            <DropdownMenu.Item data-testid="one">One</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu>
    </div>
  );
}

/** A context menu with a submenu inside a wrapper with `dir="rtl"`. */
export function ContextInRtl(): JsxChild {
  return (
    <div data-testid="wrapper" dir="rtl">
      <ContextMenu>
        <ContextMenu.Trigger data-testid="area">Right-click here</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content data-testid="content">
            <ContextMenu.Item data-testid="one">One</ContextMenu.Item>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger data-testid="sub-trigger">More</ContextMenu.SubTrigger>
              <ContextMenu.SubContent data-testid="sub-content">
                <ContextMenu.Item data-testid="sub-one">Share</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    </div>
  );
}
