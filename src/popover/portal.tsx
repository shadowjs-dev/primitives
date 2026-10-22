import { Portal, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { popoverContext } from "./context";

/**
 * Props of {@link PopoverPortal}: where the popover content is rendered.
 *
 * Accessibility: none of its own; the content keeps the dialog wiring of {@link PopoverContent}.
 * Data attributes: none.
 * @since 1.0.0
 * @see {@link PopoverPortal}
 */
export interface PopoverPortalProps {
  /**
   * Where to render the popover. A function is called to get the element.
   * @default document.body
   */
  readonly container?: Element | null | (() => Element | null | undefined);
  /**
   * Keep the portal and its content mounted while closed (for animation libraries that control
   * mounting).
   * @default false
   */
  readonly forceMount?: boolean | undefined;
  /**
   * The `Popover.Content` (and anything else to render into the container).
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/** The element to render into: the application's container, or the body. */
function resolveContainer(container: PopoverPortalProps["container"]): Element | null | undefined {
  if (container === undefined) return document.body;
  return typeof container === "function" ? container() : container;
}

/**
 * Renders the content into `document.body` (or `container`) while the popover is open, and keeps
 * it there until its exit animation has finished. It renders nothing where it is written: on the
 * server the content is emitted at the end of the document's `<body>` instead, and the browser moves
 * it into `container` when it hydrates. To keep the content at its place in the server markup, put
 * `Popover.Content` directly inside `Popover` without a portal.
 *
 * @param props See {@link PopoverPortalProps}.
 * @returns Nothing in place; the content is rendered into the container.
 * @throws Error when rendered outside {@link PopoverRoot}.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function PortaledPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger>Open</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content aria-label="Message">Rendered in the body</Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverContent}
 */
export function PopoverPortal(props: PopoverPortalProps): JsxChild {
  const context = popoverContext.use("Popover.Portal");
  return (
    <Show when={context.open() || context.held() || props.forceMount === true}>
      <Portal mount={() => resolveContainer(props.container)}>{props.children}</Portal>
    </Show>
  );
}
