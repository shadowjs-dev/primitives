import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { createPartContext, type PartContext } from "../utils/index";
import { selectContext } from "./context";

/**
 * Props of {@link SelectPortal}. Accessibility and data attributes: none of its own; the open
 * listbox it places keeps the attributes of `Select.Content`.
 * @see {@link SelectPortal}
 * @see {@link Select}
 * @since 1.0.0
 */
export interface SelectPortalProps {
  /**
   * Where to render the listbox. Accepts an element, `null`, or a function that returns one.
   * @default `document.body`
   */
  readonly container?: Element | null | (() => Element | null | undefined);
  /**
   * The parts of the select to render inside the portal, usually `Select.Content`.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/** What a `Select.Content` inside a portal needs to know to place its open listbox. @internal */
export interface SelectPortalContextValue {
  /** The element the open listbox is rendered into. */
  readonly container: () => Element | null | undefined;
}

/**
 * The context a `Select.Portal` provides to the `Select.Content` inside it. Internal: only
 * `Select.Content` reads it.
 * @internal
 * @since 1.0.0
 */
export const selectPortalContext: PartContext<SelectPortalContextValue> =
  createPartContext<SelectPortalContextValue>("Select.Portal");

/** The element to render into: the application's container, or the body. */
function resolveContainer(container: SelectPortalProps["container"]): Element | null | undefined {
  if (container === undefined) return document.body;
  return typeof container === "function" ? container() : container;
}

/**
 * Tells the `Select.Content` inside it to render the open listbox into `document.body` (or
 * `container`). It renders no element and no portal of its own: the content opens its portal when
 * the listbox opens, so the listbox is always the last child of the container and stacks above
 * whatever opened before it (a dialog the select sits in). While the listbox is closed the content
 * keeps its items in a detached element instead (see `Select.Value`). Nothing is rendered on the
 * server: put `Select.Content` directly inside `Select` when the open listbox has to be part of the
 * server markup. Keyboard: the portal handles no keys. ARIA: it sets no role or ARIA attribute of its
 * own; the listbox keeps the behavior of `Select.Content`.
 *
 * @param props See {@link SelectPortalProps}.
 * @returns The children, inside the portal context.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select>
 *   <Select.Portal>
 *     <Select.Content>
 *       <Select.Viewport>
 *         <Select.Item value="apple"><Select.ItemText>Apple</Select.ItemText></Select.Item>
 *       </Select.Viewport>
 *     </Select.Content>
 *   </Select.Portal>
 * </Select>;
 * @see {@link SelectContent}
 * @since 1.0.0
 */
export function SelectPortal(props: SelectPortalProps): JsxChild {
  selectContext.use("Select.Portal");
  return (
    <selectPortalContext.Provider value={{ container: () => resolveContainer(props.container) }}>
      {props.children}
    </selectPortalContext.Provider>
  );
}
