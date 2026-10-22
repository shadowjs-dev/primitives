import { TooltipArrow } from "./arrow";
import { TooltipContent } from "./content";
import { TooltipPortal } from "./portal";
import { TooltipProvider } from "./provider";
import { TooltipRoot } from "./root";
import { TooltipTrigger } from "./trigger";

export type { TooltipArrowProps } from "./arrow";
export type { TooltipContentOwnProps, TooltipContentProps } from "./content";
export type {
  TooltipContextValue,
  TooltipGroup,
  TooltipProps,
  TooltipProviderProps,
} from "./context";
export {
  createTooltipContext,
  createTooltipGroup,
  DEFAULT_DELAY_DURATION,
  DEFAULT_SKIP_DELAY_DURATION,
  tooltipContext,
  tooltipGroupContext,
} from "./context";
export type { GracePoint, GraceRect, GraceSide } from "./grace-area";
export {
  createGraceArea,
  getExitSide,
  getHull,
  getPaddedExitPoints,
  getRectCorners,
  isPointInPolygon,
} from "./grace-area";
export type { TooltipPortalProps } from "./portal";
export type { TooltipTriggerProps } from "./trigger";
export {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
};

/**
 * The tooltip primitive: `Tooltip`, `Tooltip.Provider`, `Tooltip.Trigger`, `Tooltip.Portal`,
 * `Tooltip.Content` and `Tooltip.Arrow`. Each part is also exported by name (`TooltipTrigger`, ...)
 * for tree shaking.
 *
 * Keyboard and ARIA: the trigger opens the tooltip on focus or after the mouse rests on it, and the
 * content is announced through `role="tooltip"` that the trigger's `aria-describedby` names. Escape
 * closes it. See {@link TooltipRoot} for the details.
 *
 * @example
 * import { Tooltip } from "@shadow-js/primitives";
 *
 * export function HoverHint() {
 *   return (
 *     <Tooltip.Provider>
 *       <Tooltip>
 *         <Tooltip.Trigger>Hover me</Tooltip.Trigger>
 *         <Tooltip.Portal>
 *           <Tooltip.Content sideOffset={4}>
 *             Added to your library
 *             <Tooltip.Arrow />
 *           </Tooltip.Content>
 *         </Tooltip.Portal>
 *       </Tooltip>
 *     </Tooltip.Provider>
 *   );
 * }
 * @see {@link TooltipRoot}
 * @see {@link TooltipProvider}
 * @since 1.0.0
 */
export const Tooltip: typeof TooltipRoot & {
  readonly Provider: typeof TooltipProvider;
  readonly Trigger: typeof TooltipTrigger;
  readonly Portal: typeof TooltipPortal;
  readonly Content: typeof TooltipContent;
  readonly Arrow: typeof TooltipArrow;
} = Object.assign((props: Parameters<typeof TooltipRoot>[0]) => TooltipRoot(props), {
  Provider: TooltipProvider,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Content: TooltipContent,
  Arrow: TooltipArrow,
});
