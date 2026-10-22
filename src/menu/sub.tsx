import { onCleanup, splitProps, untrack, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperProvider, usePopperAnchor } from "../popper/index";
import {
  composeEventHandlers,
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useBaseId,
  useControllableState,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  MENU_CONTENT_OWN_KEYS,
  MenuContentLayer,
  type MenuContentOwnProps,
  type MenuLoose,
} from "./content";
import { createMenuState, menuContext, menuRootContext } from "./context";
import { getSafeArea } from "./intent";
import type { MenuItemOwnProps } from "./item";
import { whileMounted } from "./mounted";
import { useMenuItem } from "./use-menu-item";

/** How long the pointer must rest on a submenu trigger before the submenu opens. */
const OPEN_DELAY_MS = 100;

/**
 * Props of {@link MenuSub}. The submenu renders no element and sets no ARIA or data attributes of
 * its own; its trigger and content carry the `menuitem`, `menu` and `data-state` attributes (see
 * {@link MenuSubTriggerProps} and {@link MenuSubContentProps}).
 * @since 1.0.0
 * @see {@link MenuSub}
 */
export interface MenuSubProps {
  /**
   * Controlled open state of the submenu.
   * @default none (uncontrolled)
   */
  readonly open?: boolean | undefined;
  /**
   * Initial open state when uncontrolled.
   * @default false
   */
  readonly defaultOpen?: boolean | undefined;
  /**
   * Called when the submenu asks to open or close.
   * @default none
   */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * The `Menu.SubTrigger` and `Menu.SubContent` of the submenu.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/**
 * Root of a submenu: holds its open state and anchor. It renders no element and handles no keys
 * itself; `Menu.SubTrigger` opens it with the arrow key and `Menu.SubContent` closes it. Place a
 * `Menu.SubTrigger` and a `Menu.SubContent` in it, inside a `Menu.Content`. The submenu closes when
 * its parent menu does.
 *
 * @param props See {@link MenuSubProps}.
 * @returns The submenu's context around its children.
 * @throws Error when rendered outside a `Menu`; the message names the part and the root it needs.
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ToolsMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>File</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Sub>
 *             <Menu.SubTrigger>More tools</Menu.SubTrigger>
 *             <Menu.SubContent>
 *               <Menu.Item>Save page as...</Menu.Item>
 *             </Menu.SubContent>
 *           </Menu.Sub>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuSubTrigger}
 * @since 1.0.0
 */
export function MenuSub(props: MenuSubProps): JsxChild {
  const parent = menuContext.use("Menu.Sub");
  const [open, setOpen] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => props.onOpenChange,
    name: "Menu.Sub open",
  });
  const base = useBaseId();
  const anchor = usePopperAnchor();
  const state = createMenuState({
    open,
    setOpen: (next) => setOpen(next),
    base,
    onTrigger: anchor.setAnchor,
  });
  // A submenu cannot outlive the menu it belongs to.
  useEffect(() => {
    if (!parent.open()) untrack(() => setOpen(false));
  });
  return (
    <menuContext.Provider value={state}>
      <PopperProvider anchor={anchor.anchor} setAnchor={anchor.setAnchor}>
        {props.children}
      </PopperProvider>
    </menuContext.Provider>
  );
}

/**
 * Props of {@link MenuSubTrigger}: the `disabled` and `textValue` options of {@link MenuItemOwnProps}
 * plus the element props. Accessibility and data attributes are described on
 * {@link MenuSubTrigger}.
 * @since 1.0.0
 * @see {@link MenuSubTrigger}
 */
export type MenuSubTriggerProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  Pick<MenuItemOwnProps, "disabled" | "textValue">,
  T
>;

/**
 * The item that opens a submenu: `role="menuitem"` with `aria-haspopup="menu"`, `aria-expanded`,
 * `aria-controls` (while open) and `data-state` (`open` or `closed`). ArrowRight (ArrowLeft in
 * RTL), Enter and Space open the submenu and focus its first item; when it is already open they
 * move focus into it. A click opens it and keeps focus on the trigger, and resting the pointer on
 * it for about 100 ms opens it. A pointer traveling from it toward the open submenu does not close
 * the submenu on the way (see `getSafeArea`).
 *
 * @param props See {@link MenuSubTriggerProps}.
 * @returns The submenu trigger element.
 * @throws Error when rendered outside a `Menu.Content`; the message names the part and the root it needs.
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ShareMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>File</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Sub>
 *             <Menu.SubTrigger>Share</Menu.SubTrigger>
 *             <Menu.SubContent>
 *               <Menu.Item>Email</Menu.Item>
 *             </Menu.SubContent>
 *           </Menu.Sub>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuSubContent}
 * @since 1.0.0
 */
