import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { Polymorphic, type PolymorphicTag } from "../../src/index";

/** Renders `as` with the attributes a part forwards (a plain object, spread onto the element). */
export function Render(props: {
  as: PolymorphicTag;
  attrs: Record<string, unknown>;
  text: string;
}): JsxChild {
  return (
    <Polymorphic as={props.as} {...props.attrs}>
      {props.text}
    </Polymorphic>
  );
}
