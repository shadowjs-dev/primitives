import { onCleanup } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Polymorphic, type PolymorphicTag } from "../../src/index";

export function Tag(props: { tag: PolymorphicTag }): JsxChild {
  return (
    <Polymorphic as={props.tag} data-testid="el" id="x">
      child
    </Polymorphic>
  );
}

export function Fancy(props: { children?: JsxChild; "data-kind"?: string }): JsxChild {
  return (
    <b data-testid="fancy" data-kind={props["data-kind"]}>
      {props.children}
    </b>
  );
}

export function WithComponent(props: { kind: string }): JsxChild {
  return (
    <Polymorphic as={Fancy} data-kind={props.kind}>
      inside
    </Polymorphic>
  );
}

export function Swappable(props: { as: "a" | "button"; onDispose: (tag: string) => void }): JsxChild {
  return (
    <Polymorphic as={props.as} data-testid="el">
      <Cleanup tag={props.as} onDispose={props.onDispose} />
    </Polymorphic>
  );
}

function Cleanup(props: { tag: string; onDispose: (tag: string) => void }): JsxChild {
  const tag = props.tag;
  onCleanup(() => props.onDispose(tag));
  return "x";
}

export function Reactive(props: { title: string; label: string }): JsxChild {
  return (
    <Polymorphic as="div" title={props.title} data-testid="el">
      {props.label}
    </Polymorphic>
  );
}
