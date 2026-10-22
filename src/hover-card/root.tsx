import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperProvider } from "../popper/index";
import { createHoverCardContext, type HoverCardProps, hoverCardContext } from "./context";

/**
 * Root of a hover card: a preview that appears when the pointer rests on a link (or the link gets
 * focus) and disappears when it leaves. It renders no element. The card is supplementary
 * content for sighted pointer users, not an interactive dialog: it is not announced, never
 * traps focus, and touch devices never open it. Anything in it must also be reachable from the
 * page the link leads to.
 *
 * Keyboard and ARIA: focus on the trigger opens the card and blur closes it, Tab from an open
 * trigger enters the card, Shift+Tab from its first control and Escape return focus to the
 * trigger. No ARIA role is set.
 *
 * @param props See {@link HoverCardProps}.
 * @returns The provider around the children; it renders no element of its own.
 * @example
 * import { HoverCard } from "@shadow-js/primitives";
 *
 * export function AuthorLink() {
 *   return (
 *     <HoverCard openDelay={400}>
 *       <HoverCard.Trigger href="/users/ada">@ada</HoverCard.Trigger>
 *       <HoverCard.Portal>
 *         <HoverCard.Content sideOffset={6}>Ada Lovelace, mathematician.</HoverCard.Content>
 *       </HoverCard.Portal>
 *     </HoverCard>
 *   );
 * }
 * @since 1.0.0
 * @see {@link HoverCardProps}
 */
export function HoverCardRoot(props: HoverCardProps): JsxChild {
  const context = createHoverCardContext(props);
  return (
    <hoverCardContext.Provider value={context}>
      <PopperProvider anchor={context.trigger} setAnchor={() => undefined}>
        {props.children}
      </PopperProvider>
    </hoverCardContext.Provider>
  );
}
