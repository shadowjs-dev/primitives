import { onCleanup, splitProps, useEffect, useSignal } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { collapsibleContext } from "./context";
import {
  type ContentSize,
  measureContent,
  sameSize,
  sizeVariables,
  useAnimationGuard,
} from "./mount-animation";

/**
 * Own props of {@link CollapsibleContent}.
 *
 * Accessibility: the content has no role and no keys. Its id is the one the trigger's
 * `aria-controls` names while the content is mounted. A closed content that is not force-mounted
 * is removed from the DOM after its exit animation. Data attributes: `data-state` (`"open"` or
 * `"closed"`) and `data-disabled` (`""`, only when the collapsible is disabled).
 * @see {@link CollapsibleContent}
 * @since 1.0.0
 */
export interface CollapsibleContentOwnProps {
  /**
   * Keep the content mounted while closed (for animation libraries or to keep its state). A closed
   * force-mounted content carries the `hidden` attribute; pass `hidden={false}` to take over.
   * @default false
   */
  readonly forceMount?: boolean | undefined;
}

/**
 * Props of {@link CollapsibleContent}.
 * @see {@link CollapsibleContent}
 * @since 1.0.0
 */
export type CollapsibleContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  CollapsibleContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The panel the trigger expands. It stays mounted until its exit animation ends and publishes its
 * natural size as the CSS variables `--primitives-collapsible-content-height` and
 * `--primitives-collapsible-content-width`, measured on mount and on every open / close, so a
 * height animation (`from { height: 0 } to { height: var(--primitives-collapsible-content-height) }`)
 * needs no layout shift. Content that is open from the first render (server markup, `defaultOpen`)
 * does not animate in. Accessibility: no role and no keys; the panel is the target of the trigger's
 * `aria-controls`.
 *
 * @param props See {@link CollapsibleContentProps}.
 * @returns The rendered content, or nothing while it is unmounted.
 * @see {@link Collapsible}
 * @example
 * import { Collapsible } from "@shadow-js/primitives";
 *
 * export function SlideDown() {
 *   return (
 *     <Collapsible defaultOpen>
 *       <Collapsible.Trigger>Details</Collapsible.Trigger>
 *       <Collapsible.Content class="overflow-hidden">Details text.</Collapsible.Content>
 *     </Collapsible>
 *   );
 * }
 * @since 1.0.0
 */
export function CollapsibleContent<T extends PolymorphicTarget = "div">(
  props: CollapsibleContentProps<T>,
): JsxChild {
  const context = collapsibleContext.use("Collapsible.Content");
  const [own, rest] = splitProps(partProps<Loose & CollapsibleContentOwnProps>(props), [
    "as",
    "forceMount",
    "children",
  ]);
  const presence = usePresence(() => context.open() || own.forceMount === true);
  return (
    <Show when={presence.mounted()}>
      <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
    </Show>
  );
}

interface ContentLayerProps {
  readonly own: Loose & CollapsibleContentOwnProps;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

const NO_SIZE: ContentSize = { height: undefined, width: undefined };

/** The mounted part of the content: everything here lives exactly as long as the element. */
function ContentLayer(layer: ContentLayerProps): JsxChild {
  const context = collapsibleContext.use("Collapsible.Content");
  const { own } = layer;
  const [node, setNode] = useSignal<HTMLElement | undefined>(undefined);
  const [size, setSize] = useSignal<ContentSize>(NO_SIZE, { equals: sameSize });
  const prevented = useAnimationGuard(!context.ready());
  const idProp = (): string | undefined => (layer.rest as { id?: string }).id;
  const contentId = (): string => idProp() ?? context.contentId();

  // Re-measure whenever the collapsible opens or closes: that is when the animation needs the size.
  useEffect(() => {
    context.open();
    const element = node();
    if (element !== undefined) setSize(measureContent(element));
  });
  useEffect(() => {
    context.setMountedContentId(contentId());
    onCleanup(() => context.setMountedContentId(undefined));
  });

  const merged = mergeElementProps(
    {
      get id() {
        return contentId();
      },
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      get hidden() {
        return !context.open() && own.forceMount === true ? true : undefined;
      },
      get style() {
        return {
          ...sizeVariables("collapsible", size()),
          "animation-name": prevented() ? "none" : undefined,
          "transition-duration": prevented() ? "0s" : undefined,
        };
      },
    },
    layer.rest,
    { ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => setNode(element)) },
  );
  return (
    <Polymorphic as={own.as ?? "div"} {...merged}>
      {own["children"] as JsxChild}
    </Polymorphic>
  );
}
