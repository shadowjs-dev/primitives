/**
 * Ids for the tabs and panels of a `Tabs`, and the registry that lets an application `id` on a tab
 * or a panel be honored by the `aria-*` references that point at it.
 * @packageDocumentation
 */
import { useSignal } from "@shadow-js/core";
import { partId } from "../utils/index";
import { encodeTabValue } from "./encode";

/** The default id of the tab for `value`. @internal */
export function tabTriggerId(base: string, value: string): string {
  return partId(base, `trigger-${encodeTabValue(value)}`);
}

/** The default id of the panel for `value`. @internal */
export function tabContentId(base: string, value: string): string {
  return partId(base, `content-${encodeTabValue(value)}`);
}

/**
 * The ids the mounted parts really use, keyed by tab value. A part registers its id after mount,
 * so an application `id` on a tab or a panel is honored by the `aria-*` references that point at it.
 * @internal
 */
export interface IdRegistry {
  /** The registered id for `value`, or undefined. Tracked. */
  get(value: string): string | undefined;
  /** Registers `id` for `value`; returns the function that removes it. */
  register(value: string, id: string): () => void;
}

/** Creates an empty {@link IdRegistry}. @internal */
export function createIdRegistry(): IdRegistry {
  const [ids, setIds] = useSignal<ReadonlyMap<string, string>>(new Map());
  return {
    get: (value) => ids().get(value),
    register(value, id) {
      setIds((previous) => new Map(previous).set(value, id));
      return () => {
        setIds((previous) => {
          if (previous.get(value) !== id) return previous;
          const next = new Map(previous);
          next.delete(value);
          return next;
        });
      };
    },
  };
}
