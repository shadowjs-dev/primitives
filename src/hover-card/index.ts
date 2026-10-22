import { HoverCardArrow } from "./arrow";
import { HoverCardContent } from "./content";
import { HoverCardPortal } from "./portal";
import { HoverCardRoot } from "./root";
import { HoverCardTrigger } from "./trigger";

export type { HoverCardArrowProps } from "./arrow";
export type { HoverCardContentOwnProps, HoverCardContentProps } from "./content";
export type { HoverCardContextValue, HoverCardProps } from "./context";
export {
  createHoverCardContext,
  DEFAULT_CLOSE_DELAY,
  DEFAULT_OPEN_DELAY,
  hoverCardContext,
} from "./context";
export type { HoverCardPortalProps } from "./portal";
export type { HoverCardTriggerProps } from "./trigger";
export { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger };

/**
 * The hover card primitive: `HoverCard`, `HoverCard.Trigger`, `HoverCard.Portal`,
 * `HoverCard.Content` and `HoverCard.Arrow`. Each part is also exported by name
 * (`HoverCardTrigger`, ...) for tree shaking.
 *
 * Keyboard and ARIA: focus on the trigger opens the card after `openDelay` and blur closes it after
 * `closeDelay`; Tab from an open trigger enters the card, Shift+Tab from its first control and
 * Escape return focus to the trigger. No ARIA role is set; the trigger is a plain `a` and the card
 * is not announced.
 *
 * @example
 * import { HoverCard } from "@shadow-js/primitives";
 *
 * export function AuthorLink() {
 *   return (
 *     <HoverCard>
 *       <HoverCard.Trigger href="/ada">@ada</HoverCard.Trigger>
 *       <HoverCard.Portal>
 *         <HoverCard.Content sideOffset={6}>
 *           Ada Lovelace
 *           <HoverCard.Arrow />
 *         </HoverCard.Content>
 *       </HoverCard.Portal>
 *     </HoverCard>
 *   );
 * }
 * @since 1.0.0
 * @see {@link HoverCardRoot}
 */
export const HoverCard: typeof HoverCardRoot & {
  readonly Trigger: typeof HoverCardTrigger;
  readonly Portal: typeof HoverCardPortal;
  readonly Content: typeof HoverCardContent;
  readonly Arrow: typeof HoverCardArrow;
} = Object.assign((props: Parameters<typeof HoverCardRoot>[0]) => HoverCardRoot(props), {
  Trigger: HoverCardTrigger,
  Portal: HoverCardPortal,
  Content: HoverCardContent,
  Arrow: HoverCardArrow,
});
