import type { Accessor } from "@shadow-js/core";
import type { MenuEntry } from "../menu/index";
import {
  type Collection,
  createPartContext,
  type Direction,
  type PartContext,
  type RovingFocus,
} from "../utils/index";

/**
 * What each menu's trigger tells the bar.
 * @internal
 * @since 1.0.0
 * @see {@link MenubarTrigger}
 */
export interface MenubarTriggerData {
  readonly value: string;
  readonly disabled: () => boolean;
  /** Says how the menu should place focus when it opens next. */
  readonly setEntry: (entry: MenuEntry) => void;
}

/**
 * What the parts of a menubar read from its root.
 * @internal
 * @since 1.0.0
 * @see {@link MenubarRoot}
 */
export interface MenubarContextValue {
  /** The value of the open menu, or `""`. */
  readonly value: Accessor<string>;
  readonly setValue: (value: string) => void;
  readonly dir: Accessor<Direction>;
  readonly loop: Accessor<boolean>;
  readonly roving: RovingFocus;
  readonly triggers: Collection<MenubarTriggerData>;
  /** Opens the menu with this value, placing focus per `entry`. */
  readonly openMenu: (value: string, entry: MenuEntry) => void;
}

/**
 * What the parts of one menu read.
 * @internal
 * @since 1.0.0
 * @see {@link MenubarMenu}
 */
export interface MenubarMenuContextValue {
  readonly value: Accessor<string>;
}

/**
 * The context the parts of a menubar read from its root: the open value, the roving focus and the
 * trigger registry. Internal: not exported from the package entry.
 * @internal
 * @since 1.0.0
 * @see {@link MenubarRoot}
 */
export const menubarContext: PartContext<MenubarContextValue> =
  createPartContext<MenubarContextValue>("Menubar");
/**
 * The context the parts of one menu read: the value of the `Menubar.Menu` they belong to. Internal:
 * not exported from the package entry.
 * @internal
 * @since 1.0.0
 * @see {@link MenubarMenu}
 */
export const menubarMenuContext: PartContext<MenubarMenuContextValue> =
  createPartContext<MenubarMenuContextValue>("Menubar.Menu");
