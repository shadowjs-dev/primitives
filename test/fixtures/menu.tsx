import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Menu } from "../../src/index";

interface DemoProps {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  dir?: "ltr" | "rtl";
  loop?: boolean;
  forceMount?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAlpha?: (event: Event) => void;
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
  radio?: string;
  onRadioChange?: (value: string) => void;
  contentProps?: Record<string, unknown>;
  triggerProps?: Record<string, unknown>;
  betaProps?: Record<string, unknown>;
  checkProps?: Record<string, unknown>;
  subProps?: Record<string, unknown>;
  subContentProps?: Record<string, unknown>;
}

/** A complete dropdown in a portal: items, a disabled one, a checkbox, radios and a submenu. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <div>
      <button type="button" data-testid="before">
        before
      </button>
      <Menu
        open={props.open}
        defaultOpen={props.defaultOpen}
        modal={props.modal}
        dir={props.dir}
        onOpenChange={props.onOpenChange}
      >
        <Menu.Anchor data-testid="anchor">anchor</Menu.Anchor>
        <Menu.Portal forceMount={props.forceMount}>
          <Menu.Content
            data-testid="content"
            loop={props.loop}
            forceMount={props.forceMount}
            {...props.contentProps}
          >
            <Menu.Label data-testid="label">Actions</Menu.Label>
            <Menu.Item data-testid="alpha" onSelect={props.onAlpha}>
              Alpha
            </Menu.Item>
            <Menu.Item data-testid="beta" {...props.betaProps}>
              Beta
            </Menu.Item>
            <Menu.Item data-testid="charlie" disabled>
              Charlie
            </Menu.Item>
            <Menu.Item data-testid="delta">Delta</Menu.Item>
            <Menu.Separator data-testid="separator" />
            <Menu.CheckboxItem
              data-testid="check"
              checked={props.checked}
              onCheckedChange={props.onCheckedChange}
              {...props.checkProps}
            >
              <Menu.ItemIndicator data-testid="check-indicator">ok</Menu.ItemIndicator>
              Bookmarks
            </Menu.CheckboxItem>
            <Menu.RadioGroup
              data-testid="radios"
              value={props.radio}
              onValueChange={props.onRadioChange}
            >
              <Menu.RadioItem data-testid="light" value="light">
                <Menu.ItemIndicator>on</Menu.ItemIndicator>
                Light
              </Menu.RadioItem>
              <Menu.RadioItem data-testid="dark" value="dark">
                <Menu.ItemIndicator>on</Menu.ItemIndicator>
                Dark
              </Menu.RadioItem>
            </Menu.RadioGroup>
            <Menu.Sub>
              <Menu.SubTrigger data-testid="sub-trigger" {...props.subProps}>
                More
              </Menu.SubTrigger>
              <Menu.SubContent data-testid="sub-content" {...props.subContentProps}>
                <Menu.Item data-testid="sub-one">Sub one</Menu.Item>
                <Menu.Item data-testid="sub-two">Sub two</Menu.Item>
                <Menu.Sub>
                  <Menu.SubTrigger data-testid="deep-trigger">Deeper</Menu.SubTrigger>
                  <Menu.SubContent data-testid="deep-content">
                    <Menu.Item data-testid="deep-one">Deep one</Menu.Item>
                  </Menu.SubContent>
                </Menu.Sub>
              </Menu.SubContent>
            </Menu.Sub>
          </Menu.Content>
        </Menu.Portal>
      </Menu>
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
      <Menu defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange}>
        <Menu.Anchor>anchor</Menu.Anchor>
        <Menu.Content>
          <Menu.Item>One</Menu.Item>
          <Menu.Item>Two</Menu.Item>
          <Menu.CheckboxItem checked>
            <Menu.ItemIndicator>ok</Menu.ItemIndicator>
            Three
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu>
    </div>
  );
}

/** A part used outside its root. */
export function Orphan(): JsxChild {
  return <Menu.Item>Orphan</Menu.Item>;
}

/** Content without an open root. */
export function OrphanContent(): JsxChild {
  return <Menu.Content>x</Menu.Content>;
}

/** Polymorphic parts. */
export function AsParts(): JsxChild {
  return (
    <Menu open>
      <Menu.Anchor as="span" data-testid="anchor">
        anchor
      </Menu.Anchor>
      <Menu.Content as="section" data-testid="content">
        <Menu.Label as="h3" data-testid="label">
          Heading
        </Menu.Label>
        <Menu.Item as="a" href="#one" data-testid="one">
          One
        </Menu.Item>
        <Menu.Separator as="hr" data-testid="separator" />
        <Menu.Group as="ul" data-testid="group">
          <Menu.Item as="li" data-testid="two">
            Two
          </Menu.Item>
        </Menu.Group>
        <Menu.Sub>
          <Menu.SubTrigger as="button" data-testid="sub-trigger">
            Sub
          </Menu.SubTrigger>
          <Menu.SubContent as="section" data-testid="sub-content">
            <Menu.Item>Inside</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
      </Menu.Content>
    </Menu>
  );
}

/** Submenus rendered through their own portal, outside the parent content's DOM. */
export function PortaledSub(): JsxChild {
  return (
    <div>
      <button type="button" data-testid="after">
        after
      </button>
      <Menu defaultOpen modal={false}>
        <Menu.Anchor>anchor</Menu.Anchor>
        <Menu.Portal>
          <Menu.Content data-testid="content">
            <Menu.Item data-testid="alpha">Alpha</Menu.Item>
            <Menu.Sub>
              <Menu.SubTrigger data-testid="sub-trigger">More</Menu.SubTrigger>
              <Menu.Portal>
                <Menu.SubContent data-testid="sub-content">
                  <Menu.Item data-testid="sub-one">Sub one</Menu.Item>
                  <Menu.Item data-testid="sub-two">Sub two</Menu.Item>
                </Menu.SubContent>
              </Menu.Portal>
            </Menu.Sub>
          </Menu.Content>
        </Menu.Portal>
      </Menu>
    </div>
  );
}
