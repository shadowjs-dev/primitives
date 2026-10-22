import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createToastProviderContext,
  type ToastProviderProps,
  toastProviderContext,
} from "./context";

/**
 * Shares the defaults (duration, swipe direction and threshold, region label) and the pause state with the viewport and the toasts below it. It renders no element of its own and has no keys or ARIA: the region and the toasts carry the keyboard and ARIA contract (see {@link ToastViewport} and {@link ToastRoot}). Put it near the root of the application, around the viewport and anything that creates toasts.
 *
 * @param props See {@link ToastProviderProps}.
 * @returns The children, rendered without an element of the provider's own.
 * @example
 * import { Toast } from "@shadow-js/primitives";
 *
 * export function App() {
 *   return (
 *     <Toast.Provider label="Notifications" duration={6000} swipeDirection="right">
 *       <main>Content</main>
 *       <Toast.Viewport />
 *     </Toast.Provider>
 *   );
 * }
 * @see {@link ToastProviderProps}
 * @see {@link ToastViewport}
 * @since 1.0.0
 */
export function ToastProvider(props: ToastProviderProps): JsxChild {
  const context = createToastProviderContext(props);
  return (
    <toastProviderContext.Provider value={context}>{props.children}</toastProviderContext.Provider>
  );
}
