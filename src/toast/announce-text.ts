/** Marks an element whose own text is not announced (an action button, a close button). @internal */
export const ANNOUNCE_EXCLUDE_ATTRIBUTE = "data-toast-announce-exclude";
/** The text announced in place of an excluded element's content. @internal */
export const ANNOUNCE_ALT_ATTRIBUTE = "data-toast-announce-alt";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/** Whether an element is hidden from assistive technology and so must not be announced. */
function isHidden(element: Element): boolean {
  if (element.getAttribute("aria-hidden") === "true" || element.hasAttribute("hidden")) return true;
  return (element as HTMLElement).style?.display === "none";
}

/**
 * The text a screen reader should be told when a toast appears: the visible text of the toast in
 * reading order, except that an element marked with {@link ANNOUNCE_EXCLUDE_ATTRIBUTE} contributes
 * its {@link ANNOUNCE_ALT_ATTRIBUTE} instead of its content ("Undo" the button becomes "Undo the
 * deletion", which makes sense when read out of context). Hidden elements contribute nothing.
 *
 * The walk is iterative because the depth of a toast's content is the application's.
 *
 * @param root The toast element.
 * @returns The text to announce, parts separated by a space; `""` when there is none.
 * @internal
 */
export function getAnnounceText(root: Element): string {
  const parts: string[] = [];
  const stack: Node[] = Array.from(root.childNodes).reverse();
  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    if (node.nodeType === TEXT_NODE) {
      const text = (node.textContent ?? "").trim();
      if (text !== "") parts.push(text);
      continue;
    }
    if (node.nodeType !== ELEMENT_NODE) continue;
    const element = node as Element;
    if (isHidden(element)) continue;
    if (element.hasAttribute(ANNOUNCE_EXCLUDE_ATTRIBUTE)) {
      const alt = (element.getAttribute(ANNOUNCE_ALT_ATTRIBUTE) ?? "").trim();
      if (alt !== "") parts.push(alt);
      continue;
    }
    for (let index = element.childNodes.length - 1; index >= 0; index -= 1) {
      const child = element.childNodes[index];
      if (child !== undefined) stack.push(child);
    }
  }
  return parts.join(" ");
}
