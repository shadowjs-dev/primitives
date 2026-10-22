import { onCleanup, onMount, splitProps, untrack, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  composeRefs,
  type Direction,
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  partId,
  useBaseId,
  useControllableState,
  useRefSignal,
  useRovingFocus,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import {
  type NavigationMenuContextValue,
  type NavigationOpenedBy,
  navigationMenuContext,
} from "./context";

/**
 * Own props of {@link NavigationMenuRoot}, on top of the attributes of the `nav` element.
 *
 * Accessibility: the root is a `nav` landmark (give it an `aria-label` when there is more than one).
 * Each trigger has `aria-expanded`, and `aria-controls` while its content is open; the content has
 * `aria-labelledby` pointing at its trigger. The triggers form one roving group, so only one is in
 * the tab order. Escape closes the open item and returns focus to its trigger.
 *
 * Data attributes: `data-orientation` (`"horizontal"` or `"vertical"`) on the `nav` and on the list;
 * `data-state` (`"open"` or `"closed"`) on each trigger and content; `data-value` (the item's value)
 * on each item; `data-orientation` on each content.
 * @since 1.0.0
 * @see {@link NavigationMenuItem}
 */
export interface NavigationMenuOwnProps {
  /**
   * Controlled open item (the `value` of an item). `""` means every item is closed. A controlled
   * menu opens only what the application puts here.
   * @default none (uncontrolled)
   */
  readonly value?: string | undefined;
  /**
   * The open item when uncontrolled.
   * @default none (every item starts closed)
   */
  readonly defaultValue?: string | undefined;
  /**
   * Called with the new open item's value, or `""` when everything closes.
   * @default none
   */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /**
   * Milliseconds a pointer must rest on a trigger before its content opens. `0` opens at once.
   * @default 0
   */
  readonly delayDuration?: number | undefined;
  /**
   * Axis of the top-level list: the arrow keys that move between triggers (Left and Right, or Up
   * and Down). ArrowDown still opens the content.
   * @default "horizontal"
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Reading direction; `"rtl"` swaps the horizontal arrow keys.
   * @default none (inherits the `DirectionProvider`, then the document, then `"ltr"`)
   */
  readonly dir?: Direction | undefined;
}

/**
 * Props of {@link NavigationMenu}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link NavigationMenuOwnProps}
 */
export type NavigationMenuProps<T extends PolymorphicTarget = "nav"> = PolymorphicProps<
  "nav",
  NavigationMenuOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Site navigation with flyouts. Each item's trigger opens its content: on click (Enter and Space on a
 * button click it too), on a pointer rest (after `delayDuration`), or with ArrowDown (focus moves into
 * the content). Escape closes and returns focus to the trigger, a press outside closes, leaving the
 * menu with the pointer closes what the pointer opened, and a link inside a content closes it.
 *
 * Keys: Left and Right move between the triggers (Up and Down when vertical), Home and End go to the
 * first and last trigger, ArrowDown opens the focused trigger's content, Escape closes it. ARIA: a
 * `nav` element; each trigger has `aria-expanded` and, while open, `aria-controls`; the content has
 * `aria-labelledby` naming its trigger.
 *
 * Renders a `nav` element with `data-orientation`. Give it an `aria-label` when there is more than one.
 *
 * @param props See {@link NavigationMenuProps}.
 * @returns The `nav` element that provides the menu state to its parts.
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function SiteNav() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List>
 *         <NavigationMenu.Item value="products">
 *           <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
 *           <NavigationMenu.Content>
 *             <NavigationMenu.Link href="/products/a">Product A</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenu}
 */
