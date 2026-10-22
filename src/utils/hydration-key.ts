/**
 * The key of the current hydration position, or `undefined` outside a server render and a
 * hydration pass. Client and server builds differ: the server build swaps this module for
 * `hydration-key-server.ts` (see `tsdown.config.mjs`) because the server runtime keeps its own
 * copy of the hydration scope.
 * @packageDocumentation
 */
import { nextKey } from "@shadow-js/web/extend";

/**
 * Takes the next hydration key of the current scope. Internal: `ids.ts` calls it, and no barrel
 * re-exports it.
 *
 * @returns The key (for example `"0-0-3"`), or `undefined` when no scope is active.
 * @since 1.0.0
 * @internal
 */
export function takeHydrationKey(): string | undefined {
  return nextKey();
}
