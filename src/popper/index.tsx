/**
 * Popper: the shared layer behind popover, tooltip, hover card, menus and select. `Popper`
 * provides the anchor, `PopperAnchor` registers it, `PopperContent` places a floating box against
 * it (flip, shift, arrow, available size) and `PopperArrow` draws the arrow. Positioned content
 * sits in a wrapper that owns `position: fixed` and the placement transform, so the content element
 * is free to animate its own `transform` without fighting the placement.
 * @packageDocumentation
 */
import { type Accessor, onMount, splitProps, untrack, useEffect, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  type Align,
  composeRefs,
  createPartContext,
  mergeElementProps,
  type Padding,
  type PartContext,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  type PositionOptions,
  type Side,
  useDirection,
  usePosition,
  useRefSignal,
  type VirtualElement,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  directionAbove,
  langAbove,
  portalDirAttribute,
  portalLangAttribute,
} from "../utils/portal-direction";

/**
 * What a popper anchors to: a rendered element, or a virtual element (anything with a
 * `getBoundingClientRect()`, such as a context-menu point or a text caret) passed to
 * {@link PopperAnchor} as `virtualRef`.
 * @since 1.0.0
 * @see {@link PopperAnchor}
 */
export type PopperAnchorTarget = Element | VirtualElement;

interface PopperContextValue {
  readonly anchor: Accessor<PopperAnchorTarget | undefined>;
  readonly setAnchor: (anchor: PopperAnchorTarget | undefined) => void;
}

/** Placement details the arrow reads from the content. */
interface ContentContextValue {
  readonly side: Accessor<Side>;
  readonly arrowX: Accessor<number | undefined>;
  readonly arrowY: Accessor<number | undefined>;
  readonly cannotCenterArrow: Accessor<boolean>;
  readonly setArrow: (element: HTMLElement | undefined) => void;
}

const popperContext: PartContext<PopperContextValue> =
  createPartContext<PopperContextValue>("Popper");
const contentContext: PartContext<ContentContextValue> =
  createPartContext<ContentContextValue>("PopperContent");

/**
 * Creates the anchor state a popper shares with its parts. Call it in a component that renders
 * `PopperProvider`; components built on popper (popover, menu) do this in their root.
 *
 * @returns The anchor accessor and its setter.
 * @example
 * import { PopperAnchor, PopperContent, PopperProvider, usePopperAnchor } from "@shadow-js/primitives";
 *
 * export function Anchored() {
 *   const state = usePopperAnchor();
 *   return (
 *     <PopperProvider anchor={state.anchor} setAnchor={state.setAnchor}>
 *       <PopperAnchor>anchor</PopperAnchor>
 *       <PopperContent>content</PopperContent>
 *     </PopperProvider>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopperProvider}
 */
export function usePopperAnchor(): {
  readonly anchor: Accessor<PopperAnchorTarget | undefined>;
  readonly setAnchor: (anchor: PopperAnchorTarget | undefined) => void;
} {
  const [anchor, setAnchor] = useSignal<PopperAnchorTarget | undefined>(undefined);
  return { anchor, setAnchor: (next) => setAnchor(() => next) };
}

/**
 * Provides a popper anchor to `PopperAnchor` and `PopperContent`. Renders no element of its own.
 * Keyboard and ARIA: none; it sets no role and handles no keys. The component built on it owns
 * focus and keys.
 *
 * @param props `children`: the parts of the popper, usually `PopperAnchor` and `PopperContent`.
 * @returns The parts, inside the anchor context.
 * @example
 * import { Popper, PopperAnchor, PopperContent } from "@shadow-js/primitives";
 *
 * export function Tip() {
 *   return (
 *     <Popper>
 *       <PopperAnchor>anchor</PopperAnchor>
 *       <PopperContent>content</PopperContent>
 *     </Popper>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopperAnchor}
 */
export function Popper(props: { readonly children?: JsxChild }): JsxChild {
  const state = usePopperAnchor();
  return <popperContext.Provider value={state}>{props.children}</popperContext.Provider>;
}

/**
 * Reads the anchor state of the popper the caller sits in. Use it in a part built on popper.
 *
 * @returns The anchor accessor and its setter.
 * @throws Error when called outside a `Popper` or `PopperProvider`.
 * @example
 * import { usePopperContext } from "@shadow-js/primitives";
 *
 * export function AnchorState() {
 *   const popper = usePopperContext();
 *   return <span data-anchored={popper.anchor() === undefined ? "no" : "yes"} />;
 * }
 * @since 1.0.0
 * @see {@link PopperProvider}
 */
export function usePopperContext(): {
  readonly anchor: Accessor<PopperAnchorTarget | undefined>;
  readonly setAnchor: (anchor: PopperAnchorTarget | undefined) => void;
} {
  return popperContext.use("Popper");
}

