import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { createPartContext, type PartContext } from "../utils/index";
import { comboboxContext } from "./context";

/**
 * Props of {@link ComboboxPortal}.
 *
 * Accessibility: the portal adds no ARIA attributes and no keyboard handling; the list keeps the
 * behavior of `Combobox.Content` wherever it renders. Data attributes: none of its own.
 * @since 1.0.0
 * @see {@link ComboboxPortal}
 */
export interface ComboboxPortalProps {
  /** Where to render the list. @default `document.body` */
  readonly container?: Element | null | (() => Element | null | undefined);
  /** The `Combobox.Content` to render into the container. @default none */
  readonly children?: JsxChild | undefined;
}

/**
 * What a `Combobox.Content` inside a portal needs to know to place its open list. @internal
 * @since 1.0.0
 * @see {@link ComboboxPortal}
 */
export interface ComboboxPortalContextValue {
  /** The element the open list is rendered into. */
  readonly container: () => Element | null | undefined;
}

/**
 * The context `Combobox.Portal` provides to its `Combobox.Content`. Internal to the primitive: it is
 * not exported from the package entry point. @internal
 * @since 1.0.0
 * @see {@link ComboboxPortal}
 */
export const comboboxPortalContext: PartContext<ComboboxPortalContextValue> =
  createPartContext<ComboboxPortalContextValue>("Combobox.Portal");

/** The element to render into: the application's container, or the body. */
function resolveContainer(container: ComboboxPortalProps["container"]): Element | null | undefined {
  if (container === undefined) return document.body;
  return typeof container === "function" ? container() : container;
}

/**
 * Tells the `Combobox.Content` inside it to render the open list into `document.body` (or
 * `container`). It renders no element and no portal of its own: the content opens its portal when
 * the list opens, so the list is always the last child of the container and stacks above whatever
 * opened before it (a dialog the combobox sits in). While the list is closed the content keeps only
 * a hidden registry of its items (so a selected value knows its label). Nothing is rendered on the
 * server: put `Combobox.Content` directly inside `Combobox` when the list has to be part of the
 * server markup. Keyboard: the portal handles no keys. ARIA: it sets no role or ARIA attribute of
 * its own; the list keeps the behavior of `Combobox.Content`.
 *
 * @param props See {@link ComboboxPortalProps}.
 * @returns The children inside the portal context; it renders no element of its own.
 * @example
 * import { Combobox } from "@shadow-js/primitives";
 *
 * export function FruitPicker() {
 *   return (
 *     <Combobox>
 *       <Combobox.Input />
 *       <Combobox.Portal>
 *         <Combobox.Content>
 *           <Combobox.Item value="apple">Apple</Combobox.Item>
 *         </Combobox.Content>
 *       </Combobox.Portal>
 *     </Combobox>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ComboboxContent}
 */
export function ComboboxPortal(props: ComboboxPortalProps): JsxChild {
  comboboxContext.use("Combobox.Portal");
  return (
    <comboboxPortalContext.Provider value={{ container: () => resolveContainer(props.container) }}>
      {props.children}
    </comboboxPortalContext.Provider>
  );
}