export function MenuSubTrigger<T extends PolymorphicTarget = "div">(
  props: MenuSubTriggerProps<T>,
): JsxChild {
  const root = menuRootContext.use("Menu.SubTrigger");
  const sub = menuContext.use("Menu.SubTrigger");
  const [own, rest] = splitProps(partProps<MenuLoose>(props), [
    "as",
    "disabled",
    "textValue",
    "onClick",
    "onKeyDown",
  ]);
  sub.triggerPart.register();
  const disabled = (): boolean => own["disabled"] === true;
  const binding = useMenuItem({
    part: "Menu.SubTrigger",
    disabled,
    textValue: () => own["textValue"] as string | undefined,
  });
  const parentContent = binding.content;

  let openTimer: ReturnType<typeof setTimeout> | undefined;
  const clearOpenTimer = (): void => {
    if (openTimer !== undefined) clearTimeout(openTimer);
    openTimer = undefined;
  };
  onCleanup(clearOpenTimer);

  const merged = mergeElementProps(
    binding.props,
    {
      role: "menuitem",
      "aria-haspopup": "menu",
      get "aria-expanded"() {
        return sub.open();
      },
      get "aria-controls"() {
        return sub.open() ? sub.contentId() : undefined;
      },
      get "data-state"() {
        return sub.open() ? "open" : "closed";
      },
      get id() {
        return sub.triggerId();
      },
      onPointerMove: (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        if (untrack(disabled)) return;
        // Back on the trigger: whatever grace period was running is over.
        parentContent.setGrace(null);
        if (!untrack(sub.open) && openTimer === undefined) {
          openTimer = setTimeout(() => {
            openTimer = undefined;
            sub.entry.value = undefined;
            sub.setOpen(true);
          }, OPEN_DELAY_MS);
        }
      },
      onPointerLeave: (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        clearOpenTimer();
        const rect = untrack(sub.content)?.getBoundingClientRect();
        if (rect === undefined) return;
        parentContent.setGrace({
          area: getSafeArea({ x: event.clientX, y: event.clientY }, rect),
          // The pointer stopped inside the area without arriving: the user is not going there.
          onExpire: () => sub.setOpen(false),
        });
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((element) => sub.setTrigger(element)),
      onClick: composeEventHandlers(
        () => own["onClick"],
        (event: MouseEvent) => {
          if (untrack(disabled)) return;
          const target = event.currentTarget;
          if (target instanceof HTMLElement) target.focus();
          if (!untrack(sub.open)) {
            sub.entry.value = undefined;
            sub.setOpen(true);
          }
        },
      ),
      onKeyDown: composeEventHandlers(
        () => own["onKeyDown"],
        (event: KeyboardEvent) => {
          if (untrack(disabled)) return;
          if (event.ctrlKey || event.altKey || event.metaKey) return;
          if (event.key === " " && parentContent.typeahead.search() !== "") return;
          const openKey = untrack(root.dir) === "rtl" ? "ArrowLeft" : "ArrowRight";
          if (event.key !== "Enter" && event.key !== " " && event.key !== openKey) return;
          event.preventDefault();
          if (untrack(sub.open)) sub.focuser.current?.("first");
          else {
            sub.entry.value = "first";
            sub.setOpen(true);
          }
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * Props of {@link MenuSubContent}: the own props of {@link MenuContentOwnProps} plus the element
 * props. Accessibility and data attributes are described on {@link MenuSubContent}.
 * @since 1.0.0
 * @see {@link MenuSubContent}
 */
export type MenuSubContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MenuContentOwnProps,
  T
>;

/**
 * The submenu: `role="menu"` with `aria-orientation="vertical"`, labeled by its trigger, placed
 * beside it (`data-side="right"`, `align="start"`, mirrored to the left in RTL) with its first item
 * lined up with the trigger. ArrowLeft (ArrowRight in RTL) and Escape close it and return focus to
 * the trigger; the arrow keys, Home, End and typeahead work as in `Menu.Content`; moving focus to
 * another item of the parent menu closes it; and a press inside it is not an outside press for its
 * parents.
 *
 * @param props See {@link MenuSubContentProps}.
 * @returns The submenu element, or nothing while it is closed and unmounted.
 * @throws Error when rendered outside a `Menu.Sub`; the message names the part and the root it needs.
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ShareMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>File</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Sub>
 *             <Menu.SubTrigger>Share</Menu.SubTrigger>
 *             <Menu.SubContent sideOffset={2}>
 *               <Menu.Item>Email</Menu.Item>
 *             </Menu.SubContent>
 *           </Menu.Sub>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuSubTrigger}
 * @since 1.0.0
 */
export function MenuSubContent<T extends PolymorphicTarget = "div">(
  props: MenuSubContentProps<T>,
): JsxChild {
  const menu = menuContext.use("Menu.SubContent");
  const [own, rest] = splitProps(
    partProps<MenuLoose & MenuContentOwnProps>(props),
    MENU_CONTENT_OWN_KEYS,
  );
  const presence = usePresence(() => menu.open() || own.forceMount === true);
  return whileMounted(presence.mounted, () => (
    <MenuContentLayer kind="sub" own={own} rest={rest} presenceRef={presence.ref} />
  ));
}
