import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { dialogContext } from "./context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link DialogTitle}.
 * @see {@link DialogTitle}
 * @since 1.0.0
 */
export type DialogTitleProps<T extends PolymorphicTarget = "h2"> = PolymorphicProps<
  "h2",
  object,
  T
>;

/**
 * Props of {@link DialogDescription}.
 * @see {@link DialogDescription}
 * @since 1.0.0
 */
export type DialogDescriptionProps<T extends PolymorphicTarget = "p"> = PolymorphicProps<
  "p",
  object,
  T
>;

/**
 * Props of {@link DialogClose}.
 * @see {@link DialogClose}
 * @since 1.0.0
 */
export type DialogCloseProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/**
 * The accessible name of the dialog. Accessibility: renders an `h2` with an id; while it is mounted
 * the content's `aria-labelledby` points at it. It has no keys. To name a dialog without a visible
 * title, render the title inside `VisuallyHidden`.
 *
 * @param props See {@link DialogTitleProps}.
 * @returns The rendered heading.
 * @see {@link Dialog}
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function DeleteAccount() {
 *   return (
 *     <Dialog defaultOpen>
 *       <Dialog.Portal>
 *         <Dialog.Content>
 *           <Dialog.Title>Delete account</Dialog.Title>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @since 1.0.0
 */
export function DialogTitle<T extends PolymorphicTarget = "h2">(
  props: DialogTitleProps<T>,
): JsxChild {
  const context = dialogContext.use("Dialog.Title");
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
 * The accessible description of the dialog. Accessibility: renders a `p` with an id; while it is
 * mounted the content's `aria-describedby` points at it. It has no keys.
 *
 * @param props See {@link DialogDescriptionProps}.
 * @returns The rendered paragraph.
 * @see {@link Dialog}
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function IrreversibleAction() {
 *   return (
 *     <Dialog defaultOpen>
 *       <Dialog.Portal>
 *         <Dialog.Content>
 *           <Dialog.Title>Delete account</Dialog.Title>
 *           <Dialog.Description>This action cannot be undone.</Dialog.Description>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @since 1.0.0
 */
export function DialogDescription<T extends PolymorphicTarget = "p">(
  props: DialogDescriptionProps<T>,
): JsxChild {
  const context = dialogContext.use("Dialog.Description");
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
 * A button that closes the dialog. Keys: Enter and Space activate it (a native button click). It
 * renders a `button` with `type="button"`; pass `aria-label` when its text is not descriptive. A
 * veto with `preventDefault()` on its `click` keeps the dialog open.
 *
 * @param props See {@link DialogCloseProps}.
 * @returns The rendered button.
 * @see {@link Dialog}
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function CloseIconButton() {
 *   return (
 *     <Dialog defaultOpen>
 *       <Dialog.Portal>
 *         <Dialog.Content>
 *           <Dialog.Title>Hello</Dialog.Title>
 *           <Dialog.Close aria-label="Close">x</Dialog.Close>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @since 1.0.0
 */
export function DialogClose<T extends PolymorphicTarget = "button">(
  props: DialogCloseProps<T>,
): JsxChild {
  const context = dialogContext.use("Dialog.Close");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const merged = mergeElementProps({ type: "button" }, rest, {
    onClick: composeEventHandlers(
      () => own.onClick,
      () => context.setOpen(false),
    ),
  });
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
