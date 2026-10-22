import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Accordion } from "../../src/index";

interface CommonProps {
  disabled?: boolean;
  disabledItems?: string[];
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  forceMount?: boolean;
  headerAs?: "h2";
  baseId?: string;
  triggerProps?: Record<string, unknown>;
}

interface SingleProps extends CommonProps {
  value?: string;
  defaultValue?: string;
  collapsible?: boolean;
  onValueChange?: (value: string) => void;
}

interface MultipleProps extends CommonProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

const ITEMS = ["one", "two", "three"];

function Items(props: CommonProps): JsxChild {
  return ITEMS.map((value) => (
    <Accordion.Item
      data-testid={`item-${value}`}
      value={value}
      disabled={props.disabledItems?.includes(value)}
    >
      {props.headerAs === "h2" ? (
        <Accordion.Header data-testid={`header-${value}`} as="h2">
          <Accordion.Trigger data-testid={`trigger-${value}`} {...props.triggerProps}>
            Question {value}
          </Accordion.Trigger>
        </Accordion.Header>
      ) : (
        <Accordion.Header data-testid={`header-${value}`}>
          <Accordion.Trigger data-testid={`trigger-${value}`} {...props.triggerProps}>
            Question {value}
          </Accordion.Trigger>
        </Accordion.Header>
      )}
      <Accordion.Content data-testid={`content-${value}`} forceMount={props.forceMount}>
        <p>Answer {value}</p>
        <input data-testid={`input-${value}`} />
      </Accordion.Content>
    </Accordion.Item>
  ));
}

/** An accordion where one item is open at a time. */
export function Single(props: SingleProps): JsxChild {
  return (
    <Accordion
      type="single"
      data-testid="root"
      baseId={props.baseId}
      value={props.value}
      defaultValue={props.defaultValue}
      collapsible={props.collapsible}
      onValueChange={props.onValueChange}
      disabled={props.disabled}
      orientation={props.orientation}
      dir={props.dir}
    >
      <Items {...props} />
    </Accordion>
  );
}

/** An accordion where any number of items can be open. */
export function Multiple(props: MultipleProps): JsxChild {
  return (
    <Accordion
      type="multiple"
      data-testid="root"
      baseId={props.baseId}
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
      disabled={props.disabled}
      orientation={props.orientation}
      dir={props.dir}
    >
      <Items {...props} />
    </Accordion>
  );
}

/** Every part rendered as another element, with an application id on a trigger. */
export function AsOther(): JsxChild {
  return (
    <Accordion type="single" as="section" data-testid="root" defaultValue="a b">
      <Accordion.Item as="article" value="a b" data-testid="item">
        <Accordion.Header as="h2" data-testid="header">
          <Accordion.Trigger as="div" id="my-trigger" data-testid="trigger">
            Spaced value
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content as="section" data-testid="content">
          Answer
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

/** Parts used without their roots. */
export function OrphanItem(): JsxChild {
  return <Accordion.Item value="x">x</Accordion.Item>;
}

export function OrphanTrigger(): JsxChild {
  return <Accordion.Trigger>x</Accordion.Trigger>;
}

export function OrphanContent(): JsxChild {
  return (
    <Accordion type="single">
      <Accordion.Content>x</Accordion.Content>
    </Accordion>
  );
}
