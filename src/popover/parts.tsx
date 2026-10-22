import { onCleanup, splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  PopperAnchor,
  type PopperAnchorProps,
  type PopperAnchorTarget,
  PopperArrow,
  type PopperArrowProps,
  usePopperContext,
} from "../popper/index";
import {
  composeEventHandlers,
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  type RefCallback,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { popoverContext } from "./context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link PopoverAnchor}: the attributes of the element, plus `virtualRef`.
 * @since 1.0.0
 * @see {@link PopoverAnchor}
 */
export type PopoverAnchorProps<T extends PolymorphicTarget = "div"> = PopperAnchorProps<T>;

/**
 * Props of {@link PopoverArrow}: the attributes of the arrow `svg`.
 * @since 1.0.0
 * @see {@link PopoverArrow}
 */
export type PopoverArrowProps = PopperArrowProps;

/**
 * Props of {@link PopoverTitle}: the attributes of the `h2`.
 * @since 1.0.0
 * @see {@link PopoverTitle}
 */
export type PopoverTitleProps<T extends PolymorphicTarget = "h2"> = PolymorphicProps<
  "h2",
  object,
  T
>;

/**
 * Props of {@link PopoverDescription}: the attributes of the `p`.
 * @since 1.0.0
 * @see {@link PopoverDescription}
 */
export type PopoverDescriptionProps<T extends PolymorphicTarget = "p"> = PolymorphicProps<
  "p",
  object,
  T
>;

/**
 * Props of {@link PopoverClose}: the attributes of the `button`.
 * @since 1.0.0
 * @see {@link PopoverClose}
 */
export type PopoverCloseProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/**
 * An element to anchor the popover to instead of the trigger. Renders a `div` unless `as` says
 * otherwise; with `virtualRef` it renders nothing and anchors to the virtual element. When it
 * unmounts, the popover falls back to the trigger. Must be rendered inside {@link PopoverRoot}.
 *
 * @param props See {@link PopoverAnchorProps}.
 * @returns The anchor element, or nothing when `virtualRef` is given.
 * @throws Error when rendered outside {@link PopoverRoot}.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function ToolbarPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Anchor class="toolbar">
 *         <Popover.Trigger>Tools</Popover.Trigger>
 *       </Popover.Anchor>
 *       <Popover.Portal>
 *         <Popover.Content aria-label="Tools">Tool list</Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverTrigger}
 */
export function PopoverAnchor<T extends PolymorphicTarget = "div">(
  props: PopoverAnchorProps<T>,
): JsxChild {
  popoverContext.use("Popover.Anchor");
  const popper = usePopperContext();
  const loose = partProps<Loose & { readonly virtualRef?: PopperAnchorTarget }>(props);
  let element: PopperAnchorTarget | undefined;
  // Without this the popover would stay attached to an anchor that is gone instead of falling back
  // to the trigger.
  onCleanup(() => {
    const mine = loose.virtualRef ?? element;
    if (mine !== undefined && untrack(popper.anchor) === mine) popper.setAnchor(undefined);
  });
  return (
    <PopperAnchor
      {...loose}
      ref={composeRefs<HTMLElement>(loose["ref"] as RefCallback<HTMLElement>, (target) => {
        element = target;
      })}
    />
  );
}

/**
 * An arrow pointing at the anchor; renders an `svg` (see `PopperArrow`). Style it with `fill`.
 * Must be rendered inside {@link PopoverRoot}.
 *
 * @param props See {@link PopoverArrowProps}.
 * @returns The arrow `svg` element.
 * @throws Error when rendered outside {@link PopoverRoot}.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function ArrowedPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger>Info</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content aria-label="Info">
 *           Details
 *           <Popover.Arrow class="fill-white" width={12} height={6} />
 *         </Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverContent}
 */
export function PopoverArrow(props: PopoverArrowProps): JsxChild {
  popoverContext.use("Popover.Arrow");
  return <PopperArrow {...props} />;
}

/**
 * The accessible name of the popover. Renders an `h2` with the title's id; while it is mounted the
 * content's `aria-labelledby` points at it. Must be rendered inside {@link PopoverRoot}.
 *
 * @param props See {@link PopoverTitleProps}.
 * @returns The `h2` element.
 * @throws Error when rendered outside {@link PopoverRoot}.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function TitledPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger>Dimensions</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content>
 *           <Popover.Title>Dimensions</Popover.Title>
 *         </Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverDescription}
 */
export function PopoverTitle<T extends PolymorphicTarget = "h2">(
  props: PopoverTitleProps<T>,
): JsxChild {
  const context = popoverContext.use("Popover.Title");
  context.title.register();
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get id() {
        return context.titleId();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "h2"} {...merged} />;
}

/**
 * The accessible description of the popover. Renders a `p` with the description's id; while it is
 * mounted the content's `aria-describedby` points at it. Must be rendered inside {@link PopoverRoot}.
 *
 * @param props See {@link PopoverDescriptionProps}.
 * @returns The `p` element.
 * @throws Error when rendered outside {@link PopoverRoot}.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function DescribedPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger>Layer size</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content>
 *           <Popover.Description>Set the width and height of the layer.</Popover.Description>
 *         </Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverTitle}
 */
export function PopoverDescription<T extends PolymorphicTarget = "p">(
  props: PopoverDescriptionProps<T>,
): JsxChild {
  const context = popoverContext.use("Popover.Description");
  context.description.register();
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get id() {
        return context.descriptionId();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "p"} {...merged} />;
}

/**
 * A button that closes the popover. It is `type="button"`, so it never submits a form. Keys: Enter or
 * Space (a click) closes. An `onClick` that calls `preventDefault()` vetoes the close. Focus returns
 * to the trigger as the popover closes. Must be rendered inside {@link PopoverRoot}.
 *
 * @param props See {@link PopoverCloseProps}.
 * @returns The `button` element.
 * @throws Error when rendered outside {@link PopoverRoot}.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function ClosableNote() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger>Note</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content aria-label="Note">
 *           <Popover.Close aria-label="Close note">x</Popover.Close>
 *         </Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverRoot}
 */
export function PopoverClose<T extends PolymorphicTarget = "button">(
  props: PopoverCloseProps<T>,
): JsxChild {
  const context = popoverContext.use("Popover.Close");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const merged = mergeElementProps({ type: "button" }, rest, {
    onClick: composeEventHandlers(
      () => own.onClick,
      () => context.setOpen(false),
    ),
  });
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
