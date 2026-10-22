import { splitProps, untrack } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperArrow } from "../popper/index";
import {
  alwaysRun,
  callHandler,
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useControllableState,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  type MenuIndicatorContextValue,
  menuContentContext,
  menuIndicatorContext,
  menuRadioGroupContext,
  menuRootContext,
} from "./context";
import { useMenuItem } from "./use-menu-item";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** The `data-state` of a checkable item. */
function checkedState(
  checked: boolean | "indeterminate",
): "checked" | "unchecked" | "indeterminate" {
  if (checked === "indeterminate") return "indeterminate";
  return checked ? "checked" : "unchecked";
}

/**
 * Own props of {@link MenuItem}, shared by the checkbox and radio items and by the submenu trigger.
 *
 * Accessibility: the item has `tabindex="-1"` (the menu moves focus to it) and its role is
 * `menuitem`, `menuitemcheckbox` or `menuitemradio`. A disabled item sets `aria-disabled="true"`,
 * is skipped by the arrow keys and typeahead, and cannot be selected by click, pointer release,
 * Enter or Space.
 *
 * Data attributes: `data-highlighted` (empty value, present while the item has focus) and
 * `data-disabled` (empty value, present when disabled).
 * @since 1.0.0
 * @see {@link MenuItem}
 */
export interface MenuItemOwnProps {
  /**
   * A disabled item is skipped by the keyboard, cannot be selected and is announced as disabled.
   * @default false
   */
  readonly disabled?: boolean | undefined;
  /**
   * The text typeahead matches against.
   * @default none (the item's trimmed text content)
   */
  readonly textValue?: string | undefined;
  /**
   * The item was selected. `preventDefault()` keeps the menu open.
   * @default none
   */
  readonly onSelect?: ((event: Event) => void) | undefined;
}

/**
 * Props of {@link MenuItem}.
 * @since 1.0.0
 * @see {@link MenuItem}
 */
export type MenuItemProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MenuItemOwnProps,
  T
>;

/** What the three selectable parts hand to the shared implementation. */
interface SelectableProps {
  readonly part: string;
  readonly role: string;
  /** Extra element props (`aria-checked`, `data-state`). */
  readonly extra?: object | undefined;
  /** Runs after the application's `onSelect`, even when that vetoed closing the menu. */
  readonly onItemSelect?: (() => void) | undefined;
  /** What `Menu.ItemIndicator` reads. */
  readonly indicator?: MenuIndicatorContextValue | undefined;
  readonly props: Loose;
}

/** The shared implementation of items that select: activation by click, Enter, Space and pointer release. */
function SelectableItem(inner: SelectableProps): JsxChild {
  const root = menuRootContext.use(inner.part);
  const [own, rest] = splitProps(inner.props, [
    "as",
    "disabled",
    "textValue",
    "onSelect",
    "onClick",
    "onPointerDown",
    "onPointerUp",
    "onKeyDown",
  ]);
  const disabled = (): boolean => own["disabled"] === true;
  const binding = useMenuItem({
    part: inner.part,
    disabled,
    textValue: () => own["textValue"] as string | undefined,
  });
  // Set when the press began on this item; a release here without it means the press started elsewhere
  // (the trigger) and moved onto the item, which selects it.
  let pointerDown = false;

  const select = (): void => {
    if (untrack(disabled)) return;
    const event = new CustomEvent("primitives.menu.itemSelect", {
      bubbles: true,
      cancelable: true,
    });
    callHandler(own["onSelect"], event);
    inner.onItemSelect?.();
    if (event.defaultPrevented) pointerDown = false;
    else root.close();
  };

  const merged = mergeElementProps(
    binding.props,
    {
      role: inner.role,
      onPointerLeave: alwaysRun(() => {
        pointerDown = false;
      }),
      onPointerDown: alwaysRun(() => {
        pointerDown = true;
      }),
      onPointerUp: () => {
        if (!pointerDown) untrack(binding.element)?.click();
        pointerDown = false;
      },
      onClick: select,
      onKeyDown: (event: KeyboardEvent) => {
        if (untrack(disabled)) return;
        if (event.key === " " && binding.content.typeahead.search() !== "") return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          untrack(binding.element)?.click();
        }
      },
    },
    inner.extra,
    {
      onClick: own["onClick"],
      onPointerDown: own["onPointerDown"],
      onPointerUp: own["onPointerUp"],
      onKeyDown: own["onKeyDown"],
    },
    rest,
  );
  const indicator = inner.indicator;
  // The element is created inside the provider's branch, so the indicator finds its context.
  if (indicator === undefined) return <Polymorphic as={own.as ?? "div"} {...merged} />;
  return (
    <menuIndicatorContext.Provider value={indicator}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </menuIndicatorContext.Provider>
  );
}

