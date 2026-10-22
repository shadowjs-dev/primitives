import { useId } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { MenuRoot } from "../menu/index";
import { menubarContext, menubarMenuContext } from "./context";

/**
 * Props of {@link MenubarMenu}. The menu renders no element and sets no ARIA or data attributes of
 * its own; the trigger and content it contains carry them.
 * @since 1.0.0
 * @see {@link MenubarMenu}
 */
export interface MenubarMenuProps {
  /**
   * The menu's value in the bar's `value`. The menu is open while the bar's value equals it.
   * @default generated (`useId()`) when omitted
   */
  readonly value?: string | undefined;
  /**
   * The `Menubar.Trigger`, `Menubar.Portal` and the rest of the menu.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/**
 * One menu of the bar: pairs a `Menubar.Trigger` with its `Menubar.Content`. It is open while the
 * bar's value is its value. It renders no element and handles no keys; the trigger and the content
 * carry the menubar's keyboard and ARIA behavior.
 *
 * @param props See {@link MenubarMenuProps}.
 * @returns The menu's parts, rendered inside the menu context.
 * @throws Error when rendered outside a `Menubar`; the message names the part and the root it needs.
 * @example
 * import { Menubar } from "@shadow-js/primitives/menubar";
 *
 * function EditMenu() {
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
 * @see {@link MenubarTrigger}
 * @since 1.0.0
 */
export function MenubarMenu(props: MenubarMenuProps): JsxChild {
  const bar = menubarContext.use("Menubar.Menu");
  const generated = useId();
  const value = (): string => props.value ?? generated;
  return (
    <menubarMenuContext.Provider value={{ value }}>
      <MenuRoot
        open={bar.value() === value()}
        onOpenChange={(open) => {
          if (open) bar.setValue(value());
          // Another menu may already have taken over; closing this one must not close that one.
          else if (bar.value() === value()) bar.setValue("");
        }}
        modal={false}
        dir={bar.dir()}
      >
        {props.children}
      </MenuRoot>
    </menubarMenuContext.Provider>
  );
}
