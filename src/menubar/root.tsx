import { onMount, splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  createCollection,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useControllableState,
  useRefSignal,
  useRovingFocus,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import { type MenubarContextValue, type MenubarTriggerData, menubarContext } from "./context";

/**
 * Own props of {@link Menubar}.
 *
 * Accessibility: the bar is `role="menubar"` and sets `dir` to the resolved direction. Its triggers
 * are `menuitem` buttons that share one tab stop (roving tabindex), and ArrowLeft and ArrowRight
 * (swapped in RTL) move between them, with Home and End going to the first and last. Disabled
 * triggers are skipped.
 *
 * Data attributes: `data-orientation="horizontal"` on the bar. The triggers set `data-state`
 * and the other attributes described on {@link MenubarTriggerOwnProps}.
 * @since 1.0.0
 * @see {@link Menubar}
 */
export interface MenubarOwnProps {
  /**
   * Controlled value of the open menu (`""` when none is open).
   * @default none (uncontrolled)
   */
  readonly value?: string | undefined;
  /**
   * Initial value when uncontrolled: the `value` of the menu that starts open.
   * @default ""
   */
  readonly defaultValue?: string | undefined;
  /**
   * Called with the value of the menu that opened, or `""` when the open menu closed.
   * @default none
   */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /**
   * Reading direction; flips ArrowLeft and ArrowRight.
   * @default none (the surrounding direction: `DirectionProvider`, then the document's `dir`, then `"ltr"`)
   */
  readonly dir?: "ltr" | "rtl" | undefined;
  /**
   * ArrowLeft and ArrowRight wrap from the last menu to the first and back.
   * @default false
   */
  readonly loop?: boolean | undefined;
}

/**
 * Props of {@link Menubar}.
 * @since 1.0.0
 * @see {@link Menubar}
 */
export type MenubarProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MenubarOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * A horizontal bar of menus: `role="menubar"`. The triggers form one tab stop; ArrowLeft and
 * ArrowRight (swapped in RTL) move between them, and Home and End jump to the ends. ArrowDown, Enter
 * and Space open a menu. While one is open, hovering another trigger opens that one instead, and
 * ArrowLeft and ArrowRight inside a menu move to the neighboring menu.
 *
 * @param props See {@link MenubarOwnProps}.
 * @returns The `role="menubar"` element with its children.
 * @example
 * import { Menubar } from "@shadow-js/primitives/menubar";
 *
 * function AppMenubar() {
 *   return (
 *     <Menubar>
 *       <Menubar.Menu value="file">
 *         <Menubar.Trigger>File</Menubar.Trigger>
 *         <Menubar.Portal>
 *           <Menubar.Content>
 *             <Menubar.Item>New tab</Menubar.Item>
 *           </Menubar.Content>
 *         </Menubar.Portal>
 *       </Menubar.Menu>
 *     </Menubar>
 *   );
 * }
 * @see {@link MenubarMenu}
 * @since 1.0.0
 */
export function MenubarRoot<T extends PolymorphicTarget = "div">(props: MenubarProps<T>): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & MenubarOwnProps>(props), [
    "as",
    "value",
    "defaultValue",
    "onValueChange",
    "dir",
    "loop",
  ]);
  const [value, setValue] = useControllableState<string>({
    value: () => own.value,
    defaultValue: () => own.defaultValue ?? "",
    onChange: () => own.onValueChange,
    name: "Menubar value",
  });
  const [root, setRoot] = useRefSignal<HTMLElement>();
  let element: HTMLElement | undefined;
  // The root carries its own dir attribute, so the search starts above it, at the parent.
  const dir = useDirectionAround(
    () => own.dir as "ltr" | "rtl" | undefined,
    () => root()?.parentElement,
  );
  // Set after mount: a ref runs before the root is inserted, so its ancestors are not known yet.
  onMount(() => setRoot(element));
  const loop = (): boolean => own.loop === true;
  const roving = useRovingFocus({ orientation: () => "horizontal", dir, loop });
  const triggers = createCollection<MenubarTriggerData>();
  const context: MenubarContextValue = {
    value,
    setValue: (next) => setValue(next),
    dir,
    loop,
    roving,
    triggers,
    openMenu(next, entry) {
      triggers
        .getItems()
        .find((item) => item.data.value === next)
        ?.data.setEntry(entry);
      setValue(next);
    },
  };
  const merged = mergeElementProps(
    {
      role: "menubar",
      "data-orientation": "horizontal",
      ref: composeRefs<HTMLElement>((node) => {
        element = node;
      }),
      get dir() {
        return dir();
      },
    },
    rest,
  );
  return (
    <menubarContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </menubarContext.Provider>
  );
}
