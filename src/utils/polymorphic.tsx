// biome-ignore-all lint/a11y: the element renders the caller's props on a bare tag; alt text, label association and roles are the caller's to supply
/**
 * Polymorphism for headless parts: every part renders one element and lets the application pick
 * which, with a typed `as` prop (a tag name or a component). `Polymorphic` is the single place that
 * turns "a tag chosen at run time" into an element. The element is built by `Dynamic`, which takes
 * every prop shape through the generic prop runtime (`spread`) and runs on the server and on the
 * hydrating client, so the same part renders on the server and hydrates on the client.
 *
 * Tag names come from a closed list (see {@link POLYMORPHIC_TAGS}), so `as` can only name elements
 * the library has typed. The list is one array: a template per tag would cost a closure per tag in
 * every bundle that renders a part.
 * @packageDocumentation
 */
import { splitProps, untrack, useMemo } from "@shadow-js/core";
import type { JSX, JsxChild } from "@shadow-js/web/jsx-runtime";
import { renderTag } from "./polymorphic-tags";

/** Props handed to the element or component a {@link Polymorphic} renders. */
type Rest = Record<string, unknown>;

/** Every tag name `as` accepts, in the order they are declared. {@link PolymorphicTag} is their union. */
const TAG_NAMES = [
  "a",
  "abbr",
  "article",
  "aside",
  "b",
  "button",
  "code",
  "dd",
  "details",
  "div",
  "dl",
  "dt",
  "em",
  "fieldset",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "i",
  "img",
  "input",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "mark",
  "menu",
  "nav",
  "ol",
  "output",
  "p",
  "section",
  "small",
  "span",
  "strong",
  "summary",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "ul",
] as const;

/**
 * A tag name a part can render as: one of {@link POLYMORPHIC_TAGS}.
 * @since 1.0.0
 * @see {@link POLYMORPHIC_TAGS}
 */
export type PolymorphicTag = (typeof TAG_NAMES)[number];

/**
 * The tag names a part's `as` prop accepts, in the order they are declared.
 *
 * @example
 * import { POLYMORPHIC_TAGS, type PolymorphicTag } from "@shadow-js/primitives";
 *
 * const name = "section";
 * if (POLYMORPHIC_TAGS.includes(name as PolymorphicTag)) console.log(`${name} can be rendered`);
 * @since 1.0.0
 * @see {@link PolymorphicTag}
 * @see {@link Polymorphic}
 */
export const POLYMORPHIC_TAGS: readonly PolymorphicTag[] = TAG_NAMES;

/**
 * A component a part can render as. It receives the part's merged props (attributes, handlers,
 * `ref`, `children`) and must spread them on one element.
 * @since 1.0.0
 * @see {@link PolymorphicTarget}
 */
export type PolymorphicComponent = (props: never) => unknown;

/**
 * What `as` may be: a tag name or a component.
 * @since 1.0.0
 * @see {@link Polymorphic}
 */
export type PolymorphicTarget = PolymorphicTag | PolymorphicComponent;

/**
 * The props of the element or component `T`: the intrinsic attributes for a tag name, the
 * component's own props otherwise (or a loose record when the component's props are `never`).
 * @since 1.0.0
 * @see {@link PolymorphicProps}
 */
export type PolymorphicTargetProps<T extends PolymorphicTarget> = [T] extends [PolymorphicTag]
  ? JSX.IntrinsicElements[T]
  : [T] extends [(props: infer P) => unknown]
    ? [P] extends [never]
      ? Record<string, unknown>
      : P
    : Record<string, unknown>;

/**
 * Props of a part that renders `T` (default `D`): the part's own props `Own`, the typed `as`, and
 * every attribute of the chosen element. Own props take precedence over the element's.
 *
 * @typeParam D The tag the part renders by default.
 * @typeParam Own The part's own props.
 * @typeParam T The chosen target, inferred from `as`.
 * @example
 * import {
 *   Polymorphic,
 *   type PolymorphicProps,
 *   type PolymorphicTarget,
 * } from "@shadow-js/primitives";
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 *
 * export function Trigger<T extends PolymorphicTarget = "button">(
 *   props: PolymorphicProps<"button", { onOpen?: () => void }, T>,
 * ): JsxChild {
 *   const { onOpen, ...rest } = props;
 *   return <Polymorphic {...rest} onClick={() => onOpen?.()} />;
 * }
 *
 * // With `as="a"` the `href` is checked against the anchor's attributes.
 * <Trigger as="a" href="/x" onOpen={() => {}}>Open</Trigger>;
 * @since 1.0.0
 * @see {@link Polymorphic}
 * @see {@link PolymorphicTargetProps}
 */
export type PolymorphicProps<
  D extends PolymorphicTag,
  Own extends object = object,
  T extends PolymorphicTarget = D,
> = Own & { readonly as?: T } & Omit<PolymorphicTargetProps<T>, keyof Own | "as"> & {
    readonly children?: JsxChild;
  };

/**
 * Renders the element or component named by `as` (default `div`) with `props`. `as` may change
 * over time: the old element is disposed and the new one built. Everything else passes through,
 * reactive getters included, so attributes, handlers, `ref` and `children` reach the element.
 * `hr`, `img` and `input` are void: they drop their children. Polymorphic sets no role and no ARIA
 * attribute, handles no keys and does not move focus.
 *
 * @param props `as` (default `div`) and the props for the target.
 * @returns An accessor of the rendered element.
 * @example
 * import { Polymorphic } from "@shadow-js/primitives";
 *
 * <Polymorphic as="a" href="/docs" class="link">
 *   Read the docs
 * </Polymorphic>;
 * @since 1.0.0
 * @see {@link PolymorphicProps}
 * @see {@link POLYMORPHIC_TAGS}
 */
export function Polymorphic(props: {
  readonly as?: PolymorphicTarget | undefined;
  readonly children?: JsxChild;
  readonly [prop: string]: unknown;
}): JsxChild {
  const [own, rest] = splitProps(props, ["as"]);
  return useMemo((): JsxChild => {
    const target: PolymorphicTarget = own.as ?? "div";
    return untrack((): JsxChild => {
      if (typeof target === "function") {
        const Component = target as (properties: Rest) => JsxChild;
        return <Component {...rest} />;
      }
      return renderTag(target, rest);
    });
  });
}
