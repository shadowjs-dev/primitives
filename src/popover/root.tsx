import { useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { type PopperAnchorTarget, PopperProvider } from "../popper/index";
import { createPopoverContext, type PopoverProps, popoverContext } from "./context";

/**
 * Root of a popover: holds the open state and the anchor, and provides them to the parts. It
 * renders no element. Controlled with `open` / `onOpenChange`, or uncontrolled with `defaultOpen`.
 *
 * Follows the WAI-ARIA dialog pattern in its non-modal form: focus moves into the popover on open,
 * Escape and a press outside close it, and focus returns to the trigger on close unless the
 * user moved on to something else. Keys: Enter or Space on the trigger toggles it; Tab leaves the
 * popover toward the next control after the trigger. Pass `modal` for the modal behavior of `Dialog`.
 *
 * @param props See {@link PopoverProps}.
 * @returns The provider around the children; no element of its own.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function DimensionsPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger>Dimensions</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content aria-label="Dimensions" sideOffset={4}>
 *           <Popover.Close>Done</Popover.Close>
 *           <Popover.Arrow />
 *         </Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverProps}
 */
export function PopoverRoot(props: PopoverProps): JsxChild {
  const context = createPopoverContext(props, () => props.modal === true);
  // A custom `Popover.Anchor` wins; without one the trigger is the anchor.
  const [custom, setCustom] = useSignal<PopperAnchorTarget | undefined>(undefined);
  return (
    <popoverContext.Provider value={context}>
      <PopperProvider
        anchor={() => custom() ?? context.trigger()}
        setAnchor={(anchor) => setCustom(() => anchor)}
      >
        {props.children}
      </PopperProvider>
    </popoverContext.Provider>
  );
}
