import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { LooseDismissableLayer } from "../utils/dismissable-layer";
import type { PolymorphicTarget } from "../utils/index";

type Loose = { readonly layerAs?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The element a floating part renders: a `DismissableLayer`. `PopperContent` builds its element
 * through `as`, and `as` is taken, so the application's own `as` travels as `layerAs`. The layer's
 * element is the content element itself (inside `PopperContent`'s positioning wrapper), which keeps
 * "inside" detection and pointer-event blocking on the element the application styles.
 *
 * @internal
 */
export function LayerElement(props: Record<string, unknown>): JsxChild {
  const [own, rest] = splitProps(props as Loose, ["layerAs"]);
  const Layer = LooseDismissableLayer;
  return <Layer as={own.layerAs ?? "div"} {...rest} />;
}
