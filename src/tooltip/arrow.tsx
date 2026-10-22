import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperArrow, type PopperArrowProps } from "../popper/index";
import { hiddenContentContext } from "./content";
import { tooltipContext } from "./context";

/**
 * Props of {@link TooltipArrow}: the props of `PopperArrow`. Style the arrow with `fill` and size it
 * with `width` and `height`.
 * @since 1.0.0
 * @see {@link TooltipArrow}
 */
export type TooltipArrowProps = PopperArrowProps;

/**
 * An arrow pointing at the trigger. It renders an `svg` (see `PopperArrow`) and is styled with
 * `fill`. The content is also rendered into a visually hidden copy for assistive technology, where
 * an arrow would be noise, so there the arrow renders nothing. It sets no ARIA attributes and takes
 * no keys.
 *
 * @param props See {@link TooltipArrowProps}.
 * @returns The `svg` element, or nothing inside the visually hidden copy.
 * @throws Error when rendered outside {@link TooltipRoot}: `[primitives] <Tooltip.Arrow> must be used within <Tooltip>.`
 * @example
 * import { Tooltip } from "@shadow-js/primitives";
 *
 * export function ArrowTip() {
 *   return (
 *     <Tooltip>
 *       <Tooltip.Trigger>Info</Tooltip.Trigger>
 *       <Tooltip.Portal>
 *         <Tooltip.Content>
 *           Details
 *           <Tooltip.Arrow class="fill-black" width={10} height={5} />
 *         </Tooltip.Content>
 *       </Tooltip.Portal>
 *     </Tooltip>
 *   );
 * }
 * @see {@link TooltipArrowProps}
 * @see {@link TooltipContent}
 * @since 1.0.0
 */
export function TooltipArrow(props: TooltipArrowProps): JsxChild {
  tooltipContext.use("Tooltip.Arrow");
  if (hiddenContentContext.useOptional() === true) return null;
  return <PopperArrow {...props} />;
}
