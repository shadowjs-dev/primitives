/**
 * Context for compound components. A part that needs its root throws a message that names both
 * ("`<Dialog.Trigger>` must be used within `<Dialog>`") instead of the generic missing-context error.
 * @packageDocumentation
 */
import { createContext, useContext } from "@shadow-js/core";
import { ShadowError } from "@shadow-js/core/extend";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";

/**
 * The provider and the readers of a compound component's context, created by
 * {@link createPartContext}. The context carries no keyboard or ARIA behavior of its own; the parts
 * that read it provide that.
 * @typeParam T The context value.
 * @see {@link createPartContext}
 * @since 1.0.0
 */
export interface PartContext<T> {
  /** Provides `value` to every part rendered inside. The value is read once: provide accessors for reactive state. */
  readonly Provider: (props: { readonly value: T; readonly children?: JsxChild }) => JsxChild;
  /**
   * Reads the value; throws a readable error when the part is used outside its root.
   * @param part The calling part, e.g. `"Dialog.Trigger"`.
   * @returns The provided value.
   * @throws Error when no root provides the value, with the message `[primitives] <part> must be used within <root>.`
   */
  use(part: string): T;
  /** Reads the value, or `undefined` when there is no provider (for parts that work standalone). */
  useOptional(): T | undefined;
}

/**
 * Creates the context of a compound component. A part that calls `use` throws a message that names
 * both the part and the root when no root is above it. The factory itself throws nothing.
 *
 * @param root The root component's name, used in the error message, e.g. `"Dialog"`.
 * @returns The provider and readers.
 * @example
 * import { createPartContext } from "@shadow-js/primitives";
 *
 * interface DialogContext {
 *   readonly open: () => boolean;
 * }
 *
 * const dialog = createPartContext<DialogContext>("Dialog");
 *
 * // In the root: <dialog.Provider value={{ open }}>{props.children}</dialog.Provider>
 * export function DialogTrigger() {
 *   const ctx = dialog.use("Dialog.Trigger");
 *   return <button aria-expanded={ctx.open() ? "true" : "false"} />;
 * }
 * @see {@link PartContext}
 * @since 1.0.0
 */
export function createPartContext<T>(root: string): PartContext<T> {
  const context = createContext<T>(undefined, { name: root });
  const read = (): T | undefined => {
    try {
      return useContext(context);
    } catch (error) {
      if (error instanceof ShadowError && error.code === "CONTEXT_MISSING") return undefined;
      throw error;
    }
  };
  return {
    Provider: context.Provider as PartContext<T>["Provider"],
    use(part: string): T {
      const value = read();
      if (value === undefined) {
        throw new Error(
          __DEV__ ? `[primitives] <${part}> must be used within <${root}>.` : "PRIMITIVES_CONTEXT",
        );
      }
      return value;
    },
    useOptional: read,
  };
}
