/**
 * A signal for "the element this part rendered". A `ref` callback of a plain template element runs
 * while the surrounding branch (`Show`, a context provider, `Polymorphic`) is being computed, and a
 * normal signal write there throws `WRITE_IN_MEMO`. This signal is bookkeeping owned by the part,
 * which is exactly what the engine's `allowInMemo` write option is for.
 * @packageDocumentation
 */
import type { Accessor } from "@shadow-js/core";
import { createSignalNode, readSignal, writeSignal } from "@shadow-js/core/extend";

/**
 * Creates a reactive holder for an element (or any value) that may be set from a `ref` callback. It
 * starts as `undefined`, holds the last value written, and is read tracked. It sets no ARIA
 * attributes and handles no keys.
 *
 * @returns `[read, write]`; `write` is safe to call from a `ref`, even while a branch is computing.
 * @example
 * import { useRefSignal } from "@shadow-js/primitives";
 *
 * export function Measured() {
 *   const [node, setNode] = useRefSignal<HTMLElement>();
 *   return (
 *     <div ref={(element: HTMLElement) => setNode(element)}>
 *       {node() === undefined ? "Not mounted" : "Mounted"}
 *     </div>
 *   );
 * }
 * @see {@link useFocusScope}
 * @see {@link DismissableLayer}
 * @since 1.0.0
 */
export function useRefSignal<T>(): readonly [
  Accessor<T | undefined>,
  (value: T | undefined) => void,
] {
  const node = createSignalNode<T | undefined>(undefined, Object.is);
  return [
    () => readSignal(node),
    (value) => {
      writeSignal(node, value, { allowInMemo: true });
    },
  ];
}