/**
 * An action in the menu: `role="menuitem"` with `tabindex="-1"`. Enter and Space activate the
 * focused item; the arrow keys, Home, End and typeahead that move between items are handled by the
 * enclosing `Menu.Content`. A click, or releasing the pointer on the item after the press started
 * elsewhere (on the trigger), selects it. Selecting closes the menu unless `onSelect` calls
 * `event.preventDefault()`.
 *
 * @param props See {@link MenuItemProps}.
 * @returns The menu item element.
 * @throws Error when rendered outside a `Menu` or `Menu.Content`; the message names the part and the root it needs.
 * @example
 * import { useSignal } from "@shadow-js/core";
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function FileMenu() {
 *   const [open, setOpen] = useSignal(false);
 *   return (
 *     <Menu open={open()} onOpenChange={setOpen}>
 *       <Menu.Anchor>File</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Item onSelect={() => setOpen(false)}>Save</Menu.Item>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuContent}
 * @since 1.0.0
 */
export function MenuItem<T extends PolymorphicTarget = "div">(props: MenuItemProps<T>): JsxChild {
  return <SelectableItem part="Menu.Item" role="menuitem" props={partProps<Loose>(props)} />;
}

/**
 * Own props of {@link MenuCheckboxItem}. It extends {@link MenuItemOwnProps}.
 *
 * Accessibility: `role="menuitemcheckbox"` with `aria-checked` set to `"true"`, `"false"` or
 * `"mixed"` (while indeterminate). Enter, Space and a click toggle the item.
 *
 * Data attributes: `data-state` (`checked`, `unchecked` or `indeterminate`), plus the
 * `data-highlighted` and `data-disabled` attributes of {@link MenuItemOwnProps}.
 * @since 1.0.0
 * @see {@link MenuCheckboxItem}
 */
export interface MenuCheckboxItemOwnProps extends MenuItemOwnProps {
  /**
   * Controlled checked state. Omit it for an uncontrolled item.
   * @default none (uncontrolled)
   */
  readonly checked?: boolean | "indeterminate" | undefined;
  /**
   * Initial checked state when uncontrolled.
   * @default false
   */
  readonly defaultChecked?: boolean | "indeterminate" | undefined;
  /**
   * Called with the new state when the item is selected.
   * @default none
   */
  readonly onCheckedChange?: ((checked: boolean) => void) | undefined;
}

/**
 * Props of {@link MenuCheckboxItem}.
 * @since 1.0.0
 * @see {@link MenuCheckboxItem}
 */
export type MenuCheckboxItemProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MenuCheckboxItemOwnProps,
  T
>;

/**
 * An item that toggles a boolean: `role="menuitemcheckbox"` with `aria-checked` (`"mixed"` while
 * indeterminate) and `data-state` `checked` / `unchecked` / `indeterminate`. Enter, Space and a
 * click toggle it; selecting an indeterminate item checks it. The state toggles even when
 * `onSelect` vetoed closing the menu.
 *
 * @param props See {@link MenuCheckboxItemProps}.
 * @returns The checkbox item element.
 * @throws Error when rendered outside a `Menu` or `Menu.Content`; the message names the part and the root it needs.
 * @example
 * import { useSignal } from "@shadow-js/core";
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ViewMenu() {
 *   const [open, setOpen] = useSignal(false);
 *   const [bookmarks, setBookmarks] = useSignal(true);
 *   return (
 *     <Menu open={open()} onOpenChange={setOpen}>
 *       <Menu.Anchor>View</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.CheckboxItem checked={bookmarks()} onCheckedChange={setBookmarks}>
 *             <Menu.ItemIndicator>On</Menu.ItemIndicator> Show bookmarks
 *           </Menu.CheckboxItem>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuItem}
 * @since 1.0.0
 */
