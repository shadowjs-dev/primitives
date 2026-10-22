import { Portal, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { tooltipContext } from "./context";

/**
 * Props of {@link TooltipPortal}.
 * @since 1.0.0
 * @see {@link TooltipPortal}
 */
export interface TooltipPortalProps {
  /**
   * Where to render the tooltip. A function is called when the content mounts.
   * @default `document.body`
   */
  readonly container?: Element | null | (() => Element | null | undefined);
  /**
   * Keeps the content mounted while closed, for animation libraries that control mounting.
   * @default `false`
   */
  readonly forceMount?: boolean | undefined;
  /**
   * The content to render in the container.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/** The element to render into: the application's container, or the body. */
function resolveContainer(container: TooltipPortalProps["container"]): Element | null | undefined {
  if (container === undefined) return document.body;
  return typeof container === "function" ? container() : container;
}

/**
 * Renders the content into `document.body` (or `container`) while the tooltip is open, and keeps it
 * there until its exit animation has finished. On the server the portal renders nothing where it
 * stands: put `Tooltip.Content` directly inside `Tooltip` when it has to be part of the server markup.
 * It sets no ARIA attributes and takes no keys.
 *
 * @param props See {@link TooltipPortalProps}.
 * @returns The portal while the tooltip is open, held, or force-mounted; otherwise nothing.
 * @throws Error when rendered outside {@link TooltipRoot}: `[primitives] <Tooltip.Portal> must be used within <Tooltip>.`
 * @example
 * import { Tooltip } from "@shadow-js/primitives";
 *
 * export function PortaledTip() {
 *   return (
 *     <Tooltip>
 *       <Tooltip.Trigger>Help</Tooltip.Trigger>
 *       <Tooltip.Portal>
 *         <Tooltip.Content>Helpful text</Tooltip.Content>
 *       </Tooltip.Portal>
 *     </Tooltip>
 *   );
 * }
 * @see {@link TooltipContent}
 * @see {@link TooltipPortalProps}
 * @since 1.0.0
 */
export function TooltipPortal(props: TooltipPortalProps): JsxChild {
  const context = tooltipContext.use("Tooltip.Portal");
  return (
    <Show when={context.open() || context.held() || props.forceMount === true}>
      <Portal mount={() => resolveContainer(props.container)}>{props.children}</Portal>
    </Show>
  );
}
