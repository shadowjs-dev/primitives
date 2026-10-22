import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperArrow, type PopperArrowProps } from "../popper/index";
import { hoverCardContext } from "./context";

/**
 * Props of {@link HoverCardArrow}: the props of `PopperArrow`. Accessibility: the arrow is
 * decorative and `aria-hidden`. Data attributes: none.
 * @since 1.0.0
 * @see {@link HoverCardArrow}
 */
export type HoverCardArrowProps = PopperArrowProps;

/**
 * An arrow pointing at the trigger. Renders a positioned `span` holding an `svg` triangle (see
 * `PopperArrow`); style the triangle with `fill`. Keyboard: none. ARIA: the `svg` is `aria-hidden="true"`, so the
 * arrow is ignored by assistive technology.
 *
 * @param props See {@link HoverCardArrowProps}.
 * @returns The arrow element.
 * @example
 * import { HoverCard } from "@shadow-js/primitives";
 *
 * export function ArrowedCard() {
 *   return (
 *     <HoverCard>
 *       <HoverCard.Trigger href="/users/ada">@ada</HoverCard.Trigger>
 *       <HoverCard.Portal>
 *         <HoverCard.Content>
 *           Ada Lovelace, mathematician.
 *           <HoverCard.Arrow class="fill-white" width={12} height={6} />
 *         </HoverCard.Content>
 *       </HoverCard.Portal>
 *     </HoverCard>
 *   );
 * }
 * @since 1.0.0
 * @see {@link HoverCardContent}
 */
export function HoverCardArrow(props: HoverCardArrowProps): JsxChild {
  hoverCardContext.use("HoverCard.Arrow");
  return <PopperArrow {...props} />;
}