export function MenuCheckboxItem<T extends PolymorphicTarget = "div">(
  props: MenuCheckboxItemProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "checked",
    "defaultChecked",
    "onCheckedChange",
  ]);
  const [checked, setChecked] = useControllableState<boolean | "indeterminate">({
    value: () => own["checked"] as boolean | "indeterminate" | undefined,
    defaultValue: () => (own["defaultChecked"] as boolean | "indeterminate" | undefined) ?? false,
    onChange: () => (value) => {
      if (typeof value === "boolean") callHandler(own["onCheckedChange"], value);
    },
    name: "Menu.CheckboxItem checked",
  });
  return (
    <SelectableItem
      part="Menu.CheckboxItem"
      role="menuitemcheckbox"
      props={rest}
      indicator={{ checked }}
      extra={{
        get "aria-checked"() {
          const value = checked();
          return value === "indeterminate" ? "mixed" : value ? "true" : "false";
        },
        get "data-state"() {
          return checkedState(checked());
        },
      }}
      onItemSelect={() => setChecked(checked() === "indeterminate" ? true : !checked())}
    />
  );
}

/**
 * Own props of {@link MenuRadioGroup}.
 *
 * Accessibility: the group is `role="group"` and has no keyboard behavior of its own. The radio
 * items inside it are `menuitemradio` elements that the menu navigates like any other item.
 * Data attributes: none of its own.
 * @since 1.0.0
 * @see {@link MenuRadioGroup}
 */
export interface MenuRadioGroupOwnProps {
  /**
   * Controlled value. Omit it for an uncontrolled group.
   * @default none (uncontrolled)
   */
  readonly value?: string | undefined;
  /**
   * Initial value when uncontrolled.
   * @default none (no item is checked)
   */
  readonly defaultValue?: string | undefined;
  /**
   * Called with the value of the selected radio item.
   * @default none
   */
  readonly onValueChange?: ((value: string) => void) | undefined;
}

/**
 * Props of {@link MenuRadioGroup}.
 * @since 1.0.0
 * @see {@link MenuRadioGroup}
 */
export type MenuRadioGroupProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MenuRadioGroupOwnProps,
  T
>;

/**
 * A group of mutually exclusive `Menu.RadioItem`s: `role="group"`. It handles no keys itself; the
 * radio items inside it are navigated and selected like other items. Controlled with `value` /
 * `onValueChange` or uncontrolled with `defaultValue`.
 *
 * @param props See {@link MenuRadioGroupProps}.
 * @returns The group element.
 * @example
 * import { useSignal } from "@shadow-js/core";
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ThemeMenu() {
 *   const [theme, setTheme] = useSignal("light");
 *   return (
 *     <Menu>
 *       <Menu.Anchor>Theme</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.RadioGroup value={theme()} onValueChange={setTheme}>
 *             <Menu.RadioItem value="light">Light</Menu.RadioItem>
 *             <Menu.RadioItem value="dark">Dark</Menu.RadioItem>
 *           </Menu.RadioGroup>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuRadioItem}
 * @since 1.0.0
 */
export function MenuRadioGroup<T extends PolymorphicTarget = "div">(
  props: MenuRadioGroupProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "value",
    "defaultValue",
    "onValueChange",
  ]);
  const [value, setValue] = useControllableState<string | undefined>({
    value: () => own["value"] as string | undefined,
    defaultValue: () => own["defaultValue"] as string | undefined,
    onChange: () => (next) => {
      if (next !== undefined) callHandler(own["onValueChange"], next);
    },
    name: "Menu.RadioGroup value",
  });
  const merged = mergeElementProps({ role: "group" }, rest);
  return (
    <menuRadioGroupContext.Provider value={{ value, setValue: (next) => setValue(next) }}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </menuRadioGroupContext.Provider>
  );
}

