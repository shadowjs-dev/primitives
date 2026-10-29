/** `Node.DOCUMENT_POSITION_FOLLOWING`, spelled out so this module needs no DOM global to load. */
const FOLLOWING = 4;
/** `Node.DOCUMENT_POSITION_DISCONNECTED`. */
const DISCONNECTED = 1;

/**
 * Puts records in the order their elements have in the document. Records register in the order
 * their components are created, which is the page order on the first render but not for a question
 * or a choice that appears later between two others (a branch of the form, a refreshed list).
 * Records whose element does not exist yet keep their registration order after the placed ones,
 * and the sort is stable, so records that cannot be compared never swap.
 *
 * @param records The records in registration order.
 * @param elementOf The element a record renders, or `undefined` before it is created.
 * @returns A new list in document order.
 * @internal
 * @since 1.0.0
 */
export function inDocumentOrder<T>(
  records: readonly T[],
  elementOf: (record: T) => Element | undefined,
): T[] {
  const placed: { readonly record: T; readonly element: Element }[] = [];
  const unplaced: T[] = [];
  for (const record of records) {
    const element = elementOf(record);
    if (element === undefined) unplaced.push(record);
    else placed.push({ record, element });
  }
  placed.sort((a, b) => {
    if (a.element === b.element) return 0;
    const position = a.element.compareDocumentPosition(b.element);
    if ((position & DISCONNECTED) !== 0) return 0;
    return (position & FOLLOWING) !== 0 ? -1 : 1;
  });
  return [...placed.map((entry) => entry.record), ...unplaced];
}
