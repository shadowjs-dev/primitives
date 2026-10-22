/**
 * Ids that are identical on the server and the client, and the helper that wires a label or a
 * description to the element that uses it.
 * @packageDocumentation
 */
import { type Accessor, onMount, useId, useSignal } from "@shadow-js/core";
import { takeHydrationKey } from "./hydration-key";

/**
 * Creates the base id of a compound component. Call it once, in the root part: parts derive their
 * ids from it with {@link partId}. An application-provided `id` replaces the generated base. The
 * hook sets no ARIA attributes and handles no keys; the parts that use the ids do.
 *
 * While the server renders or the client hydrates, the id comes from the hydration scope (the
 * position of the component call, the same on both sides), so the markup the server sent and the
 * attributes the client expects agree. `useId` alone cannot promise that: it counts owners, and
 * the client creates more owners (one per reactive binding) than the server does. Outside a
 * server render or a hydration pass (an ordinary client render) it falls back to `useId`.
 *
 * @param override The application's `id` prop, if any.
 * @returns An accessor of the base id.
 * @example
 * import { partId, useBaseId } from "@shadow-js/primitives";
 *
 * export function Field(props: { id?: string }) {
 *   const base = useBaseId(() => props.id);
 *   return <div id={partId(base(), "field")}>Name</div>;
 * }
 * @see {@link partId}
 * @see {@link usePartRegistration}
 * @since 1.0.0
 */
export function useBaseId(override?: () => string | undefined): Accessor<string> {
  const key = takeHydrationKey();
  const generated = key !== undefined ? `p-${key}` : useId();
  return () => override?.() ?? generated;
}

/**
 * The id of one part of a compound component. It is a pure string function: it reads nothing and
 * throws nothing.
 *
 * @param base The base id from {@link useBaseId}.
 * @param part A short part name such as `"content"`.
 * @returns `${base}-${part}`.
 * @example
 * import { partId } from "@shadow-js/primitives";
 *
 * export function contentId(base: string): string {
 *   return partId(base, "content");
 * }
 * @see {@link useBaseId}
 * @since 1.0.0
 */
export function partId(base: string, part: string): string {
  return `${base}-${part}`;
}

/**
 * Tracks whether an optional part (a title, a description) is currently rendered, so the element
 * that references it only emits `aria-labelledby` / `aria-describedby` while the target exists.
 * Registration happens after mount, so the first render is identical on the server and the client.
 * The registration sets no ARIA attributes itself.
 * @see {@link usePartRegistration}
 * @since 1.0.0
 */
export interface PartRegistration {
  /** True while at least one registered part is mounted. Tracked. */
  readonly present: Accessor<boolean>;
  /**
   * Called by the optional part while it renders; the part counts as present after it mounts and
   * stops counting when it is disposed. Call it inside a component.
   */
  register(): void;
}

/**
 * Creates a {@link PartRegistration}. It sets no ARIA attributes and handles no keys; the root reads
 * `present` to decide whether to emit `aria-labelledby` or `aria-describedby`.
 *
 * @returns The registration to put in the root's context.
 * @example
 * import { type PartRegistration, partId, useBaseId, usePartRegistration } from "@shadow-js/primitives";
 *
 * export function Labeled(props: { title?: string }) {
 *   const base = useBaseId();
 *   const title = usePartRegistration();
 *   return (
 *     <section aria-labelledby={title.present() ? partId(base(), "title") : undefined}>
 *       {props.title !== undefined ? <TitlePart id={partId(base(), "title")} registration={title} /> : null}
 *     </section>
 *   );
 * }
 *
 * function TitlePart(props: { id: string; registration: PartRegistration }) {
 *   props.registration.register();
 *   return <h2 id={props.id}>Title</h2>;
 * }
 * @see {@link PartRegistration}
 * @see {@link useBaseId}
 * @since 1.0.0
 */
export function usePartRegistration(): PartRegistration {
  const [count, setCount] = useSignal(0);
  return {
    present: () => count() > 0,
    register() {
      onMount(() => {
        setCount((value) => value + 1);
        return () => {
          setCount((value) => value - 1);
        };
      });
    },
  };
}
