import { Portal, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { hoverCardContext } from "./context";

/**
 * Props of {@link HoverCardPortal}.
 *
 * Accessibility: the portal adds no ARIA attributes and no keyboard handling; the card keeps the
 * behavior of `HoverCard.Content` wherever it renders. Data attributes: none of its own.
 * @since 1.0.0
 * @see {@link HoverCardPortal}
 */
export interface HoverCardPortalProps {
  /** Where to render the hover card. @default `document.body` */
  readonly container?: Element | null | (() => Element | null | undefined);
  /** Keep the content mounted while closed (for animation libraries that control mounting). @default `false` */
  readonly forceMount?: boolean | undefined;
  /** The `HoverCard.Content` to render. @default none */
  readonly children?: JsxChild | undefined;
}

/** The element to render into: the application's container, or the body. */
function resolveContainer(
  container: HoverCardPortalProps["container"],
): Element | null | undefined {
  if (container === undefined) return document.body;
  return typeof container === "function" ? container() : container;
}

/**
 * Renders the content into `document.body` (or `container`) while the hover card is open, and keeps
 * it there until its exit animation has finished. Renders nothing on the server: put
 * `HoverCard.Content` directly inside `HoverCard` when it has to be part of the server markup. Keyboard: the portal handles no keys. ARIA: it sets no role or ARIA attribute of its
 * own; the card keeps the behavior of `HoverCard.Content`.
 *
 * @param props See {@link HoverCardPortalProps}.
 * @returns A portal of the children while the card is open, otherwise nothing.
 * @example
 * import { HoverCard } from "@shadow-js/primitives";
 *
 * export function AuthorLink() {
 *   return (
 *     <HoverCard>
 *       <HoverCard.Trigger href="/users/ada">@ada</HoverCard.Trigger>
 *       <HoverCard.Portal>
 *         <HoverCard.Content>Ada Lovelace, mathematician.</HoverCard.Content>
 *       </HoverCard.Portal>
 *     </HoverCard>
 *   );
 * }
 * @since 1.0.0
 * @see {@link HoverCardContent}
 */
export function HoverCardPortal(props: HoverCardPortalProps): JsxChild {
  const context = hoverCardContext.use("HoverCard.Portal");
  return (
    <Show when={context.open() || context.held() || props.forceMount === true}>
      <Portal mount={() => resolveContainer(props.container)}>{props.children}</Portal>
    </Show>
  );
}
