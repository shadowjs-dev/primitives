import { untrack } from "@shadow-js/core";
import { createComputation, readComputation } from "@shadow-js/core/extend";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";

/**
 * Renders `render()` while `mounted()` is true: `Show` for floating content. `Show` builds its
 * branch in a memo that forbids signal writes, but `PopperContent` registers its wrapper element
 * with a signal write from a template `ref`, which runs while the branch is being built
 * (`WRITE_IN_MEMO`). This is the same one-branch memo with writes allowed; it computes at
 * creation, so contexts resolve on the server too.
 *
 * @param mounted Whether the content is in the DOM. Tracked.
 * @param render Builds the content. Untracked.
 * @returns An accessor child.
 * @internal
 */
export function whileMounted(mounted: () => boolean, render: () => JsxChild): JsxChild {
  const node = createComputation({
    kind: "memo",
    allowWrites: true,
    name: "select content",
    fn: () => (mounted() ? untrack(render) : null),
  });
  return () => readComputation<JsxChild>(node);
}
