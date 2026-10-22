import { type Accessor, useSignal } from "@shadow-js/core";
import {
  type Collection,
  createPartContext,
  type Direction,
  type PartContext,
  type PartRegistration,
  partId,
  type Typeahead,
  usePartRegistration,
} from "../utils/index";
import type { SafeArea } from "./intent";

/**
 * Where focus goes when a menu opens: the first item, the last item, or the content itself (so
 * that no item is highlighted, which is what a pointer user expects).
 * @since 1.0.0
 * @see {@link MenuContent}
 */
export type MenuEntry = "first" | "last" | "content";

/**
 * A mutable box holding the entry focus the next open should use; the opener writes, the content
 * reads it once.
 * @since 1.0.0
 * @see {@link MenuEntry}
 */
export interface MenuEntryRef {
  /** The entry the next open focuses, or `undefined` for the default. */
  value: MenuEntry | undefined;
}

/**
 * A mutable box the mounted content fills with its focus mover.
 * @since 1.0.0
 * @see {@link MenuEntry}
 */
export interface MenuFocuserRef {
  current: ((entry: MenuEntry) => void) | undefined;
}

/**
 * What one menu (the root menu, or one submenu) shares with its parts. Built by
 * {@link createMenuState}.
 * @since 1.0.0
 * @see {@link createMenuState}
 */
export interface MenuContextValue {
  /** Whether the menu is open. Call it to read the value. */
  readonly open: Accessor<boolean>;
  readonly setOpen: (open: boolean) => void;
  readonly triggerId: Accessor<string>;
  readonly contentId: Accessor<string>;
  /** The element that opens this menu: focus goes back to it and it counts as inside. */
  readonly trigger: Accessor<HTMLElement | undefined>;
  readonly setTrigger: (element: HTMLElement | undefined) => void;
  readonly content: Accessor<HTMLElement | undefined>;
  readonly setContent: (element: HTMLElement | undefined) => void;
  readonly entry: MenuEntryRef;
  /** Set by the mounted content: moves focus to the first or last item, or to the content. */
  readonly focuser: MenuFocuserRef;
  /** Whether a trigger part is mounted (so `aria-labelledby` never points at nothing). */
  readonly triggerPart: PartRegistration;
  /** Keeps a portal alive while content is still animating out; returns the release function. */
  readonly hold: () => () => void;
  /** Whether any content is being held. Tracked. */
  readonly held: Accessor<boolean>;
}

/**
 * What belongs to the whole menu tree, whatever submenu a part sits in.
 * @since 1.0.0
 * @see {@link menuRootContext}
 */
export interface MenuRootContextValue {
  /** Whether the menu tree is modal (outside interaction is blocked while it is open). Call it to read the value. */
  readonly modal: Accessor<boolean>;
  /** The effective reading direction. Call it to read the value. */
  readonly dir: Accessor<Direction>;
  /** Closes the root menu and with it every submenu. */
  readonly close: () => void;
  /** Whether the keyboard was the last input. */
  readonly isKeyboard: () => boolean;
}

/**
 * The data every item registers with its content.
 * @since 1.0.0
 * @see {@link menuContentContext}
 */
export interface MenuItemData {
  /** The text typeahead matches against. */
  readonly textValue: () => string;
  readonly disabled: () => boolean;
}

/**
 * The area a pointer may cross on its way to a submenu, and what to do when it stops.
 * @since 1.0.0
 * @see {@link getSafeArea}
 */
export interface GraceIntent {
  /** The polygon the pointer may cross on its way to the submenu. */
  readonly area: SafeArea;
  /** Called when the pointer stopped moving inside the area without arriving. */
  readonly onExpire: () => void;
}

/**
 * What the items of one content read from it.
 * @since 1.0.0
 * @see {@link menuContentContext}
 */
export interface MenuContentContextValue {
  /** The items registered with this content, in DOM order. */
  readonly items: Collection<MenuItemData>;
  /** The content element, or `undefined` before it mounts. Call it to read the value. */
  readonly content: Accessor<HTMLElement | undefined>;
  /** The typeahead matcher that jumps to an item by its first letters. */
  readonly typeahead: Typeahead;
  /** The effective reading direction. Call it to read the value. */
  readonly dir: Accessor<Direction>;
  /** Moves focus to the content itself (nothing highlighted). */
  focusContent(): void;
  /** Whether the pointer at `event` is heading for an open submenu, so siblings must ignore it. */
  isPointerMovingToSubmenu(event: PointerEvent): boolean;
  /** Starts (or, with `null`, ends) the grace period of a submenu being approached. */
  setGrace(intent: GraceIntent | null): void;
  /** Registers the content of a submenu so a pointer traveling into it is not "leaving". */
  registerChild(element: HTMLElement): () => void;
  /** Whether `node` is inside a submenu content registered under this content. */
  isInSubmenu(node: Node | null): boolean;
}

/**
 * The checked state of an item, for its indicator. Internal: the indicator part reads it from the
 * checkbox or radio item it sits in.
 * @internal
 * @since 1.0.0
 * @see {@link MenuItemIndicator}
 */
