import { mergeProps, splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { MenuContent, type MenuContentProps } from "../menu/index";
import { callHandler, composeEventHandlers, type PolymorphicTarget } from "../utils/index";
import { partProps } from "../utils/part-props";
import { menubarContext, menubarMenuContext } from "./context";

/**
 * Props of {@link MenubarContent}: the same as {@link MenuContentProps}. Accessibility and data
 * attributes are described on {@link MenubarContent}.
 * @since 1.0.0
 * @see {@link MenubarContent}
 */
export type MenubarContentProps<T extends PolymorphicTarget = "div"> = MenuContentProps<T>;

type Render = (props: Record<string, unknown>) => JsxChild;
type Loose = { readonly [prop: string]: unknown };

/** `values` rotated so that it starts at `start`. */
function wrapArray<V>(values: readonly V[], start: number): V[] {
  return values.map((_, index) => values[(start + index) % values.length] as V);
}

/**
 * The menu of a `Menubar.Menu`, anchored to its trigger (`side="bottom"`, `align="start"`).
 * Keyboard and ARIA: it is `role="menu"`; ArrowLeft and ArrowRight (swapped in RTL) move to the
 * neighboring menu, wrapping when the bar has `loop`, and open it with its first item focused,
 * except on a submenu trigger where ArrowRight opens the submenu. Escape and Tab close it, as in
 * `Menu.Content`. Pressing another trigger of the bar does not dismiss it. Everything
 * `Menu.Content` offers applies.
 *
 * @param props See {@link MenubarContentProps}.
 * @returns The menu element, or nothing while it is not mounted.
 * @throws Error when rendered outside a `Menubar`; the message names the part and the root it needs.
 * @example
 * import { Menubar } from "@shadow-js/primitives/menubar";
 *
 * function FileMenu() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="file">
 *         <Menubar.Trigger>File</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content sideOffset={8}>
 *             <Menubar.Item>New</Menubar.Item>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenuContent}
 * @since 1.0.0
 */
export function MenubarContent<T extends PolymorphicTarget = "div">(
  props: MenubarContentProps<T>,
): JsxChild {
  const bar = menubarContext.use("Menubar.Content");
  const current = menubarMenuContext.use("Menubar.Content");
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "onKeyDown",
    "onInteractOutside",
    "onCloseAutoFocus",
  ]);
  const Content = MenuContent as unknown as Render;

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    const element = event.currentTarget;
    // Keys from a submenu rendered inside this content belong to that submenu.
    if (!(target instanceof Element) || !(element instanceof Element)) return;
    if (target.closest('[role="menu"]') !== element) return;
    const previousKey = bar.dir() === "rtl" ? "ArrowRight" : "ArrowLeft";
    const isPrevious = event.key === previousKey;
    // The "next" key on a submenu trigger opens the submenu.
    if (
      !isPrevious &&
      (event.defaultPrevented || target.closest('[aria-haspopup="menu"]') !== null)
    ) {
      return;
    }
    const enabled = bar.triggers.getItems().filter((item) => !item.data.disabled());
    let values = enabled.map((item) => item.data.value);
    if (isPrevious) values = values.reverse();
    const index = values.indexOf(current.value());
    const candidates = bar.loop() ? wrapArray(values, index + 1) : values.slice(index + 1);
    const next = candidates[0];
    if (next === undefined || next === current.value()) return;
    event.preventDefault();
    bar.openMenu(next, "first");
  };

  const merged = mergeProps({ side: "bottom", align: "start" }, rest, {
    onKeyDown: composeEventHandlers(() => own["onKeyDown"], onKeyDown),
    onInteractOutside: (event: CustomEvent<{ originalEvent: Event }>) => {
      callHandler(own["onInteractOutside"], event);
      if (event.defaultPrevented) return;
      const target = event.detail.originalEvent.target;
      // Pressing (or focusing) another trigger of the bar is the bar's business, not an outside interaction.
      if (
        target instanceof Node &&
        bar.triggers.getItems().some((item) => item.element.contains(target))
      ) {
        event.preventDefault();
      }
    },
    onCloseAutoFocus: (event: Event) => {
      callHandler(own["onCloseAutoFocus"], event);
      // Another menu took over: focus belongs to it.
      if (!event.defaultPrevented && untrack(bar.value) !== "") event.preventDefault();
    },
  });
  return <Content {...merged} />;
}
