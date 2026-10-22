import { onCleanup, splitProps, useEffect } from "@shadow-js/core";
import { Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { dialogContext } from "./context";

/**
 * Props of {@link DialogOverlay}. Accessibility: the overlay carries `aria-hidden="true"` and no
 * role or keys, so assistive technology skips it. Data attributes: `data-state` (`"open"` or
 * `"closed"`).
 * @see {@link DialogOverlay}
 * @since 1.0.0
 */
export type DialogOverlayProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  {
    /** Keep the overlay mounted while closed (for animation libraries). @default false */
    readonly forceMount?: boolean | undefined;
  },
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The layer that covers the page behind a modal dialog. Renders nothing for non-modal dialogs.
 * Style it with `data-state="open" | "closed"`; it stays mounted until its exit animation ends. A
 * press on it dismisses a modal dialog (it keeps pointer events while the page behind it is blocked).
 * Accessibility: `aria-hidden="true"`, no keys.
 *
 * @param props See {@link DialogOverlayProps}.
 * @returns The rendered overlay, or nothing while it is unmounted.
 * @see {@link Dialog}
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function CoveredDialog() {
 *   return (
 *     <Dialog>
 *       <Dialog.Trigger>Open</Dialog.Trigger>
 *       <Dialog.Portal>
 *         <Dialog.Overlay class="fixed inset-0 bg-black/50" />
 *         <Dialog.Content>
 *           <Dialog.Title>Hello</Dialog.Title>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @since 1.0.0
 */
export function DialogOverlay<T extends PolymorphicTarget = "div">(
  props: DialogOverlayProps<T>,
): JsxChild {
  const context = dialogContext.use("Dialog.Overlay");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "forceMount"]);
  const presence = usePresence(
    () => context.modal() && (context.open() || own.forceMount === true),
  );
  useEffect(() => {
    if (!presence.mounted()) return;
    onCleanup(context.hold());
  });
  const merged = mergeElementProps(
    {
      "aria-hidden": "true",
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      // The overlay must still receive the press that dismisses the dialog while the page behind it is blocked.
      style: { "pointer-events": "auto" },
    },
    rest,
    { ref: composeRefs<HTMLElement>(presence.ref) },
  );
  return (
    <Show when={presence.mounted()}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </Show>
  );
}