/**
 * Own props of {@link MenuRadioItem}. It extends {@link MenuItemOwnProps}.
 *
 * Accessibility: `role="menuitemradio"` with `aria-checked` set to `"true"` or `"false"`. Enter,
 * Space and a click select the item, which sets the group's value.
 *
 * Data attributes: `data-state` (`checked` or `unchecked`), plus the `data-highlighted` and
 * `data-disabled` attributes of {@link MenuItemOwnProps}.
 * @since 1.0.0
 * @see {@link MenuRadioItem}
 */
export interface MenuRadioItemOwnProps extends MenuItemOwnProps {
  /**
   * The value this item stands for.
   * @default none (required)
   */
  readonly value: string;
}

/**
 * Props of {@link MenuRadioItem}.
 * @since 1.0.0
 * @see {@link MenuRadioItem}
 */
export type MenuRadioItemProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MenuRadioItemOwnProps,
  T
>;

/**
 * An item of a `Menu.RadioGroup`: `role="menuitemradio"` with `aria-checked` and `data-state`
 * `checked` / `unchecked`. Enter, Space and a click set the group's value to this item's value,
 * even when `onSelect` vetoed closing the menu.
 *
 * @param props See {@link MenuRadioItemProps}.
 * @returns The radio item element.
 * @throws Error when rendered outside a `Menu.RadioGroup`; the message names the part and the group it needs.
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ThemeMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>Theme</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.RadioGroup defaultValue="dark">
 *             <Menu.RadioItem value="dark">
 *               <Menu.ItemIndicator>On</Menu.ItemIndicator> Dark
 *             </Menu.RadioItem>
 *           </Menu.RadioGroup>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuRadioGroup}
 * @since 1.0.0
 */
export function MenuRadioItem<T extends PolymorphicTarget = "div">(
  props: MenuRadioItemProps<T>,
): JsxChild {
  const group = menuRadioGroupContext.use("Menu.RadioItem");
  const [own, rest] = splitProps(partProps<Loose>(props), ["value"]);
  const value = (): string => own["value"] as string;
  const checked = (): boolean => group.value() === value();
  return (
    <SelectableItem
      part="Menu.RadioItem"
      role="menuitemradio"
      props={rest}
      indicator={{ checked }}
      extra={{
        get "aria-checked"() {
          return checked() ? "true" : "false";
        },
        get "data-state"() {
          return checkedState(checked());
        },
      }}
      onItemSelect={() => group.setValue(untrack(value))}
    />
  );
}

/**
 * Props of {@link MenuItemIndicator}. The indicator has no role or keyboard behavior of its own;
 * its `data-state` (`checked`, `unchecked` or `indeterminate`) mirrors the enclosing checkbox or
 * radio item.
 * @since 1.0.0
 * @see {@link MenuItemIndicator}
 */
export type MenuItemIndicatorProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  {
    /**
     * Keep the indicator mounted while unchecked (for animation libraries).
     * @default false
     */
    readonly forceMount?: boolean | undefined;
  },
  T
>;

/**
 * Renders its children while the enclosing checkbox or radio item is checked (or indeterminate)
 * and keeps them mounted until their exit animation ends. It has no role and handles no keys; its
 * `data-state` mirrors the item's.
 *
 * @param props See {@link MenuItemIndicatorProps}.
 * @returns The indicator element while the item is checked (or always, with `forceMount`), otherwise nothing.
 * @throws Error when rendered outside a `Menu.CheckboxItem` or `Menu.RadioItem`; the message names the part and the item it needs.
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function BookmarksMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>View</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.CheckboxItem defaultChecked>
 *             <Menu.ItemIndicator>On</Menu.ItemIndicator> Bookmarks
 *           </Menu.CheckboxItem>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuCheckboxItem}
 * @since 1.0.0
 */
