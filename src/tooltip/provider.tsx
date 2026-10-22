import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { createTooltipGroup, type TooltipProviderProps, tooltipGroupContext } from "./context";

/**
 * Shares the delay settings between the tooltips below it, and the skip window: once one tooltip
 * closes, the next trigger opens its tooltip without the delay if it is entered within
 * `skipDelayDuration`. It renders no element and sets no ARIA attributes or keys; put it near the root
 * of the application.
 *
 * @param props See {@link TooltipProviderProps}.
 * @returns The provider with the children inside it.
 * @example
 * import { Tooltip } from "@shadow-js/primitives";
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 *
 * export function App(): JsxChild {
 *   return (
 *     <Tooltip.Provider delayDuration={400}>
 *       <main>Application</main>
 *     </Tooltip.Provider>
 *   );
 * }
 * @see {@link TooltipProviderProps}
 * @see {@link TooltipRoot}
 * @since 1.0.0
 */
export function TooltipProvider(props: TooltipProviderProps): JsxChild {
  const group = createTooltipGroup(props);
  return (
    <tooltipGroupContext.Provider value={group}>{props.children}</tooltipGroupContext.Provider>
  );
}
