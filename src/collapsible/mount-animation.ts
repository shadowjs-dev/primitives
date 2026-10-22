/**
 * Helpers shared by the parts that open and close with a CSS animation (Collapsible, Accordion,
 * Tabs): a guard that suppresses the animation of content that was open from the very first
 * render, and the measurement behind the `--primitives-*-content-height/width` variables.
 * @packageDocumentation
 */
import { type Accessor, onMount, useSignal } from "@shadow-js/core";

/**
 * Tracks whether a root has finished its first render. Content that is created before that moment
 * was open from the start (server markup, `defaultOpen`), and must not play its open animation.
 *
 * @returns `ready` (not reactive on purpose: it is read once, when a part is created).
 * @see {@link CollapsibleRoot}
 * @example
 * declare function useFirstRenderFlag(): () => boolean;
 * // Called once in a root's setup; a content part created later reads it once.
 * const ready = useFirstRenderFlag();
 * const initial = !ready();
 * @internal
 * @since 1.0.0
 */
export function useFirstRenderFlag(): () => boolean {
  // Plain closure state: the flag is read exactly once per part, at creation, never tracked.
  let finished = false;
  onMount(() => {
    finished = true;
  });
  return () => finished;
}

/**
 * A signal that starts as `initiallyPrevented` and turns false one animation frame after mount, the
 * moment the first paint is done. While it is true the element should carry an inline style that
 * disables its animation; the server renders it too, so the markup never flashes.
 *
 * @param initiallyPrevented Whether the part belongs to the first render.
 * @returns An accessor of "animation is currently suppressed".
 * @see {@link useFirstRenderFlag}
 * @example
 * declare function useFirstRenderFlag(): () => boolean;
 * declare function useAnimationGuard(initiallyPrevented: boolean): () => boolean;
 * const ready = useFirstRenderFlag();
 * const prevented = useAnimationGuard(!ready());
 * const style = { "animation-name": prevented() ? "none" : undefined };
 * @internal
 * @since 1.0.0
 */
export function useAnimationGuard(initiallyPrevented: boolean): Accessor<boolean> {
  const [prevented, setPrevented] = useSignal<boolean>(initiallyPrevented);
  onMount(() => {
    if (!initiallyPrevented) return;
    const frame = requestAnimationFrame(() => setPrevented(false));
    return () => cancelAnimationFrame(frame);
  });
  return prevented;
}

/** The measured natural size of a content element, in pixels (undefined when it has none). @internal */
export interface ContentSize {
  readonly height: number | undefined;
  readonly width: number | undefined;
}

/** Whether two measurements are the same. @internal */
export function sameSize(a: ContentSize, b: ContentSize): boolean {
  return a.height === b.height && a.width === b.width;
}

/**
 * Measures the natural size of `element` with its animation and transition switched off for the
 * duration of the measurement, so a running height animation never reports its own mid-flight
 * value. The inline styles are put back exactly as they were. Prefers the bounding rect (it
 * includes borders) and falls back to `scrollHeight` / `scrollWidth` for an element whose box is
 * collapsed by its own styles.
 *
 * @param element The content element.
 * @returns Its natural size.
 * @see {@link CollapsibleContent}
 * @example
 * declare const element: HTMLElement;
 * declare function measureContent(element: HTMLElement): {
 *   readonly height: number | undefined;
 *   readonly width: number | undefined;
 * };
 * element.style.setProperty("--h", `${measureContent(element).height}px`);
 * @internal
 * @since 1.0.0
 */
export function measureContent(element: HTMLElement): ContentSize {
  const style = element.style;
  const animationName = style.getPropertyValue("animation-name");
  const animationPriority = style.getPropertyPriority("animation-name");
  const transitionDuration = style.getPropertyValue("transition-duration");
  const transitionPriority = style.getPropertyPriority("transition-duration");
  style.setProperty("animation-name", "none", "important");
  style.setProperty("transition-duration", "0s", "important");
  try {
    const rect = element.getBoundingClientRect();
    const height = rect.height > 0 ? rect.height : element.scrollHeight;
    const width = rect.width > 0 ? rect.width : element.scrollWidth;
    return { height: height > 0 ? height : undefined, width: width > 0 ? width : undefined };
  } finally {
    restoreProperty(style, "animation-name", animationName, animationPriority);
    restoreProperty(style, "transition-duration", transitionDuration, transitionPriority);
  }
}

function restoreProperty(
  style: CSSStyleDeclaration,
  name: string,
  value: string,
  priority: string,
): void {
  if (value === "") style.removeProperty(name);
  else style.setProperty(name, value, priority);
}

/**
 * The CSS custom properties for a measured size, e.g. `--primitives-collapsible-content-height`.
 *
 * @param prefix The variable prefix, e.g. `"collapsible"`.
 * @param size The measured size.
 * @returns A style object; entries without a measurement are `undefined` (the property is removed).
 * @see {@link measureContent}
 * @example
 * declare function sizeVariables(
 *   prefix: string,
 *   size: { readonly height: number | undefined; readonly width: number | undefined },
 * ): Record<string, string | undefined>;
 * const style = sizeVariables("collapsible", { height: 120, width: 300 });
 * @internal
 * @since 1.0.0
 */
export function sizeVariables(
  prefix: string,
  size: ContentSize,
): Record<string, string | undefined> {
  return {
    [`--primitives-${prefix}-content-height`]:
      size.height === undefined ? undefined : `${size.height}px`,
    [`--primitives-${prefix}-content-width`]:
      size.width === undefined ? undefined : `${size.width}px`,
  };
}