export function MenuItemIndicator<T extends PolymorphicTarget = "span">(
  props: MenuItemIndicatorProps<T>,
): JsxChild {
  const indicator = menuIndicatorContext.use("Menu.ItemIndicator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "forceMount"]);
  const presence = usePresence(() => own["forceMount"] === true || indicator.checked() !== false);
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return checkedState(indicator.checked());
      },
    },
    rest,
    { ref: composeRefs<HTMLElement>(presence.ref) },
  );
  return (
    <Show when={presence.mounted()}>
      <Polymorphic as={own.as ?? "span"} {...merged} />
    </Show>
  );
}

/**
 * Props of {@link MenuLabel}. It has no role, no `tabindex` and no data attributes; the menu
 * keyboard skips it.
 * @since 1.0.0
 * @see {@link MenuLabel}
 */
export type MenuLabelProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * A heading for a group of items. It has no role, is not focusable, is not an item, and the arrow
 * keys and typeahead skip it.
 *
 * @param props See {@link MenuLabelProps}.
 * @returns The label element.
 * @throws Error when rendered outside a `Menu.Content`; the message names the part and the content it needs.
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function EditMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>Edit</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Label>Clipboard</Menu.Label>
 *           <Menu.Item>Cut</Menu.Item>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuGroup}
 * @since 1.0.0
 */
export function MenuLabel<T extends PolymorphicTarget = "div">(props: MenuLabelProps<T>): JsxChild {
  menuContentContext.use("Menu.Label");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  return <Polymorphic as={own.as ?? "div"} {...rest} />;
}

/**
 * Props of {@link MenuGroup}. It sets `role="group"` and has no keyboard behavior; give the group an
 * `aria-label` or `aria-labelledby` so assistive technology can name it.
 * @since 1.0.0
 * @see {@link MenuGroup}
 */
export type MenuGroupProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Groups related items: `role="group"`. It is not focusable and the arrow keys skip it; the items
 * inside are navigated as usual.
 *
 * @param props See {@link MenuGroupProps}.
 * @returns The group element.
 * @throws Error when rendered outside a `Menu.Content`; the message names the part and the content it needs.
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function EditMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>Edit</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Group aria-label="Edit">
 *             <Menu.Item>Cut</Menu.Item>
 *             <Menu.Item>Copy</Menu.Item>
 *           </Menu.Group>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuLabel}
 * @since 1.0.0
 */
export function MenuGroup<T extends PolymorphicTarget = "div">(props: MenuGroupProps<T>): JsxChild {
  menuContentContext.use("Menu.Group");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps({ role: "group" }, rest);
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * Props of {@link MenuSeparator}. It sets `role="separator"`, `aria-orientation="horizontal"` and
 * `data-orientation="horizontal"`, and the keyboard skips it.
 * @since 1.0.0
 * @see {@link MenuSeparator}
 */
export type MenuSeparatorProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * A visual divider between groups: `role="separator"` with `aria-orientation="horizontal"` and
 * `data-orientation="horizontal"`. It is not focusable and the arrow keys and typeahead skip it.
 *
 * @param props See {@link MenuSeparatorProps}.
 * @returns The separator element.
 * @throws Error when rendered outside a `Menu.Content`; the message names the part and the content it needs.
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function EditMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>Edit</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Item>Cut</Menu.Item>
 *           <Menu.Separator />
 *           <Menu.Item>Paste</Menu.Item>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuGroup}
 * @since 1.0.0
 */
export function MenuSeparator<T extends PolymorphicTarget = "div">(
  props: MenuSeparatorProps<T>,
): JsxChild {
  menuContentContext.use("Menu.Separator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    { role: "separator", "aria-orientation": "horizontal", "data-orientation": "horizontal" },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * An arrow pointing at the anchor, for `Menu.Content`. It is the `PopperArrow` part: an `svg`
 * triangle that follows the placed side. Style it with `fill`.
 *
 * @example
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ArrowMenu() {
 *   return (
 *     <Menu defaultOpen>
 *       <Menu.Anchor>Actions</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Arrow class="fill-white" width={12} height={6} />
 *           <Menu.Item>Save</Menu.Item>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link PopperArrow}
 * @since 1.0.0
 */
export const MenuArrow: typeof PopperArrow = PopperArrow;
