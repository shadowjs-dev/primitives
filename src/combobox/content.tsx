import {
  children,
  onCleanup,
  splitProps,
  untrack,
  useEffect,
  useRenderEffect,
} from "@shadow-js/core";
import { Portal, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperContent, type PopperContentOwnProps } from "../popper/index";
import {
  announce,
  callHandler,
  composeRefs,
  createRevealer,
  type FocusOutsideEvent,
  mergeElementProps,
  type PointerDownOutsideEvent,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { type ComboboxContextValue, comboboxContext, comboboxRegistryContext } from "./context";
import { LayerElement } from "./layer-element";
import { whileMounted } from "./mounted";
import { comboboxPortalContext } from "./portal";

/**
 * Own props of {@link ComboboxContent}: the placement options of `PopperContent` plus the
 * dismissal hooks.
 *
 * Accessibility: the list is `role="listbox"` with `aria-multiselectable` (multiple),
 * `aria-labelledby` (the label, else the input) and `aria-busy` while `Combobox.Loading` is mounted.
 * Data attributes: `data-state` is `"open"` or `"closed"`, and `data-empty` is present (empty value)
 * when nothing matches.
 * @since 1.0.0
 * @see {@link ComboboxContent}
 */
export interface ComboboxContentOwnProps extends PopperContentOwnProps {
  /** Keep the content mounted while closed (for animation libraries). @default `false` */
  readonly forceMount?: boolean | undefined;
  /** Escape was pressed. `preventDefault()` keeps the list open. @default none */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /**
   * A pointer press happened outside the list and the field. `preventDefault()` keeps it open.
   * @default none
   */
  readonly onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
  /** Focus moved outside the list and the field. `preventDefault()` keeps it open. @default none */
  readonly onFocusOutside?: ((event: FocusOutsideEvent) => void) | undefined;
  /** Pointer press or focus outside. `preventDefault()` keeps it open. @default none */
  readonly onInteractOutside?:
    | ((event: PointerDownOutsideEvent | FocusOutsideEvent) => void)
    | undefined;
}

/**
 * Props of {@link ComboboxContent}: the attributes of the chosen element (`div` by default) plus the
 * options of `ComboboxContentOwnProps`.
 * @since 1.0.0
 * @see {@link ComboboxContent}
 */
export type ComboboxContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  ComboboxContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN_KEYS = [
  "as",
  "forceMount",
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "onFocusOutside",
  "onInteractOutside",
  "children",
] as const;

/**
 * The list of options: `role="listbox"`, labeled by `Combobox.Label` (or the input), placed
 * against the anchor (the `Combobox.Anchor`, else the input) by `PopperContent`, and as wide as
 * the anchor through `--primitives-anchor-width`. It never takes focus: the input keeps it, and
 * pressing inside the list does not blur the input. A press or focus outside (the input, the
 * trigger, the clear button and the anchor count as inside) or Escape closes it. It stays mounted
 * until its exit animation ends.
 *
 * While the list is closed, the children are run once without being shown (they put nothing in the
 * page): the items report their value and text, so a value chosen before the list was ever opened
 * shows its label in the field and the chips. The children therefore run once while closed and
 * once more each time the list opens.
 *
 * With `inline` on the root there is no popup: this is a plain `role="listbox"` element rendered
 * where it is placed, always visible. Escape is then reported through `onEscapeKeyDown`.
 *
 * @param props See {@link ComboboxContentProps}.
 * @returns The list while it is open (in a portal when `Combobox.Portal` wraps it), the inline list,
 * or nothing.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Content sideOffset={4} class="w-[var(--primitives-anchor-width)]">
 *         <Combobox.Item value="apple">Apple</Combobox.Item>
 *       </Combobox.Content>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxPortal}
 */
export function ComboboxContent<T extends PolymorphicTarget = "div">(
  props: ComboboxContentProps<T>,
): JsxChild {
  const context = comboboxContext.use("Combobox.Content");
  const [own, rest] = splitProps(partProps<Loose & ComboboxContentOwnProps>(props), OWN_KEYS);
  const presence = usePresence(() => context.open() || own.forceMount === true);
  const portal = comboboxPortalContext.useOptional();
  // The portal is opened together with the list, so the list is the last child of the container:
  // a portal that existed from the start would sit before a dialog opened later, under its overlay.
  const popup = whileMounted(
    () => !context.inline() && presence.mounted(),
    () =>
      portal === undefined ? (
        <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
      ) : (
        <Portal mount={portal.container}>
          <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
        </Portal>
      ),
  );
  return (
    <>
      {popup}
      <Show when={context.inline()}>
        <InlineList own={own} rest={rest} />
      </Show>
      <Show when={context.settled() && !context.inline() && !presence.mounted()}>
        <comboboxRegistryContext.Provider value={true}>
          <Registry>{own["children"] as JsxChild}</Registry>
        </comboboxRegistryContext.Provider>
      </Show>
    </>
  );
}

/** Runs the children of a closed list so its items can report their text, and renders nothing. */
function Registry(props: { readonly children?: JsxChild }): JsxChild {
  const resolved = children(() => props.children);
  // Reading it is what builds the items, and reading it again when their list changes keeps the
  // registry current; what they build is never inserted anywhere.
  useRenderEffect(() => {
    resolved();
  });
  return null;
}

interface ContentLayerProps {
  readonly own: Loose & ComboboxContentOwnProps;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

/** The scrollable ancestor of `item` inside `container` (inclusive), if any. */
function scrollerOf(item: HTMLElement, container: HTMLElement): HTMLElement | undefined {
  for (
    let current: HTMLElement | null = item.parentElement;
    current !== null;
    current = current.parentElement
  ) {
    if (current.scrollHeight > current.clientHeight) return current;
    if (current === container) return undefined;
  }
  return undefined;
}

/**
 * What a visible list does, popup or inline: direction, keeping the highlight in view, announcing.
 * Returns `reveal`, which brings the highlighted option into view again (a popup is only as tall as
 * its scroll area once it has been placed, so an option highlighted on opening has to be revealed
 * then).
 */
function useListBehavior(context: ComboboxContextValue): { readonly reveal: () => void } {
  useEffect(() => {
    const element = context.content();
    if (element !== undefined) element.setAttribute("dir", context.dir());
  });

  const revealer = createRevealer(() => {
    const value = untrack(context.highlighted);
    if (value === undefined || untrack(context.highlightSource) !== "keyboard") return undefined;
    const hit = context.collection.items().find((item) => item.data.value() === value);
    const list = untrack(context.content);
    if (hit === undefined || list === undefined) return undefined;
    const scroller = scrollerOf(hit.element, list);
    return scroller === undefined ? undefined : { scroller, item: hit.element };
  });
  onCleanup(revealer.cancel);
  // Keep the highlighted option in view when the keyboard moved it.
  useEffect(() => {
    // Also when the options change: filtering moves the highlighted one.
    context.highlighted();
    context.collection.items();
    untrack(revealer.reveal);
  });

  // Tell screen reader users how many options the typed text left, politely.
  useEffect(() => {
    if (!context.open() || context.loading.present()) return;
    const count = context.matchCount();
    untrack(() => announce(context.resultsMessage(count)));
  });

  return { reveal: revealer.reveal };
}

/** The attributes of the listbox element, popup or inline. */
function listboxProps(context: ComboboxContextValue): Record<string, unknown> {
  return {
    get id() {
      return context.contentId();
    },
    role: "listbox",
    get dir() {
      return context.dirProp();
    },
    get "aria-multiselectable"() {
      return context.multiple() ? true : undefined;
    },
    // Without a visible label the input (which has its own name) names the list.
    get "aria-labelledby"() {
      return context.label.present() ? context.labelId() : context.inputId();
    },
    get "aria-busy"() {
      return context.loading.present() ? true : undefined;
    },
    get "data-state"() {
      return context.open() ? "open" : "closed";
    },
    get "data-empty"() {
      return context.mounted() && context.matchCount() === 0 ? "" : undefined;
    },
    // A press in the list must not move focus away from the input.
    onMouseDown: (event: MouseEvent) => event.preventDefault(),
  };
}

/** The list of an `inline` combobox: a plain element in place, always open, with no layer. */
function InlineList(layer: {
  readonly own: Loose & ComboboxContentOwnProps;
  readonly rest: object;
}): JsxChild {
  const context = comboboxContext.use("Combobox.Content");
  const { own } = layer;
  useListBehavior(context);
  // There is no dismissable layer to hear Escape: the input forwards it here.
  context.escapeHandler.current = (event: KeyboardEvent) => callHandler(own.onEscapeKeyDown, event);
  onCleanup(() => {
    context.escapeHandler.current = undefined;
  });
  const elementProps = mergeElementProps(listboxProps(context), layer.rest, {
    ref: (element: HTMLElement) => context.setContent(element),
  });
  return (
    <Polymorphic as={own.as ?? "div"} {...elementProps}>
      {own["children"] as JsxChild}
    </Polymorphic>
  );
}

/** The mounted part of the content: everything here lives exactly as long as the element. */
function ContentLayer(layer: ContentLayerProps): JsxChild {
  const context = comboboxContext.use("Combobox.Content");
  const { own } = layer;
  const behavior = useListBehavior(context);

  const elementProps = mergeElementProps(listboxProps(context), { align: "start" }, layer.rest, {
    ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => context.setContent(element)),
    // `PopperContent` hands `style` over from `{ animation: "none" }` to `undefined` once placed,
    // and `undefined` removes the whole attribute, taking the layer's `pointer-events` with it.
    style: {},
  });
  return (
    <PopperContent
      as={LayerElement}
      layerAs={own.as ?? "div"}
      {...elementProps}
      enabled={context.open()}
      onPlaced={behavior.reveal}
      branches={() => [
        context.input(),
        context.trigger(),
        context.clear(),
        context.anchor(),
        ...context.chips.getItems().map((chip) => chip.element),
      ]}
      onEscapeKeyDown={(event: KeyboardEvent) => callHandler(own.onEscapeKeyDown, event)}
      onPointerDownOutside={(event: PointerDownOutsideEvent) =>
        callHandler(own.onPointerDownOutside, event)
      }
      onFocusOutside={(event: FocusOutsideEvent) => callHandler(own.onFocusOutside, event)}
      onInteractOutside={(event: PointerDownOutsideEvent | FocusOutsideEvent) => {
        callHandler(own.onInteractOutside, event);
        // Leaving the combobox also discards text that was typed but not committed.
        if (!event.defaultPrevented) context.dismiss();
      }}
      onDismiss={() => context.setOpen(false)}
    >
      {own["children"] as JsxChild}
    </PopperContent>
  );
}
