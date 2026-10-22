import type { Accessor } from "@shadow-js/core";
import { type Direction, documentDirection, useDirection } from "./direction";

/**
 * The `dir` ("ltr" or "rtl") of the nearest element at or above `target` that has one; `auto`, a virtual element or nothing give
 * `undefined`. A part that renders in a portal reads the direction of the place it belongs to this way.
 * @internal
 */
export function directionAbove(target: unknown): Direction | undefined {
  // A virtual anchor (a point, as in a context menu) carries the element it belongs to.
  const element =
    typeof target === "object" && target !== null && "contextElement" in target
      ? (target as { readonly contextElement?: unknown }).contextElement
      : target;
  if (typeof Element === "undefined" || !(element instanceof Element)) return undefined;
  const value = element.closest("[dir]")?.getAttribute("dir")?.toLowerCase();
  return value === "rtl" || value === "ltr" ? value : undefined;
}

/**
 * The `dir` attribute a portaled part must carry: the direction when it differs from the document's, else `undefined` (the
 * document already gives it).
 * @internal
 */
export function portalDirAttribute(dir: Direction): Direction | undefined {
  return dir === (documentDirection() ?? "ltr") ? undefined : dir;
}

/**
 * The `lang` of the nearest element at or above `target` that has one, or `undefined`. A portaled part carries it, so a screen
 * reader reads its text in the language of the place it belongs to.
 * @internal
 */
export function langAbove(target: unknown): string | undefined {
  if (typeof Element === "undefined" || !(target instanceof Element)) return undefined;
  const value = target.closest("[lang]")?.getAttribute("lang");
  return value === null || value === undefined || value === "" ? undefined : value;
}

/**
 * The `lang` attribute a portaled part must carry: the language when it differs from the document's, else `undefined`.
 * @internal
 */
export function portalLangAttribute(lang: string | undefined): string | undefined {
  if (lang === undefined || typeof document === "undefined") return undefined;
  return lang === document.documentElement.getAttribute("lang") ? undefined : lang;
}

/**
 * The direction of a part that has a root element: its own `dir` prop, else a {@link DirectionProvider}, else the nearest `dir`
 * attribute at or above its root element (a wrapper with `dir="rtl"` is enough, as it is for CSS), else the document's.
 * Call it during setup, like {@link useDirection}, and give it an accessor of the root element that is set after mount (see
 * {@link useRefSignal}): the element's ancestors are not known before it is inserted.
 *
 * @param local The part's own `dir` prop.
 * @param element An accessor of the part's root element (undefined until it mounts).
 * @returns An accessor of the effective direction.
 * @example
 * import { onMount } from "@shadow-js/core";
 * import { useDirectionAround, useRefSignal } from "@shadow-js/primitives";
 *
 * export function Strip(props: { dir?: "ltr" | "rtl" }) {
 *   const [root, setRoot] = useRefSignal<HTMLElement>();
 *   const dir = useDirectionAround(() => props.dir, root);
 *   let element: HTMLElement | undefined;
 *   onMount(() => setRoot(element));
 *   return <div ref={(node: HTMLElement) => (element = node)}>{dir()}</div>;
 * }
 * @since 1.0.0
 * @see {@link useDirection}
 */
export function useDirectionAround(
  local: (() => Direction | undefined) | undefined,
  element: Accessor<unknown>,
): Accessor<Direction> {
  return useDirection(local, () => directionAbove(element()));
}