export function NavigationMenuRoot<T extends PolymorphicTarget = "nav">(
  props: NavigationMenuProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & NavigationMenuOwnProps>(props), [
    "as",
    "value",
    "defaultValue",
    "onValueChange",
    "delayDuration",
    "orientation",
    "dir",
    "onKeyDown",
    "onPointerLeave",
  ]);
  const [value, setValue] = useControllableState<string | undefined>({
    value: () => own.value as string | undefined,
    defaultValue: () => own.defaultValue as string | undefined,
    onChange: () => {
      const callback = own.onValueChange as ((value: string) => void) | undefined;
      return callback === undefined
        ? undefined
        : (next) => {
            callback(next ?? "");
          };
    },
    name: "NavigationMenu value",
  });
  const open = (): string | undefined => {
    const current = value();
    return current === undefined || current === "" ? undefined : current;
  };
  const [openedBy, setOpenedBy] = useSignal<NavigationOpenedBy | undefined>(undefined);
  const base = useBaseId(() => (rest as { id?: string }).id);
  const [root, setRoot] = useRefSignal<HTMLElement>();
  const [viewport, setViewport] = useRefSignal<HTMLElement>();
  const [activeContent, setActiveContent] = useRefSignal<HTMLElement>();
  const [hosted, setHosted] = useSignal<(() => JsxChild) | undefined>(undefined);
  // The root carries its own dir attribute, so the search starts above it, at the parent.
  const dir = useDirectionAround(
    () => own.dir as Direction | undefined,
    () => root()?.parentElement,
  );
  const orientation = (): Orientation =>
    (own.orientation as Orientation | undefined) ?? "horizontal";
  const roving = useRovingFocus({ orientation, dir, loop: () => false });
  const triggers = new Map<string, HTMLElement>();
  let rootElement: HTMLElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancelTimer = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  onCleanup(cancelTimer);

  const setOpen = (next: string | undefined, by: NavigationOpenedBy): void => {
    cancelTimer();
    setOpenedBy(next === undefined ? undefined : by);
    setValue(next ?? "");
  };

  // A click anywhere outside the menu closes it. Registered after mount, removed on disposal.
  onMount(() => {
    // Set after mount: a ref runs before the root is inserted, so its ancestors are not known yet.
    setRoot(rootElement);
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (open() === undefined || !(target instanceof Node)) return;
      if (rootElement?.contains(target) === true) return;
      setOpen(undefined, "click");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  const context: NavigationMenuContextValue = {
    value: open,
    open: (next, by) => setOpen(next, by),
    openedBy,
    delay: () => (own.delayDuration as number | undefined) ?? 0,
    orientation,
    dir,
    roving,
    triggerId: (item) => partId(base(), `trigger-${item}`),
    contentId: (item) => partId(base(), `content-${item}`),
    registerTrigger(item, element) {
      if (element === undefined) triggers.delete(item);
      else triggers.set(item, element);
    },
    focusTrigger(item) {
      triggers.get(item)?.focus();
    },
    triggerElement: (item) => triggers.get(item),
    rootElement: root,
    viewport,
    setViewport,
    hosted,
    host(build, previous) {
      // Withdrawing only clears the builder that is still current, so a newer content is not removed
      // by the cleanup of the one it replaced.
      if (build !== undefined) setHosted(() => build);
      else if (untrack(hosted) === previous) setHosted(undefined);
    },
    activeContent,
    setActiveContent,
    scheduleOpen(fn) {
      cancelTimer();
      const delay = (own.delayDuration as number | undefined) ?? 0;
      if (delay <= 0) fn();
      else timer = setTimeout(fn, delay);
    },
    cancelTimer,
  };

  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return orientation();
      },
      get dir() {
        return dir();
      },
      ref: composeRefs<HTMLElement>((element) => {
        rootElement = element;
      }),
    },
    rest,
    {
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event: KeyboardEvent) => {
          const current = open();
          if (event.key !== "Escape" || current === undefined) return;
          event.preventDefault();
          setOpen(undefined, "keyboard");
          context.focusTrigger(current);
        },
      ),
      onPointerLeave: composeEventHandlers(
        () => own.onPointerLeave as ((event: PointerEvent) => void) | undefined,
        () => {
          // Leaving the menu closes what the pointer opened; a click or a key opening stays.
          if (openedBy() === "pointer") setOpen(undefined, "pointer");
          else cancelTimer();
        },
      ),
    },
  );
  return (
    <navigationMenuContext.Provider value={context}>
      <Polymorphic as={own.as ?? "nav"} {...merged} />
    </navigationMenuContext.Provider>
  );
}
