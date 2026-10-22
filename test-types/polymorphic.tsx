// biome-ignore-all lint/a11y: fixtures check typing; accessibility rules do not apply to them
/**
 * Type tests for the polymorphic `as` prop and `mergeElementProps`.
 * @since 1.0.0
 */
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../src/index";

declare function sink(...values: readonly unknown[]): void;

/** A part that renders a `button` unless told otherwise. */
declare function Part<T extends PolymorphicTarget = "button">(
  props: PolymorphicProps<"button", { readonly size?: "sm" | "lg" | undefined }, T>,
): JsxChild;

sink(<Part size="sm" disabled onClick={(event) => event.currentTarget.disabled} />);
sink(<Part as="a" href="/x" target="_blank" />);
sink(<Part as="input" type="text" value="x" />);
sink(<Part ref={(element: HTMLButtonElement) => element.focus()} />);
// `a` exists in HTML, SVG and MathML, so its ref receives the union of those elements.
sink(<Part as="a" ref={(element) => element.id} />);

function Custom(props: { readonly tone: "info" | "warn"; readonly children?: JsxChild }): JsxChild {
  return <div data-tone={props.tone}>{props.children}</div>;
}
sink(<Part as={Custom} tone="warn" />);

// @ts-expect-error `size` is one of the declared values
sink(<Part size="xl" />);
// @ts-expect-error `href` is not an attribute of a button
sink(<Part href="/x" />);
// @ts-expect-error a component target requires its own props
sink(<Part as={Custom} />);
// @ts-expect-error the component's props are checked
sink(<Part as={Custom} tone="loud" />);
// @ts-expect-error an input does not take `href`
sink(<Part as="input" href="/x" />);
// @ts-expect-error the ref receives the element the part renders
sink(<Part ref={(element: HTMLDivElement) => element} />);

// The generic Polymorphic accepts anything the merge produces.
const merged = mergeElementProps({ role: "button" }, { class: "x" }, () => ({ id: "y" }), null);
sink(<Polymorphic as="div" {...merged} />);
const value: unknown = merged["role"];
sink(value);
// @ts-expect-error merged props are read through string keys only
sink(merged.role.length);