/**
 * Props of {@link PopperProvider}. It sets no ARIA, keyboard or data attributes: it only shares an
 * anchor state with the parts below.
 * @see {@link PopperProvider}
 * @since 1.0.0
 */
export interface PopperProviderProps {
  /**
   * The anchor accessor, from {@link usePopperAnchor}.
   * @default none (required)
   */
  readonly anchor: Accessor<PopperAnchorTarget | undefined>;
  /**
   * Stores the anchor, from {@link usePopperAnchor}.
   * @default none (required)
   */
  readonly setAnchor: (anchor: PopperAnchorTarget | undefined) => void;
  /**
   * The parts that read the anchor.
   * @default none
   */
  readonly children?: JsxChild;
}

/**
 * Provides an existing anchor state (from {@link usePopperAnchor}) to the parts below. Renders no
 * element and sets no ARIA or keyboard behavior.
 *
 * @param props See {@link PopperProviderProps}.
 * @returns The parts, inside the anchor context.
 * @example
 * import { PopperAnchor, PopperContent, PopperProvider, usePopperAnchor } from "@shadow-js/primitives";
 *
 * export function Anchored() {
 *   const state = usePopperAnchor();
 *   return (
 *     <PopperProvider anchor={state.anchor} setAnchor={state.setAnchor}>
 *       <PopperAnchor>anchor</PopperAnchor>
 *       <PopperContent>content</PopperContent>
 *     </PopperProvider>
 *   );
 * }
 * @since 1.0.0
 * @see {@link usePopperAnchor}
 */
export function PopperProvider(props: PopperProviderProps): JsxChild {
  return (
    <popperContext.Provider value={{ anchor: props.anchor, setAnchor: props.setAnchor }}>
      {props.children}
    </popperContext.Provider>
  );
}

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link PopperAnchor}.
 * @see {@link PopperAnchor}
 * @since 1.0.0
 */
export type PopperAnchorProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  {
    /** Anchor to a virtual element (a point, a caret) instead of rendering one. */
    readonly virtualRef?: VirtualElement | undefined;
  },
  T
>;

/**
 * Registers an element as the anchor of the popper. Renders a `div` unless `as` says otherwise.
 * With `virtualRef` it renders nothing and anchors to the virtual element. Keyboard and ARIA: none;
 * it sets no role and handles no keys.
 *
 * @param props See {@link PopperAnchorProps}.
 * @returns The anchor element, or `null` when `virtualRef` is set.
 * @example
 * import { Popper, PopperAnchor, PopperContent } from "@shadow-js/primitives";
 *
 * export function Anchored() {
 *   return (
 *     <Popper>
 *       <PopperAnchor as="span">anchor</PopperAnchor>
 *       <PopperContent>content</PopperContent>
 *     </Popper>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopperContent}
 */
