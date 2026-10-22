import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperProvider } from "../popper/index";
import { createTooltipContext, type TooltipProps, tooltipContext } from "./context";

/**
 * Root of a tooltip: holds the open state and provides it to the parts. It renders no element of its
 * own.
 *
 * Keyboard and ARIA: the tooltip opens when its trigger receives focus (not from a press), at once,
 * or when the mouse rests on the trigger for the delay; touch never opens it. Escape, blur, a press,
 * a click, a press outside, and leaving the trigger (unless the pointer travels toward the content)
 * close it. While open, the trigger carries `aria-describedby`. Wrap the application in
 * `Tooltip.Provider` to share the delay and the skip window between tooltips; without one each
 * tooltip uses the defaults on its own.
 *
 * @param props See {@link TooltipProps}.
 * @returns The tooltip state provider with the children inside it.
 * @example
 * import { Tooltip } from "@shadow-js/primitives";
 *
 * export function SaveTip() {
 *   return (
 *     <Tooltip>
 *       <Tooltip.Trigger>Save</Tooltip.Trigger>
 *       <Tooltip.Portal>
 *         <Tooltip.Content sideOffset={4}>Save the document</Tooltip.Content>
 *       </Tooltip.Portal>
 *     </Tooltip>
 *   );
 * }
 * @see {@link Tooltip}
 * @see {@link TooltipProps}
 * @since 1.0.0
 */
export function TooltipRoot(props: TooltipProps): JsxChild {
  const context = createTooltipContext(props);
  return (
    <tooltipContext.Provider value={context}>
      <PopperProvider anchor={context.trigger} setAnchor={() => undefined}>
        {props.children}
      </PopperProvider>
    </tooltipContext.Provider>
  );
}
