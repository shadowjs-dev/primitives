/**
 * `DismissableLayer`: an element that dismisses itself with Escape, a pointer press outside or
 * focus moving outside, and that takes part in the per-document layer stack (see
 * `registerLayer`): only the topmost layer reacts to Escape, nested layers count as inside their
 * parent, and a layer can disable pointer events outside itself.
 * @packageDocumentation
 */
import { splitProps, useRenderEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { composeRefs } from "./compose";
import { createPartContext } from "./context";
import {
  type FocusOutsideEvent,
  type LayerHandle,
  type PointerDownOutsideEvent,
  registerLayer,
} from "./layer-stack";
import { mergeElementProps } from "./merge-props";
import { partProps } from "./part-props";
import { Polymorphic, type PolymorphicProps, type PolymorphicTarget } from "./polymorphic";
import { useRefSignal } from "./ref-signal";

/** Identifies the layer a nested layer was opened from. */
interface LayerToken {
  handle: LayerHandle | undefined;
}

/** The props as the implementation sees them: the typed surface is for callers. */
type LooseProps = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const layerParent = createPartContext<LayerToken>("DismissableLayer");

/**
 * Props of {@link DismissableLayer} besides the element's own, plus `as` from the polymorphic
 * surface. Accessibility: the layer sets no ARIA attributes and handles no keys of its own; the
 * caller passes `role` and `aria-*` on the element. The layer reacts to Escape (only in the topmost
 * layer), to a pointer press outside and to focus moving outside. Data attributes: none are set by
 * the layer. While `disableOutsidePointerEvents` is in effect it writes an inline `pointer-events`
 * style to the document body and to the layers of the stack.
 * @see {@link DismissableLayer}
 * @since 1.0.0
 */
export interface DismissableLayerOwnProps {
  /**
   * Whether the layer takes part in dismissal at all. `false` unregisters it from the stack, so
   * Escape, outside presses and outside focus no longer reach it.
   * @default `true`
   */
  readonly enabled?: boolean | undefined;
  /**
   * Blocks pointer events everywhere except this layer and the layers above it (modal behavior).
   * While it is set, the body gets `pointer-events: none`, the layers below get `none` and this
   * layer and the layers above it get `auto`. Read once when the layer registers.
   * @default `false`
   */
  readonly disableOutsidePointerEvents?: boolean | undefined;
  /**
   * Escape was pressed while this was the topmost layer. `preventDefault()` keeps it open. Read at
   * event time, so the latest function runs.
   * @default none
   */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /**
   * A pointer press happened outside. `preventDefault()` keeps it open. Runs before `onDismiss`.
   * @default none
   */
  readonly onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
  /**
   * Focus moved outside. `preventDefault()` keeps it open. Runs before `onDismiss`.
   * @default none
   */
  readonly onFocusOutside?: ((event: FocusOutsideEvent) => void) | undefined;
  /**
   * Pointer press or focus outside. `preventDefault()` keeps it open. Runs for both kinds, after
   * `onPointerDownOutside` or `onFocusOutside`.
   * @default none
   */
  readonly onInteractOutside?:
    | ((event: PointerDownOutsideEvent | FocusOutsideEvent) => void)
    | undefined;
  /**
   * The layer asks to be closed: Escape, an outside press or outside focus, unless one of the
   * handlers called `preventDefault()`.
   * @default none
   */
  readonly onDismiss?: (() => void) | undefined;
  /**
   * Extra elements that count as inside, such as the trigger that opened the layer. Read at event
   * time.
   * @default none
   */
  readonly branches?: () => readonly (Element | null | undefined)[];
}

/**
 * An element that dismisses itself on Escape, outside pointer presses and outside focus.
 *
 * Keyboard: Escape closes only the topmost layer; the layer calls `onEscapeKeyDown` and then
 * `onDismiss`, unless the handler prevented the default. ARIA: the layer sets no `role` or `aria-*`
 * attribute, so pass them as props (for example `role="menu"`). Focus: the layer never moves focus
 * itself; a focus move outside it dismisses it. A layer opened inside another one counts as part of
 * it. A touch press outside dismisses on the click that follows, so a scroll does not dismiss.
 *
 * @param props See {@link DismissableLayerOwnProps}.
 * @returns The layer element (`as`, default `"div"`) with its children.
 * @example
 * import { DismissableLayer } from "@shadow-js/primitives";
 *
 * export function Popup(props: { trigger?: HTMLElement; onClose: () => void }) {
 *   return (
 *     <DismissableLayer
 *       role="dialog"
 *       onDismiss={props.onClose}
 *       branches={() => [props.trigger]}
 *     >
 *       <p>Press Escape or click outside to close.</p>
 *     </DismissableLayer>
 *   );
 * }
 * @see {@link DismissableLayerOwnProps}
 * @see {@link registerLayer}
 * @since 1.0.0
 */
export function DismissableLayer<T extends PolymorphicTarget = "div">(
  props: PolymorphicProps<"div", DismissableLayerOwnProps, T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<DismissableLayerOwnProps & LooseProps>(props), [
    "enabled",
    "disableOutsidePointerEvents",
    "onEscapeKeyDown",
    "onPointerDownOutside",
    "onFocusOutside",
    "onInteractOutside",
    "onDismiss",
    "branches",
    "as",
  ]);
  const parent = layerParent.useOptional();
  const token: LayerToken = { handle: undefined };
  const [node, setNode] = useRefSignal<HTMLElement>();

  // A render effect, not a user effect: the layer must be registered before any user effect of
  // the same component runs (a focus scope that moves focus into the layer would otherwise look
  // like "focus outside" to the layer it was opened from).
  useRenderEffect(
    () => (own.enabled === false ? undefined : node()),
    (element) => {
      if (element === undefined) return;
      const handle = registerLayer({
        element,
        parent: parent?.handle,
        disableOutsidePointerEvents: own.disableOutsidePointerEvents === true,
        branches: () => own.branches?.() ?? [],
        handlers: () => ({
          onEscapeKeyDown: own.onEscapeKeyDown,
          onPointerDownOutside: own.onPointerDownOutside,
          onFocusOutside: own.onFocusOutside,
          onInteractOutside: own.onInteractOutside,
          onDismiss: own.onDismiss,
        }),
      });
      token.handle = handle;
      return () => {
        handle.remove();
        token.handle = undefined;
      };
    },
  );

  const merged = mergeElementProps(rest, {
    ref: composeRefs<HTMLElement>((element) => setNode(element)),
  });
  return (
    <layerParent.Provider value={token}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </layerParent.Provider>
  );
}

/**
 * {@link DismissableLayer} for parts that forward loose props (`Record<string, unknown>`) to it. The
 * cast is made once here: the four layer-element parts share this view, not four casts. It behaves
 * exactly like {@link DismissableLayer} and sets no ARIA attributes or keys of its own. No barrel
 * re-exports it, so it is internal to the package.
 * @see {@link DismissableLayer}
 * @since 1.0.0
 * @internal
 */
export const LooseDismissableLayer = DismissableLayer as unknown as (
  props: Record<string, unknown>,
) => JsxChild;
