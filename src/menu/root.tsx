import { onMount } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperProvider, usePopperAnchor } from "../popper/index";
import { useBaseId, useControllableState, useDirection } from "../utils/index";
import { directionAbove } from "../utils/portal-direction";
import {
  createMenuState,
  type MenuRootContextValue,
  menuContext,
  menuRootContext,
} from "./context";
import { type ModalityHandle, trackModality } from "./modality";

/**
 * Props of {@link Menu}.
 *
 * Accessibility: the root renders no element and sets no ARIA attributes. The parts provide the
 * menu pattern: the content is `role="menu"`, its items are `menuitem`, `menuitemcheckbox` or
 * `menuitemradio`, and `modal` decides whether the rest of the page is hidden from assistive
 * technology while the menu is open.
 *
 * Data attributes: none on the root. The parts set `data-state`, `data-orientation`,
 * `data-highlighted` and `data-disabled` (see {@link MenuContentOwnProps} and {@link MenuItemOwnProps}).
 * @since 1.0.0
 * @see {@link Menu}
 */
export interface MenuProps {
  /**
   * Controlled open state. Omit it for an uncontrolled menu that starts at `defaultOpen`.
   * @default none (uncontrolled)
   */
  readonly open?: boolean | undefined;
  /**
   * Initial open state when uncontrolled.
   * @default false
   */
  readonly defaultOpen?: boolean | undefined;
  /**
   * Called when the menu asks to open or close (by a trigger, a selection, Escape or an outside press).
   * @default none
   */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * A modal menu hides the rest of the page from assistive technology, locks scroll and blocks
   * pointer events outside.
   * @default true
   */
  readonly modal?: boolean | undefined;
  /**
   * Reading direction; flips the arrow keys of submenus and the alignment of content.
   * @default none (the surrounding direction: `DirectionProvider`, then the document's `dir`, then `"ltr"`)
   */
  readonly dir?: "ltr" | "rtl" | undefined;
  /**
   * Base id; the ids of the trigger and content derive from it.
   * @default none (generated)
   */
  readonly id?: string | undefined;
  /**
   * The menu's parts: `Menu.Anchor`, `Menu.Portal` and the rest.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/**
 * The core of every menu primitive: holds the open state, the anchor and the direction, and
 * provides them to its parts. It renders no element. Build a menu from it with `Menu.Anchor`,
 * `Menu.Portal`, `Menu.Content`, `Menu.Item` and the other `Menu.*` parts.
 *
 * Keyboard and ARIA: the content is `role="menu"`, items are `menuitem`, `menuitemcheckbox` or
 * `menuitemradio`, the arrow keys, Home, End and typeahead move between them, and Escape closes the
 * menu and returns focus to its trigger (or to the element that had focus before it opened).
 *
 * @param props See {@link MenuProps}.
 * @returns The provider tree around the children; it renders no element of its own.
 * @example
 * import { useSignal } from "@shadow-js/core";
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ActionsMenu() {
 *   const [open, setOpen] = useSignal(false);
 *   return (
 *     <Menu open={open()} onOpenChange={setOpen}>
 *       <Menu.Anchor as="button">Actions</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Item onSelect={() => setOpen(false)}>Save</Menu.Item>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link Menu}
 * @since 1.0.0
 */
export function MenuRoot(props: MenuProps): JsxChild {
  const [open, setOpen] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => props.onOpenChange,
    name: "Menu open",
  });
  const base = useBaseId(() => props.id);
  const anchor = usePopperAnchor();
  // A dir attribute above the trigger applies when there is no prop and no provider, so a wrapper
  // with dir="rtl" mirrors the keys and the sides of the menu.
  const dir = useDirection(
    () => props.dir,
    () => directionAbove(anchor.anchor()),
  );
  let modality: ModalityHandle | undefined;
  // Listeners live as long as the root; they are only added once the page exists.
  onMount(() => {
    const handle = trackModality(document);
    modality = handle;
    return handle.release;
  });

  const state = createMenuState({
    open,
    setOpen: (next) => setOpen(next),
    base,
    onTrigger: anchor.setAnchor,
  });
  const root: MenuRootContextValue = {
    modal: () => props.modal !== false,
    dir,
    close: () => setOpen(false),
    isKeyboard: () => modality?.isKeyboard() ?? false,
  };
  return (
    <menuRootContext.Provider value={root}>
      <menuContext.Provider value={state}>
        <PopperProvider anchor={anchor.anchor} setAnchor={anchor.setAnchor}>
          {props.children}
        </PopperProvider>
      </menuContext.Provider>
    </menuRootContext.Provider>
  );
}
