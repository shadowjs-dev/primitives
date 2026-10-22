/**
 * The one place where a part's typed props meet the loose shape `splitProps` needs.
 *
 * A polymorphic part is typed with its own props plus `as` and any extra keys the application may
 * pass. TypeScript cannot express "these keys are the part's own, the rest is forwarded" for the
 * generic `as` target, so every part splits its props with a loose view of the same object. The
 * view is a cast of the same reference, not a copy: reads and reactivity behave exactly as before.
 * Keeping the cast here means a reviewer audits one line instead of one per part.
 * @internal
 */
export function partProps<
  T extends object = { readonly as?: unknown; readonly [prop: string]: unknown },
>(props: object): T {
  return props as T;
}
