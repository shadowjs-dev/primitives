import { PopoverContent } from "./content";
import {
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverDescription,
  PopoverTitle,
} from "./parts";
import { PopoverPortal } from "./portal";
import { PopoverRoot } from "./root";
import { PopoverTrigger } from "./trigger";

export type { PopoverContentOwnProps, PopoverContentProps } from "./content";
export type { PopoverContextValue, PopoverProps } from "./context";
export { createPopoverContext, popoverContext } from "./context";
export type {
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverCloseProps,
  PopoverDescriptionProps,
  PopoverTitleProps,
} from "./parts";
export type { PopoverPortalProps } from "./portal";
export type { PopoverTriggerProps } from "./trigger";
export {
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverPortal,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
};

/**
 * The popover primitive: `Popover`, `Popover.Trigger`, `Popover.Anchor`, `Popover.Portal`,
 * `Popover.Content`, `Popover.Arrow`, `Popover.Title`, `Popover.Description` and
 * `Popover.Close`. Each part is also exported by name (`PopoverTrigger`, ...) for tree shaking.
 * Keys: Enter or Space on the trigger toggles; Escape closes and returns focus to the trigger; Tab
 * leaves a non-modal popover toward what follows the trigger. ARIA: the trigger has `aria-haspopup`
 * `"dialog"`, `aria-expanded` and `aria-controls` while open; the content is a `role="dialog"`
 * labeled by the title and described by the description.
 *
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function DetailsPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger>Open</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content aria-label="Details" sideOffset={6}>
 *           Hello
 *           <Popover.Arrow />
 *         </Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverRoot}
 */
export const Popover: typeof PopoverRoot & {
  readonly Trigger: typeof PopoverTrigger;
  readonly Anchor: typeof PopoverAnchor;
  readonly Portal: typeof PopoverPortal;
  readonly Content: typeof PopoverContent;
  readonly Arrow: typeof PopoverArrow;
  readonly Title: typeof PopoverTitle;
  readonly Description: typeof PopoverDescription;
  readonly Close: typeof PopoverClose;
} = Object.assign((props: Parameters<typeof PopoverRoot>[0]) => PopoverRoot(props), {
  Trigger: PopoverTrigger,
  Anchor: PopoverAnchor,
  Portal: PopoverPortal,
  Content: PopoverContent,
  Arrow: PopoverArrow,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: PopoverClose,
});
