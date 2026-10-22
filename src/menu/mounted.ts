import { untrack } from "@shadow-js/core";
import { createComputation, readComputation } from "@shadow-js/core/extend";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";

/**
 * Renders `render()` while `mounted()` is true: `Show` for floating content. `Show` builds its
 * branch in a memo that forbids signal writes, but `PopperContent` registers its wrapper and
 * arrow elements with a signal write from a template `ref`, which runs while the branch is being
 * built (`WRITE_IN_MEMO`). This is the same one-branch memo with writes allowed, which is what
 * a part that sets up refs needs; it computes at creation, so contexts resolve on the server too.
 *
 * @param mounted Whether the content is in the DOM. Tracked.
 * @param render Builds the content. Untracked.
 * @returns An accessor child.
 * @internal
 * @since 1.0.0
 * @see {@link MenuContent}
 */
export function whileMounted(mounted: () => boolean, render: () => JsxChild): JsxChild {
  const node = createComputation({
    kind: "memo",
    allowWrites: true,
    name: "menu content",
    fn: () => (mounted() ? untrack(render) : null),
  });
  return () => readComputation<JsxChild>(node);
}
