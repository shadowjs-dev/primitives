import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { LooseDismissableLayer } from "../utils/dismissable-layer";
import type { PolymorphicTarget } from "../utils/index";

type Loose = { readonly layerAs?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The element the listbox renders: a `DismissableLayer`. `PopperContent` builds its element
 * through `as`, and `as` is taken, so the application's own `as` travels as `layerAs`.
 *
 * @param props The element props from `PopperContent`; `layerAs` names the element to render.
 * @returns The dismissable layer element.
 * @internal
 * @since 1.0.0
 * @see {@link ComboboxContent}
 */
export function LayerElement(props: Record<string, unknown>): JsxChild {
  const [own, rest] = splitProps(props as Loose, ["layerAs"]);
  const Layer = LooseDismissableLayer;
  return <Layer as={own.layerAs ?? "div"} {...rest} />;
}
