import { onCleanup, splitProps, untrack, useEffect, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { menuContext } from "../menu/index";
import {
  composeEventHandlers,
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { menubarContext, menubarMenuContext } from "./context";

/**
 * Own props of {@link MenubarTrigger}.
 *
 * Accessibility: the trigger is a native `button` with `role="menuitem"` and `aria-haspopup="menu"`.
 * A disabled trigger sets the native `disabled` attribute and `data-disabled`, is skipped by the
 * arrow keys, and cannot open its menu.
 *
 * Data attributes: `data-state` (`open` or `closed`), `data-highlighted` (empty value, present
 * while the trigger has focus), and `data-disabled` (empty value, present when disabled).
 * @since 1.0.0
 * @see {@link MenubarTrigger}
 */
export interface MenubarTriggerOwnProps {
  /**
   * A disabled trigger is skipped by the arrow keys and cannot open its menu.
   * @default false
   */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link MenubarTrigger}.
 * @since 1.0.0
 * @see {@link MenubarTrigger}
 */
export type MenubarTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  MenubarTriggerOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The item of the bar that opens a menu: a `button` with `role="menuitem"`, `aria-haspopup="menu"`,
 * `aria-expanded`, `aria-controls` (while open) and `data-state`. The triggers share one tab stop
 * (roving tabindex), and ArrowLeft and ArrowRight move between them. ArrowDown, Enter and Space open
 * the menu and focus its first item; ArrowUp opens it and focuses the last item; Enter and Space
 * close it again when it is already open. A pointer press toggles the menu, and while any menu is
 * open, hovering another trigger switches to that one.
 *
 * @param props See {@link MenubarTriggerProps}.
 * @returns The trigger button.
 * @throws Error when rendered outside a `Menubar`; the message names the part and the root it needs.
 * @example
 * import { Menubar } from "@shadow-js/primitives/menubar";
 *
 * function EditMenubar() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="edit">
 *         <Menubar.Trigger>Edit</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <Menubar.Item>Undo</Menubar.Item>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenubarMenu}
 * @since 1.0.0
 */
export function MenubarTrigger<T extends PolymorphicTarget = "button">(
  props: MenubarTriggerProps<T>,
): JsxChild {
  const bar = menubarContext.use("Menubar.Trigger");
  const menubarMenu = menubarMenuContext.use("Menubar.Trigger");
  const menu = menuContext.use("Menubar.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "disabled",
    "onPointerDown",
    "onPointerEnter",
    "onPointerLeave",
    "onKeyDown",
  ]);
  menu.triggerPart.register();
  const disabled = (): boolean => own["disabled"] === true;
  // Set when this visit of the pointer opened the menu. The press that follows (a mouse click, or
  // the tap of a touch, which always enters first) confirms that menu instead of toggling it shut.
  let openedByEnter = false;
  const [element, setElement] = useSignal<HTMLElement | undefined>(undefined);
  const [highlighted, setHighlighted] = useSignal(false);
  const roving = bar.roving.item({ id: menubarMenu.value, disabled });

  useEffect(() => {
    const node = element();
    if (node === undefined) return;
    onCleanup(
      bar.triggers.register(node, {
        value: untrack(menubarMenu.value),
        disabled,
        setEntry: (entry) => {
          menu.entry.value = entry;
        },
      }),
    );
  });

  const merged = mergeElementProps(
    roving,
    {
      type: "button",
      role: "menuitem",
      get id() {
        return menu.triggerId();
      },
      "aria-haspopup": "menu",
      get "aria-expanded"() {
        return menu.open();
      },
      get "aria-controls"() {
        return menu.open() ? menu.contentId() : undefined;
      },
      get "data-state"() {
        return menu.open() ? "open" : "closed";
      },
      get "data-highlighted"() {
        return highlighted() ? "" : undefined;
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      get disabled() {
        return disabled() ? true : undefined;
      },
      onFocusIn: () => {
        setHighlighted(true);
      },
      onFocusOut: () => {
        setHighlighted(false);
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>(
        (node) => {
          setElement(node);
        },
        (node) => menu.setTrigger(node),
      ),
      onPointerDown: composeEventHandlers(
        () => own["onPointerDown"],
        (event: PointerEvent) => {
          if (untrack(disabled) || event.button !== 0 || event.ctrlKey) return;
          const wasOpen = untrack(menu.open);
          const hoverOpened = openedByEnter;
          openedByEnter = false;
          menu.entry.value = "content";
          menu.setOpen(hoverOpened || !wasOpen);
          // Keep the trigger from taking focus from the menu that is about to take it.
          if (!wasOpen || hoverOpened) event.preventDefault();
        },
      ),
      onPointerEnter: composeEventHandlers(
        () => own["onPointerEnter"],
        () => {
          if (untrack(disabled) || untrack(bar.value) === "" || untrack(menu.open)) return;
          menu.entry.value = "content";
          menu.setOpen(true);
          openedByEnter = true;
          untrack(element)?.focus();
        },
      ),
      onPointerLeave: composeEventHandlers(
        () => own["onPointerLeave"],
        () => {
          openedByEnter = false;
        },
      ),
      onKeyDown: composeEventHandlers(
        () => own["onKeyDown"],
        (event: KeyboardEvent) => {
          if (untrack(disabled)) return;
          if (event.key === "Enter" || event.key === " ") {
            menu.entry.value = "first";
            menu.setOpen(!untrack(menu.open));
          } else if (event.key === "ArrowDown") {
            menu.entry.value = "first";
            menu.setOpen(true);
          } else if (event.key === "ArrowUp") {
            menu.entry.value = "last";
            menu.setOpen(true);
          } else return;
          event.preventDefault();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