export interface MenuIndicatorContextValue {
  readonly checked: Accessor<boolean | "indeterminate">;
}

/**
 * The value of a radio group. Internal: the radio items read and set it through
 * {@link menuRadioGroupContext}.
 * @internal
 * @since 1.0.0
 * @see {@link MenuRadioGroup}
 */
export interface MenuRadioGroupContextValue {
  readonly value: Accessor<string | undefined>;
  readonly setValue: (value: string) => void;
}

/**
 * The context of the closest menu (the root menu, or a submenu). Custom parts built on the core
 * read it, e.g. a trigger that opens the menu.
 *
 * @example
 * import { menuContext } from "@shadow-js/primitives/menu";
 *
 * function MyMenuTrigger() {
 *   const menu = menuContext.use("MyMenu.Trigger");
 *   return <button type="button" onClick={() => menu.setOpen(!menu.open())}>Toggle</button>;
 * }
 * @see {@link MenuRoot}
 * @since 1.0.0
 */
export const menuContext: PartContext<MenuContextValue> =
  createPartContext<MenuContextValue>("Menu");
/**
 * The context of the whole menu tree: modality, direction and `close()` (which closes the root menu
 * and with it every submenu).
 *
 * @example
 * import { menuRootContext } from "@shadow-js/primitives/menu";
 *
 * function CloseMenuButton() {
 *   const root = menuRootContext.use("MyMenu.Item");
 *   return <button type="button" onClick={() => root.close()}>Close menu</button>;
 * }
 * @see {@link MenuRoot}
 * @since 1.0.0
 */
export const menuRootContext: PartContext<MenuRootContextValue> =
  createPartContext<MenuRootContextValue>("Menu");
/**
 * The context an item reads from the content it sits in (its item registry, typeahead and pointer
 * intent).
 *
 * @example
 * import { menuContentContext } from "@shadow-js/primitives/menu";
 *
 * function FocusMenuButton() {
 *   const content = menuContentContext.use("MyMenu.Item");
 *   return <button type="button" onClick={() => content.focusContent()}>Focus the menu</button>;
 * }
 * @see {@link MenuContent}
 * @since 1.0.0
 */
export const menuContentContext: PartContext<MenuContentContextValue> =
  createPartContext<MenuContentContextValue>("Menu.Content");
/**
 * The checked state an item indicator reads. Internal: not exported from the package entry.
 * @internal
 * @since 1.0.0
 * @see {@link MenuItemIndicator}
 */
export const menuIndicatorContext: PartContext<MenuIndicatorContextValue> =
  createPartContext<MenuIndicatorContextValue>("Menu.CheckboxItem");
/**
 * The value a radio item reads from its group. Internal: not exported from the package entry.
 * @internal
 * @since 1.0.0
 * @see {@link MenuRadioGroup}
 */
export const menuRadioGroupContext: PartContext<MenuRadioGroupContextValue> =
  createPartContext<MenuRadioGroupContextValue>("Menu.RadioGroup");

/**
 * The inputs of {@link createMenuState}.
 * @since 1.0.0
 * @see {@link createMenuState}
 */
export interface MenuStateOptions {
  /** The open state of the menu or submenu. It drives `data-state` and whether the content is mounted. @default none (required) */
  readonly open: Accessor<boolean>;
  /** Requests a new open state; the owner decides whether it takes effect. @default none (required) */
  readonly setOpen: (open: boolean) => void;
  /** The base id the trigger and content ids derive from. @default none (required) */
  readonly base: Accessor<string>;
  /** Called with the trigger so the caller can make it the popper anchor. @default none (required) */
  readonly onTrigger: (element: HTMLElement | undefined) => void;
}

/**
 * Builds the state of one menu or submenu: the open state, the trigger and content elements, the
 * derived ids, the entry and focus boxes, and the hold counter that keeps a portal mounted while
 * its content animates out. Internal: called by `MenuRoot` and `MenuSub`.
 *
 * @param options See {@link MenuStateOptions}.
 * @returns The context value that the menu's parts read.
 * @internal
 * @since 1.0.0
 * @see {@link MenuRoot}
 */
export function createMenuState(options: MenuStateOptions): MenuContextValue {
  const [trigger, setTrigger] = useSignal<HTMLElement | undefined>(undefined);
  const [content, setContent] = useSignal<HTMLElement | undefined>(undefined);
  const [holds, setHolds] = useSignal(0);
  return {
    open: options.open,
    setOpen: options.setOpen,
    triggerId: () => partId(options.base(), "trigger"),
    contentId: () => partId(options.base(), "content"),
    trigger,
    setTrigger(element) {
      setTrigger(() => element);
      options.onTrigger(element);
    },
    content,
    setContent: (element) => setContent(() => element),
    entry: { value: undefined },
    focuser: { current: undefined },
    triggerPart: usePartRegistration(),
    hold() {
      setHolds((count) => count + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        setHolds((count) => count - 1);
      };
    },
    held: () => holds() > 0,
  };
}
