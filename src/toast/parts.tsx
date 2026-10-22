import { splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { ANNOUNCE_ALT_ATTRIBUTE, ANNOUNCE_EXCLUDE_ATTRIBUTE } from "./announce-text";
import { toastContext } from "./context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link ToastTitle}: the attributes of the element it renders, a `div` unless `as` says otherwise.
 * @since 1.0.0
 * @see {@link ToastTitle}
 */
export type ToastTitleProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Props of {@link ToastDescription}: the attributes of the element it renders, a `div` unless `as` says otherwise.
 * @since 1.0.0
 * @see {@link ToastDescription}
 */
export type ToastDescriptionProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * Props of {@link ToastClose}: the attributes of the button it renders, which `as` can replace.
 * @since 1.0.0
 * @see {@link ToastClose}
 */
export type ToastCloseProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/**
 * Own props of {@link ToastAction}. The button sets `type="button"`, `data-toast-announce-exclude` (value `""`) and `data-toast-announce-alt` (the `altText`). When the toast is announced, the button's own text is replaced by `altText`, so "Undo" is read as "Undo the deletion". Enter and Space activate it as a native button.
 * @since 1.0.0
 * @see {@link ToastAction}
 */
export interface ToastActionOwnProps {
  /**
   * What a screen reader is told instead of the button's own text when the toast is announced, phrased so it makes sense on its own: "Undo" becomes "Undo the deletion". Required by the type. An empty value warns in development (`[primitives TOAST_ACTION_ALT_TEXT]`), and the button then adds nothing to the announcement.
   * @default none (required)
   */
  readonly altText: string;
}

/**
 * Props of {@link ToastAction}: the attributes of the button it renders, plus {@link ToastActionOwnProps}.
 * @since 1.0.0
 * @see {@link ToastAction}
 */
export type ToastActionProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  ToastActionOwnProps,
  T
>;

/**
 * The headline of the toast, rendered as a `div` unless `as` says otherwise. Its text is part of the announcement when the toast opens. It has no keys and sets no ARIA attributes of its own.
 *
 * @param props See {@link ToastTitleProps}.
 * @returns The title element.
 * @throws Error when rendered outside a `Toast`, with the message `[primitives] <Toast.Title> must be used within <Toast>.`
 * @example
 * import { Toast } from "@shadow-js/primitives";
 *
 * export function EventCreated() {
 *   return (
 *     <Toast.Provider>
 *       <Toast.Viewport />
 *       <Toast>
 *         <Toast.Title>Event created</Toast.Title>
 *       </Toast>
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link ToastTitleProps}
 * @see {@link ToastRoot}
 * @since 1.0.0
 */
export function ToastTitle<T extends PolymorphicTarget = "div">(
  props: ToastTitleProps<T>,
): JsxChild {
  toastContext.use("Toast.Title");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(rest);
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * The details of the toast, rendered as a `div` unless `as` says otherwise. Its text is part of the announcement when the toast opens. It has no keys and sets no ARIA attributes of its own.
 *
 * @param props See {@link ToastDescriptionProps}.
 * @returns The description element.
 * @throws Error when rendered outside a `Toast`, with the message `[primitives] <Toast.Description> must be used within <Toast>.`
 * @example
 * import { Toast } from "@shadow-js/primitives";
 *
 * export function ScheduledDetails() {
 *   return (
 *     <Toast.Provider>
 *       <Toast.Viewport />
 *       <Toast>
 *         <Toast.Title>Scheduled</Toast.Title>
 *         <Toast.Description>Friday at 5:00 PM</Toast.Description>
 *       </Toast>
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link ToastDescriptionProps}
 * @see {@link ToastRoot}
 * @since 1.0.0
 */
export function ToastDescription<T extends PolymorphicTarget = "div">(
  props: ToastDescriptionProps<T>,
): JsxChild {
  toastContext.use("Toast.Description");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(rest);
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * A button that closes the toast when activated. Its content (an icon, "x") is left out of the announcement, so give it an `aria-label`. The button sets `type="button"` and `data-toast-announce-exclude` (value `""`). Enter and Space activate it as a native button. Closing while focus is inside the toast moves focus to the viewport region.
 *
 * @param props See {@link ToastCloseProps}.
 * @returns The close button.
 * @throws Error when rendered outside a `Toast`, with the message `[primitives] <Toast.Close> must be used within <Toast>.`
 * @example
 * import { Toast } from "@shadow-js/primitives";
 *
 * export function Dismissible() {
 *   return (
 *     <Toast.Provider>
 *       <Toast.Viewport />
 *       <Toast>
 *         <Toast.Title>Saved</Toast.Title>
 *         <Toast.Close aria-label="Dismiss">x</Toast.Close>
 *       </Toast>
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link ToastCloseProps}
 * @see {@link ToastRoot}
 * @since 1.0.0
 */
export function ToastClose<T extends PolymorphicTarget = "button">(
  props: ToastCloseProps<T>,
): JsxChild {
  const context = toastContext.use("Toast.Close");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const merged = mergeElementProps({ type: "button", [ANNOUNCE_EXCLUDE_ATTRIBUTE]: "" }, rest, {
    onClick: composeEventHandlers(
      () => own.onClick,
      () => context.close(),
    ),
  });
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * A button inside the toast for an action related to it (undo, view). It runs `onClick` and then closes the toast, unless `onClick` calls `preventDefault()`. Keyboard: Enter and Space activate it as a native button, and closing while focus is inside the toast moves focus to the viewport region. ARIA: the button sets `type="button"`, `data-toast-announce-exclude` (value `""`) and `data-toast-announce-alt` (its `altText`), which replaces its text in the announcement.
 *
 * @param props See {@link ToastActionProps}.
 * @returns The action button.
 * @throws Error when rendered outside a `Toast`, with the message `[primitives] <Toast.Action> must be used within <Toast>.`
 * @example
 * import { Toast } from "@shadow-js/primitives";
 *
 * export function Deleted() {
 *   const undo = (): void => {
 *     // Restore the deleted item here.
 *   };
 *   return (
 *     <Toast.Provider>
 *       <Toast.Viewport />
 *       <Toast>
 *         <Toast.Title>Item deleted</Toast.Title>
 *         <Toast.Action altText="Undo the deletion" onClick={undo}>
 *           Undo
 *         </Toast.Action>
 *       </Toast>
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link ToastActionProps}
 * @see {@link ToastActionOwnProps}
 * @see {@link ToastRoot}
 * @since 1.0.0
 */
export function ToastAction<T extends PolymorphicTarget = "button">(
  props: ToastActionProps<T>,
): JsxChild {
  const context = toastContext.use("Toast.Action");
  const [own, rest] = splitProps(partProps<Loose & ToastActionOwnProps>(props), [
    "as",
    "altText",
    "onClick",
  ]);
  if (__DEV__) {
    const alt: unknown = untrack(() => own.altText);
    if (typeof alt !== "string" || alt.trim() === "") {
      console.warn(
        "[primitives TOAST_ACTION_ALT_TEXT] <Toast.Action> needs a non-empty `altText`: it is what screen readers announce in place of the button.",
      );
    }
  }
  const merged = mergeElementProps(
    {
      type: "button",
      [ANNOUNCE_EXCLUDE_ATTRIBUTE]: "",
      get [ANNOUNCE_ALT_ATTRIBUTE]() {
        return own.altText;
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick,
        () => context.close(),
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
