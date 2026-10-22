import { splitProps, untrack } from "@shadow-js/core";
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

/**
 * Own props of {@link DropdownMenuTrigger}.
 *
 * Accessibility: the trigger is a `button` with `aria-haspopup="menu"`, `aria-expanded` and
 * `aria-controls` (only while open); a disabled trigger also gets the native `disabled` attribute.
 * Data attributes: `data-state` is `"open"` or `"closed"`, and `data-disabled` is present (empty value)
 * while disabled.
 * @since 1.0.0
 * @see {@link DropdownMenuTrigger}
 */
export interface DropdownMenuTriggerOwnProps {
  /** A disabled trigger cannot open the menu. @default `false` */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link DropdownMenuTrigger}: the attributes of the chosen element (`button` by default).
 * @since 1.0.0
 * @see {@link DropdownMenuTrigger}
 */
export type DropdownMenuTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  DropdownMenuTriggerOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The button that opens the menu and anchors it. Renders a `button` with `aria-haspopup="menu"`,
 * `aria-expanded`, `aria-controls` (only while open, so it never points at nothing) and
 * `data-state="open" | "closed"`.
 *
 * The menu opens on pointer *down* (left button, not Ctrl+click) so a press-drag-release selects an
 * item in one gesture. Keyboard: Enter and Space toggle the menu (opening it focuses the first item),
 * ArrowDown opens it with the first item focused and ArrowUp with the last item focused.
 *
 * @param props See {@link DropdownMenuTriggerProps}.
 * @returns The rendered button.
 * @example
 * import { DropdownMenu } from "@shadow-js/primitives";
 *
 * export function OptionsButton() {
 *   return (
 *     <DropdownMenu>
 *       <DropdownMenu.Trigger class="btn">Options</DropdownMenu.Trigger>
 *     </DropdownMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link DropdownMenuRoot}
 */
export function DropdownMenuTrigger<T extends PolymorphicTarget = "button">(
  props: DropdownMenuTriggerProps<T>,
): JsxChild {
  const menu = menuContext.use("DropdownMenu.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "disabled",
    "onPointerDown",
    "onKeyDown",
  ]);
  menu.triggerPart.register();
  const disabled = (): boolean => own["disabled"] === true;
  const merged = mergeElementProps(
    {
      type: "button",
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
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      get disabled() {
        return disabled() ? true : undefined;
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((element) => menu.setTrigger(element)),
      onPointerDown: composeEventHandlers(
        () => own["onPointerDown"],
        (event: PointerEvent) => {
          // Only the primary button; Ctrl+click is a secondary click on macOS.
          if (untrack(disabled) || event.button !== 0 || event.ctrlKey) return;
          const wasOpen = untrack(menu.open);
          menu.entry.value = "content";
          menu.setOpen(!wasOpen);
          // Keep the trigger from taking focus from the menu that is about to take it.
          if (!wasOpen) event.preventDefault();
        },
      ),
      onKeyDown: composeEventHandlers(
        () => own["onKeyDown"],
        (event: KeyboardEvent) => {
          if (untrack(disabled)) return;
          const open = untrack(menu.open);
          if (event.key === "Enter" || event.key === " ") {
            menu.entry.value = "first";
            menu.setOpen(!open);
          } else if (event.key === "ArrowDown") {
            menu.entry.value = "first";
            menu.setOpen(true);
          } else if (event.key === "ArrowUp") {
            menu.entry.value = "last";
            menu.setOpen(true);
          } else return;
          // Stops the page scrolling and the keydown from activating the item that just took focus.
          event.preventDefault();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
