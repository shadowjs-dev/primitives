import { type Accessor, onMount, useSignal } from "@shadow-js/core";
import {
  createPartContext,
  type PartContext,
  partId,
  useBaseId,
  useControllableState,
} from "../utils/index";
import { useFirstRenderFlag } from "./mount-animation";

/**
 * What the state of a collapsible needs from its props. @internal
 * @see {@link Collapsible}
 */
export interface CollapsibleStateProps {
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly disabled?: boolean | undefined;
}

/**
 * What every collapsible part reads from its root. @internal
 * @see {@link Collapsible}
 */
export interface CollapsibleContextValue {
  readonly open: Accessor<boolean>;
  readonly setOpen: (open: boolean) => void;
  readonly disabled: Accessor<boolean>;
  /** The id content gets unless the application passes its own. */
  readonly contentId: Accessor<string>;
  /** The id of the content that is mounted right now (it may be an application id), or undefined. */
  readonly mountedContentId: Accessor<string | undefined>;
  /** False until the root has mounted, after which every content that renders has registered. Tracked. */
  readonly settled: Accessor<boolean>;
  readonly setMountedContentId: (id: string | undefined) => void;
  /** False until the root's first render finished. Read once, not tracked. */
  readonly ready: () => boolean;
}

/**
 * The context a `Collapsible` root provides to its trigger and content. Read it in a custom part
 * rendered inside the root; reading it anywhere else throws. Accessibility: the context carries no
 * ARIA of its own; the built-in trigger uses it for `aria-expanded` and `aria-controls`.
 *
 * @example
 * import { collapsibleContext } from "@shadow-js/primitives";
 *
 * export function OpenFlag() {
 *   const root = collapsibleContext.use("OpenFlag");
 *   return <span>{root.open() ? "open" : "closed"}</span>;
 * }
 * @see {@link Collapsible}
 * @since 1.0.0
 */
export const collapsibleContext: PartContext<CollapsibleContextValue> =
  createPartContext<CollapsibleContextValue>("Collapsible");

/**
 * Builds the state shared by a collapsible root (and by every accordion item). Call it once, in the
 * root's setup: it creates the controllable open state, the base id and the first-render flag.
 *
 * @param props The open, default open, change callback and disabled props of the root.
 * @returns The context value to provide to the parts.
 * @example
 * import { createCollapsibleContext } from "@shadow-js/primitives";
 *
 * export function Shell(props: { readonly defaultOpen?: boolean }) {
 *   const state = createCollapsibleContext({ defaultOpen: props.defaultOpen });
 *   return <span>{state.open() ? "open" : "closed"}</span>;
 * }
 * @see {@link Collapsible}
 * @since 1.0.0
 */
export function createCollapsibleContext(props: CollapsibleStateProps): CollapsibleContextValue {
  const [open, setOpenState] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => props.onOpenChange,
    name: "Collapsible open",
  });
  const base = useBaseId();
  const [mounted, setMounted] = useSignal<string | undefined>(undefined);
  const [settled, setSettled] = useSignal(false);
  onMount(() => {
    setSettled(true);
  });
  return {
    open,
    setOpen: (next) => setOpenState(next),
    disabled: () => props.disabled === true,
    contentId: () => partId(base(), "content"),
    mountedContentId: mounted,
    settled,
    setMountedContentId: (id) => setMounted(() => id),
    ready: useFirstRenderFlag(),
  };
}
