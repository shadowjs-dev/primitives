import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { mergeElementProps, Polymorphic } from "../../src/index";

export function Probe(props: Record<string, unknown>): JsxChild {
  const merged = mergeElementProps(
    { role: "button", class: "base", onClick: props["internal"] },
    props,
  );
  return <Polymorphic as={props["as"] as "button" | "a" | undefined} {...merged} />;
}

export function Plain(): JsxChild {
  return (
    <Probe as="a" href="/x" class="user">
      hello
    </Probe>
  );
}
