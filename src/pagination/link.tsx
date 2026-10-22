import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicTarget,
} from "../utils/index";
import { paginationContext } from "./context";

/** What {@link PageLink} needs to behave like a page control. @internal */
export interface PageLinkProps {
  /** The page this control goes to. */
  readonly target: () => number;
  /** Whether this control stands for the current page. */
  readonly current: () => boolean;
  /** Whether activating it does nothing (root disabled, or no page in that direction). */
  readonly disabled: () => boolean;
  /** Its accessible name. */
  readonly label: () => string | undefined;
  /** The `rel` of a link: `"prev"` / `"next"`. */
  readonly rel?: string | undefined;
  /** The element the application asked for, if any. */
  readonly as: PolymorphicTarget | undefined;
  /** The application's click handler; it may `preventDefault()` to veto the page change. */
  readonly onClick: unknown;
  /** Everything else the application passed. */
  readonly rest: object;
  readonly children?: JsxChild | undefined;
}

/**
 * The interactive element of an item, `Previous` or `Next`: an `a` when the root has `getHref`,
 * a `button` otherwise. A disabled one stays in the DOM and in the tab order of buttons
 * (`aria-disabled`), because removing it would make the bar jump; a disabled link additionally
 * loses its `href` and gets `role="link"` so it is still announced as a (dimmed) link. Data attributes: `data-state` is `"active"` for the
 * current page and `"inactive"` otherwise, and `data-disabled` (value `""`) is present while disabled.
 * @internal
 */
export function PageLink(link: PageLinkProps): JsxChild {
  const context = paginationContext.use("Pagination");
  const tag = (): PolymorphicTarget => link.as ?? (context.hasHref() ? "a" : "button");
  const isAnchor = (): boolean => tag() === "a";
  const merged = mergeElementProps(
    {
      get type() {
        return tag() === "button" ? "button" : undefined;
      },
      get href() {
        return isAnchor() && !link.disabled() ? context.getHref(link.target()) : undefined;
      },
      get role() {
        return isAnchor() && link.disabled() ? "link" : undefined;
      },
      get rel() {
        return isAnchor() && !link.disabled() ? link.rel : undefined;
      },
      get "aria-current"() {
        return link.current() ? "page" : undefined;
      },
      get "aria-label"() {
        return link.label();
      },
      get "aria-disabled"() {
        return link.disabled() ? "true" : undefined;
      },
      get "data-disabled"() {
        return link.disabled() ? "" : undefined;
      },
      get "data-state"() {
        return link.current() ? "active" : "inactive";
      },
    },
    link.rest,
    {
      onClick: composeEventHandlers(
        () => link.onClick,
        (event: MouseEvent) => {
          if (link.disabled()) {
            event.preventDefault();
            return;
          }
          // Let the browser open the page in a new tab or window: that is not a page change here.
          if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }
          context.setPage(link.target());
        },
      ),
    },
  );
  return (
    <Polymorphic as={tag()} {...merged}>
      {link.children}
    </Polymorphic>
  );
}
