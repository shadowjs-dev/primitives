/**
 * The client renderer of {@link Polymorphic}: one element built by `Dynamic`, which takes every prop
 * shape through the generic prop runtime (`spread`). The server build uses `polymorphic-tags-server.tsx`
 * instead (the build's resolve rule, see `tsdown.config.mjs`): a closed table of JSX templates that the
 * server compiler renders, so the client bundle carries no table of templates.
 * @internal
 */
import { mergeProps, splitProps } from "@shadow-js/core";
import { Dynamic, type DynamicProps } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTag } from "./polymorphic";

/** Props of the element a tag renders: attributes, handlers, `ref` and children. */
type Rest = Record<string, unknown>;

/** Elements that never take children; their children are dropped before the element is built. */
const VOID_TAGS: ReadonlySet<string> = new Set(["hr", "img", "input"]);

/**
 * Renders one tag from its props on the client. `Dynamic` is called as a function, not as a
 * component: a component call would open a hydration scope the server's table does not open, and the
 * keys of the adopted elements would differ.
 * @param tag A tag name from {@link PolymorphicTag}.
 * @param props The props of the element; getters stay reactive.
 * @returns The element's accessor, as `Dynamic` returns it.
 * @internal
 */
export function renderTag(tag: PolymorphicTag, props: Rest): JsxChild {
  const attributes = VOID_TAGS.has(tag) ? splitProps(props, ["children"])[1] : props;
  const dynamic = mergeProps({ component: tag }, attributes) as DynamicProps<PolymorphicTag>;
  return Dynamic(dynamic) as () => JsxChild;
}