export function PopperAnchor<T extends PolymorphicTarget = "div">(
  props: PopperAnchorProps<T>,
): JsxChild {
  const popper = popperContext.use("PopperAnchor");
  const [own, rest] = splitProps(partProps<Loose & { virtualRef?: VirtualElement }>(props), [
    "as",
    "virtualRef",
  ]);
  useEffect(() => {
    const virtual = own.virtualRef;
    if (virtual !== undefined) popper.setAnchor(virtual);
  });
  if (own.virtualRef !== undefined) return null;
  const merged = mergeElementProps(rest, {
    ref: composeRefs<HTMLElement>((element) => popper.setAnchor(element)),
  });
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * Own props of {@link PopperContent}: the placement options of the positioning engine.
 *
 * Accessibility: none; the content and its wrapper set no role and handle no keys. Data attributes:
 * `data-side` and `data-align` on the content and on the wrapper (the side and alignment it ended up
 * on after flipping); `data-hidden` (empty) on the wrapper while `hideWhenDetached` hides it; and
 * `data-primitives-popper` (empty) on the wrapper.
 * @see {@link PopperContent}
 * @since 1.0.0
 */
export interface PopperContentOwnProps {
  /**
   * Preferred side. Flips to the opposite side when it does not fit.
   * @default "bottom"
   */
  readonly side?: Side | undefined;
  /**
   * Distance from the anchor in px.
   * @default 0
   */
  readonly sideOffset?: number | undefined;
  /**
   * Alignment along the anchor.
   * @default "center"
   */
  readonly align?: Align | undefined;
  /**
   * Offset along the alignment axis in px.
   * @default 0
   */
  readonly alignOffset?: number | undefined;
  /**
   * Distance the arrow keeps from the content's corners in px.
   * @default 0
   */
  readonly arrowPadding?: number | undefined;
  /**
   * Flip and shift the content to stay in view.
   * @default true
   */
  readonly avoidCollisions?: boolean | undefined;
  /**
   * Element(s) or a rectangle the content must stay inside, intersected with the viewport.
   * @default the viewport (none given)
   */
  readonly collisionBoundary?: PositionOptions["collisionBoundary"];
  /**
   * Distance kept from the boundary edges.
   * @default 0
   */
  readonly collisionPadding?: Padding | undefined;
  /**
   * `"partial"` keeps the content attached to the anchor, so it may leave the boundary when the
   * anchor does. `"always"` keeps the content inside the boundary whatever the anchor does.
   * @default "partial"
   */
  readonly sticky?: "partial" | "always" | undefined;
  /**
   * Hides the content (`visibility: hidden`, `data-hidden` on the wrapper) when the anchor is fully
   * clipped.
   * @default false
   */
  readonly hideWhenDetached?: boolean | undefined;
  /**
   * Reading direction. Inherited from the nearest `DirectionProvider`, else the `dir` attribute of
   * `<html>`, else `"ltr"`.
   * @default inherited (see above)
   */
  readonly dir?: "ltr" | "rtl" | undefined;
  /**
   * Called once, the first time the content has a placement.
   * @default none
   */
  readonly onPlaced?: (() => void) | undefined;
}

/**
 * Props of {@link PopperContent}.
 * @see {@link PopperContent}
 * @since 1.0.0
 */
export type PopperContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  PopperContentOwnProps,
  T
>;

const POSITION_KEYS = [
  "side",
  "sideOffset",
  "align",
  "alignOffset",
  "arrowPadding",
  "avoidCollisions",
  "collisionBoundary",
  "collisionPadding",
  "sticky",
  "hideWhenDetached",
  "dir",
  "onPlaced",
  "as",
] as const;

/**
 * The floating content, placed against the anchor. Keyboard and ARIA: none; it sets no role and
 * handles no keys, so focus and Escape belong to the component built on it. It sets `data-side`
 * and `data-align` (the side and alignment it ended up on after flipping) on the content element
 * and on its wrapper. The wrapper also carries the CSS variables `--primitives-available-width`,
 * `--primitives-available-height`, `--primitives-anchor-width`, `--primitives-anchor-height` and
 * `--primitives-transform-origin`, which the content inherits.
 *
 * @param props See {@link PopperContentProps}.
 * @returns The wrapper element and the content element inside it.
 * @example
 * import { Popper, PopperAnchor, PopperContent } from "@shadow-js/primitives";
 *
 * export function Placed() {
 *   return (
 *     <Popper>
 *       <PopperAnchor>anchor</PopperAnchor>
 *       <PopperContent side="top" sideOffset={8} class="rounded border bg-white">
 *         content
 *       </PopperContent>
 *     </Popper>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopperAnchor}
 * @see {@link PopperArrow}
 */
export function PopperContent<T extends PolymorphicTarget = "div">(
  props: PopperContentProps<T>,
): JsxChild {
  const popper = popperContext.use("PopperContent");
  const [own, rest] = splitProps(partProps<Loose & PopperContentOwnProps>(props), POSITION_KEYS);
  const dir = useDirection(
    () => own.dir,
    () => directionAbove(popper.anchor()),
  );
  const [wrapper, setWrapper] = useRefSignal<HTMLElement>();
  const [content, setContent] = useRefSignal<HTMLElement>();
  const [arrow, setArrow] = useRefSignal<HTMLElement>();
  let placedOnce = false;

  const position = usePosition({
    anchor: popper.anchor,
    floating: wrapper,
    arrow,
    options: () => {
      const options: PositionOptions = {
        side: own.side ?? "bottom",
        align: own.align ?? "center",
        sideOffset: own.sideOffset ?? 0,
        alignOffset: own.alignOffset ?? 0,
        arrowPadding: own.arrowPadding ?? 0,
        avoidCollisions: own.avoidCollisions !== false,
        collisionPadding: own.collisionPadding ?? 0,
        sticky: own.sticky ?? "partial",
        hideWhenDetached: own.hideWhenDetached === true,
        dir: dir(),
      };
      if (own.collisionBoundary !== undefined) options.collisionBoundary = own.collisionBoundary;
      return options;
    },
  });

  const placed = () => position.placement();
  const side = (): Side => placed()?.side ?? own.side ?? "bottom";
  const align = (): Align => placed()?.align ?? own.align ?? "center";

  useEffect(() => {
    if (placed() === undefined || placedOnce) return;
    placedOnce = true;
    untrack(() => own.onPlaced?.());
  });
  // The wrapper does not inherit the content's stacking context: copy its z-index so a
  // `z-50` class on the content is honored.
  onMount(() => {
    const element = content();
    const box = wrapper();
    if (element === undefined || box === undefined) return;
    const zIndex = (element.ownerDocument.defaultView ?? globalThis).getComputedStyle(
      element,
    ).zIndex;
    if (zIndex !== "" && zIndex !== "auto") box.style.zIndex = zIndex;
  });

  const merged = mergeElementProps(
    {
      get "data-side"() {
        return side();
      },
      get "data-align"() {
        return align();
      },
      // The content renders in a portal, away from the trigger's tree: carry the direction when it is not the document's.
      get dir() {
        return portalDirAttribute(dir());
      },
      get lang() {
        return portalLangAttribute(langAbove(popper.anchor()));
      },
      // Until the first placement an entrance animation must not start at the wrong spot.
      get style() {
        // Always an object: `undefined` would clear the whole style attribute, including what a layer set.
        return placed() === undefined ? { animation: "none" } : {};
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>((element) => setContent(element)) },
  );
  const arrowState: ContentContextValue = {
    side,
    arrowX: () => placed()?.arrow.x,
    arrowY: () => placed()?.arrow.y,
    cannotCenterArrow: () => placed()?.arrowCannotCenter === true,
    setArrow,
  };
  return (
    <div
      ref={(element: HTMLElement) => setWrapper(element)}
      data-primitives-popper=""
      style="position:fixed;left:0;top:0;min-width:max-content"
    >
      <contentContext.Provider value={arrowState}>
        <Polymorphic as={own.as ?? "div"} {...merged} />
      </contentContext.Provider>
    </div>
  );
}

/**
 * Props of {@link PopperArrow}. Accessibility: the `svg` is `aria-hidden="true"`, so the arrow is
 * ignored by assistive technology. Data attributes: none. Any other attribute goes to the `svg`.
 * @see {@link PopperArrow}
 * @since 1.0.0
 */
export type PopperArrowProps = {
  /**
   * Width of the arrow in px.
   * @default 10
   */
  readonly width?: number | undefined;
  /**
   * Height of the arrow in px.
   * @default 5
   */
  readonly height?: number | undefined;
  /**
   * Replaces the default triangle inside the `svg`.
   * @default none (a triangle)
   */
  readonly children?: JsxChild;
  /** Any other attribute, set on the `svg`. */
  readonly [attribute: string]: unknown;
};

const OPPOSITE: Record<Side, Side> = { top: "bottom", right: "left", bottom: "top", left: "right" };

/**
 * An arrow for `PopperContent`. Renders a `span` that holds an `svg` triangle (or its children),
 * pointing at the anchor; position and rotation follow the placed side. Style it with `fill`.
 * Keyboard: none. ARIA: the `svg` is `aria-hidden="true"`.
 *
 * @param props See {@link PopperArrowProps}.
 * @returns The arrow's `span`.
 * @example
 * import { Popper, PopperAnchor, PopperArrow, PopperContent } from "@shadow-js/primitives";
 *
 * export function WithArrow() {
 *   return (
 *     <Popper>
 *       <PopperAnchor>anchor</PopperAnchor>
 *       <PopperContent>
 *         content
 *         <PopperArrow class="fill-white" width={12} height={6} />
 *       </PopperContent>
 *     </Popper>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopperContent}
 */
export function PopperArrow(props: PopperArrowProps): JsxChild {
  const state = contentContext.use("PopperArrow");
  const [own, rest] = splitProps(props, ["width", "height", "children"]);
  const width = (): number => own.width ?? 10;
  const height = (): number => own.height ?? 5;
  const rotation = (side: Side): string =>
    side === "top"
      ? "translateY(100%)"
      : side === "right"
        ? "translateY(50%) rotate(90deg) translateX(-50%)"
        : side === "bottom"
          ? "rotate(180deg)"
          : "translateY(50%) rotate(-90deg) translateX(50%)";
  const origin = (side: Side): string =>
    side === "top" ? "" : side === "right" ? "0 0" : side === "bottom" ? "center 0" : "100% 0";
  return (
    <span
      ref={(element: HTMLElement) => state.setArrow(element)}
      style={{
        position: "absolute",
        left: state.arrowX() === undefined ? undefined : `${state.arrowX()}px`,
        top: state.arrowY() === undefined ? undefined : `${state.arrowY()}px`,
        [OPPOSITE[state.side()]]: 0,
        "transform-origin": origin(state.side()),
        transform: rotation(state.side()),
        visibility: state.cannotCenterArrow() ? "hidden" : undefined,
      }}
    >
      <svg
        aria-hidden="true"
        {...rest}
        width={width()}
        height={height()}
        viewBox="0 0 30 10"
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        {own.children ?? <polygon points="0,0 30,0 15,10" />}
      </svg>
    </span>
  );
}
