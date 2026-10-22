import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Tabs } from "../../src/index";

interface DemoProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  activationMode?: "automatic" | "manual";
  loop?: boolean;
  disabled?: string[];
  forceMount?: boolean;
  baseId?: string;
  triggerProps?: Record<string, unknown>;
}

const VALUES = ["account", "password", "billing"];

/** Three tabs and three panels. */
export function Demo(props: DemoProps): JsxChild {
  return (
    <Tabs
      data-testid="root"
      baseId={props.baseId}
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
      orientation={props.orientation}
      dir={props.dir}
      activationMode={props.activationMode}
    >
      <Tabs.List data-testid="list" aria-label="Settings" loop={props.loop}>
        {VALUES.map((value) => (
          <Tabs.Trigger
            data-testid={`tab-${value}`}
            value={value}
            disabled={props.disabled?.includes(value)}
            {...props.triggerProps}
          >
            {value}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {VALUES.map((value) => (
        <Tabs.Content data-testid={`panel-${value}`} value={value} forceMount={props.forceMount}>
          <p>{value} panel</p>
        </Tabs.Content>
      ))}
    </Tabs>
  );
}

/** Values that are not safe to put in an id as they are. */
export function Odd(props: { defaultValue?: string }): JsxChild {
  const values = ["a b", "a_b", "a-b", "é/ü", "", "x#y.z", "100%"];
  return (
    <Tabs defaultValue={props.defaultValue}>
      <Tabs.List aria-label="Odd">
        {values.map((value, index) => (
          <Tabs.Trigger data-testid={`tab-${index}`} value={value}>
            {value}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {values.map((value, index) => (
        <Tabs.Content data-testid={`panel-${index}`} value={value} forceMount>
          {value}
        </Tabs.Content>
      ))}
    </Tabs>
  );
}

/** Every part rendered as another element, with application ids. */
export function AsOther(): JsxChild {
  return (
    <Tabs as="section" defaultValue="one" data-testid="root">
      <Tabs.List as="nav" data-testid="list" aria-label="Other">
        <Tabs.Trigger as="div" value="one" id="my-tab" data-testid="tab-one">
          One
        </Tabs.Trigger>
        <Tabs.Trigger as="div" value="two" data-testid="tab-two">
          Two
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content as="article" value="one" id="my-panel" data-testid="panel-one">
        One panel
      </Tabs.Content>
      <Tabs.Content as="article" value="two" data-testid="panel-two">
        Two panel
      </Tabs.Content>
    </Tabs>
  );
}

/** A tab outside any root. */
export function OrphanTrigger(): JsxChild {
  return <Tabs.Trigger value="x">x</Tabs.Trigger>;
}

/** A tab inside a root but outside a list. */
export function TriggerWithoutList(): JsxChild {
  return (
    <Tabs defaultValue="x">
      <Tabs.Trigger value="x">x</Tabs.Trigger>
    </Tabs>
  );
}

/** A tab list whose tabs have no panels mounted, as a page that uses tabs only as links does. */
export function TriggersOnly(props: { defaultValue?: string }): JsxChild {
  return (
    <Tabs defaultValue={props.defaultValue}>
      <Tabs.List aria-label="Filter">
        {VALUES.map((value) => (
          <Tabs.Trigger data-testid={`tab-${value}`} value={value}>
            {value}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

/** A disabled tab rendered as a div: the disabled state must be exposed to assistive technology. */
export function AsDisabledDiv(): JsxChild {
  return (
    <Tabs defaultValue="one">
      <Tabs.List aria-label="Sections">
        <Tabs.Trigger value="one" data-testid="tab-one">
          One
        </Tabs.Trigger>
        <Tabs.Trigger as="div" value="two" disabled data-testid="tab-two">
          Two
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  );
}
