/**
 * Server build of `hydration-key.ts`: the server runtime owns the scope, so the key is read from
 * the attribute helper it exports.
 * @packageDocumentation
 */
import { ssrHydrationKey } from "@shadow-js/web/server";

/**
 * Takes the next hydration key of the current server render. Internal: the server build of
 * `takeHydrationKey` (see `hydration-key.ts`); no barrel re-exports it.
 *
 * @returns The key (for example `"0-0-3"`), or `undefined` outside a server render.
 * @since 1.0.0
 * @internal
 */
export function takeHydrationKey(): string | undefined {
  const attribute = ssrHydrationKey();
  const match = /data-hk="([^"]*)"/.exec(attribute);
  return match?.[1];
}
