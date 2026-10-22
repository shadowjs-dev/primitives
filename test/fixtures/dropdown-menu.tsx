import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { DropdownMenu } from "../../src/index";

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
      <DropdownMenu
        open={props.open}
        defaultOpen={props.defaultOpen}
        modal={props.modal}
        dir={props.dir}
        onOpenChange={props.onOpenChange}
      >
        <DropdownMenu.Trigger data-testid="trigger" {...props.triggerProps}>
          Options
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal forceMount={props.forceMount}>
          <DropdownMenu.Content
            data-testid="content"
            loop={props.loop}
            forceMount={props.forceMount}
            {...props.contentProps}
          >
            <DropdownMenu.Label data-testid="label">Actions</DropdownMenu.Label>
            <DropdownMenu.Item data-testid="alpha" onSelect={props.onAlpha}>
              Alpha
            </DropdownMenu.Item>
            <DropdownMenu.Item data-testid="beta" {...props.betaProps}>
              Beta
            </DropdownMenu.Item>
            <DropdownMenu.Item data-testid="charlie" disabled>
              Charlie
            </DropdownMenu.Item>
            <DropdownMenu.Item data-testid="delta">Delta</DropdownMenu.Item>
            <DropdownMenu.Separator data-testid="separator" />
            <DropdownMenu.CheckboxItem
              data-testid="check"
              checked={props.checked}
              onCheckedChange={props.onCheckedChange}
              {...props.checkProps}
            >
              <DropdownMenu.ItemIndicator data-testid="check-indicator">ok</DropdownMenu.ItemIndicator>
              Bookmarks
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.RadioGroup
              data-testid="radios"
              value={props.radio}
              onValueChange={props.onRadioChange}
            >
              <DropdownMenu.RadioItem data-testid="light" value="light">
                <DropdownMenu.ItemIndicator>on</DropdownMenu.ItemIndicator>
                Light
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem data-testid="dark" value="dark">
                <DropdownMenu.ItemIndicator>on</DropdownMenu.ItemIndicator>
                Dark
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger data-testid="sub-trigger" {...props.subProps}>
                More
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent data-testid="sub-content" {...props.subContentProps}>
                <DropdownMenu.Item data-testid="sub-one">Sub one</DropdownMenu.Item>
                <DropdownMenu.Item data-testid="sub-two">Sub two</DropdownMenu.Item>
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger data-testid="deep-trigger">Deeper</DropdownMenu.SubTrigger>
                  <DropdownMenu.SubContent data-testid="deep-content">
                    <DropdownMenu.Item data-testid="deep-one">Deep one</DropdownMenu.Item>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu>
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
      <DropdownMenu defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange}>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>One</DropdownMenu.Item>
          <DropdownMenu.Item>Two</DropdownMenu.Item>
          <DropdownMenu.CheckboxItem checked>
            <DropdownMenu.ItemIndicator>ok</DropdownMenu.ItemIndicator>
            Three
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
}

/** Polymorphic parts. */
export function AsParts(): JsxChild {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenu.Trigger as="a" href="#menu" data-testid="trigger">
        Link trigger
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content as="section" data-testid="content">
          <DropdownMenu.Item as="a" href="#one" data-testid="one">
            One
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu>
  );
}

/** A part used outside its root. */
export function Orphan(): JsxChild {
  return <DropdownMenu.Trigger>Orphan</DropdownMenu.Trigger>;
}
