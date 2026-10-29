import { type Accessor, batch, onCleanup, useSignal } from "@shadow-js/core";
import { createPartContext, type PartContext } from "../utils/index";
import {
  alignPosition,
  anchorPosition,
  clampPosition,
  edgesOf,
  type MessageAlign,
  type MessageBox,
  prependCorrection,
  spacerHeight,
  visibilityOf,
} from "./geometry";

/** Where the transcript opens. @since 1.0.0 */
export type MessageScrollPosition = "start" | "end" | "last-anchor";

/** The options of a jump to a message. @since 1.0.0 */
export interface MessageScrollToOptions {
  /** Where in the window the message is placed. @default "start" */
  readonly align?: MessageAlign | undefined;
  /** The native scroll behavior. @default "auto" */
  readonly behavior?: ScrollBehavior | undefined;
  /** The margin kept on the aligned edge. @default the provider's `scrollMargin` */
  readonly scrollMargin?: number | undefined;
}

/** What a message scroller's state reads from its props. @since 1.0.0 */
export interface MessageScrollerStateProps {
  readonly autoScroll?: boolean | undefined;
  readonly defaultScrollPosition?: MessageScrollPosition | undefined;
  readonly scrollEdgeThreshold?: number | undefined;
  readonly scrollMargin?: number | undefined;
  readonly scrollPreviousItemPeek?: number | undefined;
}

/** One row of the transcript, as an item registers it. @internal */
export interface ItemRecord {
  readonly element: HTMLElement;
  readonly id: () => string | undefined;
  readonly anchor: () => boolean;
  /** True until the first layout pass that follows its registration looked at it. */
  fresh: boolean;
}

/**
 * What every message scroller part reads from its provider. @internal
 * @see {@link MessageScroller}
 */
export interface MessageScrollerContextValue {
  readonly viewport: Accessor<HTMLElement | undefined>;
  readonly setViewport: (element: HTMLElement | undefined) => void;
  readonly content: Accessor<HTMLElement | undefined>;
  readonly setContent: (element: HTMLElement | undefined) => void;
  /** The height of the room kept below the last anchored turn, in pixels. */
  readonly spacer: Accessor<number>;
  /** The content hands over its spacer element, whose height the provider writes at once so the scroll height is right before the next scroll. */
  readonly setSpacerElement: (element: HTMLElement | undefined) => void;
  readonly start: Accessor<boolean>;
  readonly end: Accessor<boolean>;
  /** The value of `data-scrollable`: `"start"`, `"end"`, `"start end"` or `undefined`. */
  readonly scrollable: Accessor<string | undefined>;
  readonly autoscrolling: Accessor<boolean>;
  readonly pending: Accessor<boolean>;
  readonly registerItem: (record: ItemRecord) => () => void;
  readonly scrollToMessage: (id: string, options?: MessageScrollToOptions) => boolean;
  readonly scrollToEnd: (options?: MessageScrollToOptions) => boolean;
  readonly scrollToStart: (options?: MessageScrollToOptions) => boolean;
  /** The viewport tells the provider the window or the scroll position changed. */
  readonly noteScroll: () => void;
  /** The viewport tells the provider the reader scrolled by hand (wheel, touch, keys, scrollbar). */
  readonly noteUserInput: () => void;
  /** The content tells the provider rows were added, removed or resized. */
  readonly noteContentChange: () => void;
  /** Applies the opening position once the first rows are in. */
  readonly initialize: () => void;
  readonly setPreserveOnPrepend: (preserve: boolean) => void;
  readonly currentAnchorId: Accessor<string | null>;
  readonly visibleMessageIds: Accessor<readonly string[]>;
  /** A hook that reads the visibility calls this; the provider measures it only while someone does. Returns a release function. */
  readonly watchVisibility: () => () => void;
}

/**
 * The context a `MessageScroller.Provider` supplies to the frame, the viewport, the content, the rows, the button and the hooks. Reading it anywhere
 * else throws. Accessibility: the context carries no ARIA of its own.
 *
 * @example
 * import { messageScrollerContext } from "@shadow-js/primitives";
 *
 * export function EndFlag() {
 *   const scroller = messageScrollerContext.use("EndFlag");
 *   return <span>{scroller.end() ? "more below" : "at the end"}</span>;
 * }
 * @see {@link MessageScroller}
 * @since 1.0.0
 */
export const messageScrollerContext: PartContext<MessageScrollerContextValue> =
  createPartContext<MessageScrollerContextValue>("MessageScroller");

const DEFAULT_THRESHOLD = 8;
const DEFAULT_PEEK = 64;

/** Whether two lists hold the same strings in the same order. */
function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Builds the state of a message scroller: what is scrolled, which rows exist, whether the reader follows the newest text, and the room kept below the
 * last anchored turn. Call it once, in the provider's setup. It reads the props lazily, so they can change.
 *
 * @param props - The provider's behavior props.
 * @returns The context value to provide to the parts.
 * @example
 * import { createMessageScrollerContext } from "@shadow-js/primitives";
 *
 * export function Shell(props: { readonly autoScroll?: boolean }) {
 *   const scroller = createMessageScrollerContext(props);
 *   return <span>{scroller.pending() ? "opening" : "open"}</span>;
 * }
 * @see {@link MessageScroller}
 * @since 1.0.0
 */
export function createMessageScrollerContext(
  props: MessageScrollerStateProps,
): MessageScrollerContextValue {
  const [viewport, setViewportSignal] = useSignal<HTMLElement | undefined>(undefined);
  const [content, setContentSignal] = useSignal<HTMLElement | undefined>(undefined);
  const [spacer, setSpacer] = useSignal(0);
  const [start, setStart] = useSignal(false);
  const [end, setEnd] = useSignal(false);
  const [autoscrolling, setAutoscrolling] = useSignal(false);
  const position = (): MessageScrollPosition => props.defaultScrollPosition ?? "end";
  const [pending, setPending] = useSignal(position() !== "start");
  const [currentAnchorId, setCurrentAnchorId] = useSignal<string | null>(null);
  const [visibleMessageIds, setVisibleMessageIds] = useSignal<readonly string[]>([], {
    equals: sameList,
  });

  let spacerElement: HTMLElement | undefined;
  const records = new Set<ItemRecord>();
  const byElement = new Map<HTMLElement, ItemRecord>();
  // A lookup cache, not the truth: a row's id can change while its element stays (a temporary id
  // replaced by the server's), so `recordById` checks the hit and scans the rows on a miss.
  const byId = new Map<string, ItemRecord>();
  const recordById = (id: string): ItemRecord | undefined => {
    const cached = byId.get(id);
    if (cached !== undefined && cached.id() === id) return cached;
    byId.delete(id);
    for (const record of records) {
      if (record.id() !== id) continue;
      byId.set(id, record);
      return record;
    }
    return undefined;
  };
  /** The one jump that waits for its row to mount: a second request replaces it, so the wait never grows. */
  let queuedJump:
    | { readonly id: string; readonly options: MessageScrollToOptions | undefined }
    | undefined;
  let following = props.autoScroll === true;
  let userIntent = false;
  let initialized = false;
  let preserve = true;
  let reference:
    | { readonly element: HTMLElement; readonly id: string | undefined; readonly offset: number }
    | undefined;
  let watchers = 0;
  let changeQueued = false;
  let target: number | undefined;

  const margin = (override?: number): number => override ?? props.scrollMargin ?? 0;
  const peek = (): number => props.scrollPreviousItemPeek ?? DEFAULT_PEEK;
  const threshold = (): number => props.scrollEdgeThreshold ?? DEFAULT_THRESHOLD;

  const boxOf = (element: HTMLElement, root: HTMLElement): { top: number; height: number } => {
    const outer = root.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return { top: rect.top - outer.top + root.scrollTop, height: rect.height };
  };

  /** The rows in the content, nearest the end first: where the last anchor and the last row are. Anything in the content that is not a row is skipped. */
  const rowsFromEnd = (): HTMLElement[] => {
    const root = content();
    if (root === undefined) return [];
    const rows: HTMLElement[] = [];
    for (let index = root.children.length - 1; index >= 0; index -= 1) {
      const child = root.children.item(index);
      if (child instanceof HTMLElement && byElement.has(child)) rows.push(child);
    }
    return rows;
  };
  const recordOf = (element: HTMLElement): ItemRecord | undefined => byElement.get(element);

  const lastAnchor = (): HTMLElement | undefined => {
    const root = content();
    if (root === undefined) return undefined;
    for (let index = root.children.length - 1; index >= 0; index -= 1) {
      const child = root.children.item(index);
      if (!(child instanceof HTMLElement)) continue;
      const record = recordOf(child);
      if (record?.anchor() === true) return child;
    }
    return undefined;
  };

  const lastRow = (): HTMLElement | undefined => {
    const root = content();
    if (root === undefined) return undefined;
    for (let index = root.children.length - 1; index >= 0; index -= 1) {
      const child = root.children.item(index);
      if (child instanceof HTMLElement && byElement.has(child)) return child;
    }
    return undefined;
  };

  /** The distance from the top of the content to the bottom of the real content. */
  const contentBottom = (root: HTMLElement): number => {
    const last = lastRow();
    if (last === undefined) return 0;
    const box = boxOf(last, root);
    return box.top + box.height;
  };

  const metrics = (root: HTMLElement) => ({
    scrollTop: root.scrollTop,
    clientHeight: root.clientHeight,
    scrollHeight: root.scrollHeight,
    spacer: spacer(),
  });

  /** The first row whose bottom is below the top of the window, found by halving, so a long transcript costs a few probes. */
  const firstVisibleRow = (root: HTMLElement, rootBox: HTMLElement): HTMLElement | undefined => {
    const rows = rowsFromEnd().reverse();
    let low = 0;
    let high = rows.length - 1;
    let found: HTMLElement | undefined;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const row = rows[middle];
      if (row === undefined) break;
      const box = boxOf(row, rootBox);
      if (box.top + box.height > root.scrollTop) {
        found = row;
        high = middle - 1;
      } else low = middle + 1;
    }
    return found;
  };

  const remember = (root: HTMLElement): void => {
    const row = firstVisibleRow(root, root);
    reference =
      row === undefined
        ? undefined
        : { element: row, id: recordOf(row)?.id(), offset: boxOf(row, root).top - root.scrollTop };
  };

  const updateSpacer = (root: HTMLElement): void => {
    const anchor = lastAnchor();
    const height =
      anchor === undefined
        ? 0
        : Math.round(
            spacerHeight(
              root.clientHeight,
              boxOf(anchor, root).top,
              contentBottom(root),
              margin(),
              peek(),
            ),
          );
    // Written at once, not through the next render, so the scroll height is right for the scroll that follows.
    if (spacerElement !== undefined) spacerElement.style.blockSize = `${height}px`;
    setSpacer(height);
  };

  const measureVisibility = (root: HTMLElement): void => {
    if (watchers === 0) return;
    const boxes: MessageBox[] = [];
    const rows = rowsFromEnd().reverse();
    for (const row of rows) {
      const record = recordOf(row);
      const id = record?.id();
      if (record === undefined || id === undefined) continue;
      const box = boxOf(row, root);
      boxes.push({ id, anchor: record.anchor(), top: box.top, bottom: box.top + box.height });
    }
    const result = visibilityOf(boxes, root.scrollTop, root.clientHeight);
    batch(() => {
      setCurrentAnchorId(result.currentAnchorId);
      setVisibleMessageIds(result.visibleMessageIds);
    });
  };

  const measure = (): void => {
    const root = viewport();
    if (root === undefined) return;
    const edges = edgesOf(metrics(root), threshold());
    batch(() => {
      setStart(edges.start);
      setEnd(edges.end);
    });
    measureVisibility(root);
  };

  const scrollToPosition = (root: HTMLElement, top: number, behavior: ScrollBehavior): void => {
    const clamped = clampPosition(top, root);
    userIntent = false;
    setAutoscrolling(true);
    if (behavior === "smooth" && typeof root.scrollTo === "function") {
      target = clamped;
      root.scrollTo({ top: clamped, behavior });
    } else {
      target = undefined;
      root.scrollTop = clamped;
      setAutoscrolling(false);
    }
    remember(root);
    measure();
  };

  const liveEdgeGap = (root: HTMLElement): number =>
    root.scrollHeight - spacer() - (root.scrollTop + root.clientHeight);

  const jumpTo = (id: string, options: MessageScrollToOptions | undefined): boolean => {
    const root = viewport();
    if (root === undefined) return false;
    const record = recordById(id);
    following = false;
    if (record === undefined) {
      queuedJump = { id, options };
      return true;
    }
    queuedJump = undefined;
    const box = boxOf(record.element, root);
    scrollToPosition(
      root,
      alignPosition(options?.align ?? "start", box, root, margin(options?.scrollMargin)),
      options?.behavior ?? "auto",
    );
    return true;
  };

  const applyChange = (): void => {
    changeQueued = false;
    const root = viewport();
    if (root === undefined || content() === undefined) return;
    // Rows added above what the reader is looking at must not move it.
    // The row is found again by its id when a list that does not keep elements has made new ones for the same messages.
    const watched =
      reference === undefined
        ? undefined
        : reference.element.isConnected
          ? reference.element
          : recordById(reference.id ?? "")?.element;
    if (preserve && reference !== undefined && watched !== undefined) {
      const correction = prependCorrection(
        reference.offset,
        boxOf(watched, root).top - root.scrollTop,
      );
      if (correction !== 0) root.scrollTop = clampPosition(root.scrollTop + correction, root);
    }
    updateSpacer(root);
    let fresh: ItemRecord | undefined;
    for (const record of records) {
      if (record.fresh && record.anchor()) fresh = record;
      record.fresh = false;
    }
    if (queuedJump !== undefined && recordById(queuedJump.id) !== undefined) {
      const queued = queuedJump;
      jumpTo(queued.id, queued.options);
      return;
    }
    if (initialized && fresh !== undefined) {
      // A new turn starts: put it near the top, with a sliver of the turn before it above.
      scrollToPosition(
        root,
        anchorPosition(boxOf(fresh.element, root).top, margin(), peek()),
        "auto",
      );
      following = props.autoScroll === true;
      return;
    }
    if (props.autoScroll === true && following && liveEdgeGap(root) > 0) {
      scrollToPosition(root, root.scrollTop + liveEdgeGap(root), "auto");
      return;
    }
    remember(root);
    measure();
  };

  const noteContentChange = (): void => {
    if (changeQueued) return;
    changeQueued = true;
    queueMicrotask(applyChange);
  };

  const initialize = (): void => {
    const root = viewport();
    if (root === undefined || initialized) return;
    const rows = rowsFromEnd();
    initialized = true;
    for (const record of records) record.fresh = false;
    if (rows.length > 0) {
      updateSpacer(root);
      const bottom = contentBottom(root);
      const real = Math.max(0, bottom - root.clientHeight);
      if (position() === "end") scrollToPosition(root, real, "auto");
      else if (position() === "last-anchor") {
        const anchor = lastAnchor();
        const top = anchor === undefined ? undefined : boxOf(anchor, root).top;
        if (top === undefined || bottom - top <= root.clientHeight)
          scrollToPosition(root, real, "auto");
        else scrollToPosition(root, anchorPosition(top, margin(), peek()), "auto");
      }
    }
    setPending(false);
    remember(root);
    measure();
  };

  const registerItem = (record: ItemRecord): (() => void) => {
    records.add(record);
    byElement.set(record.element, record);
    const id = record.id();
    if (id !== undefined) byId.set(id, record);
    noteContentChange();
    return () => {
      records.delete(record);
      byElement.delete(record.element);
      const registered = record.id();
      if (registered !== undefined && byId.get(registered) === record) byId.delete(registered);
      noteContentChange();
    };
  };

  const view: MessageScrollerContextValue = {
    viewport,
    setSpacerElement: (element) => {
      spacerElement = element;
    },
    setViewport: (element) => setViewportSignal(() => element),
    content,
    setContent: (element) => setContentSignal(() => element),
    spacer,
    start,
    end,
    scrollable: () => (start() ? (end() ? "start end" : "start") : end() ? "end" : undefined),
    autoscrolling,
    pending,
    registerItem,
    scrollToMessage: jumpTo,
    scrollToEnd: (options) => {
      const root = viewport();
      if (root === undefined) return false;
      following = false;
      scrollToPosition(root, contentBottom(root) - root.clientHeight, options?.behavior ?? "auto");
      return true;
    },
    scrollToStart: (options) => {
      const root = viewport();
      if (root === undefined) return false;
      following = false;
      scrollToPosition(root, 0, options?.behavior ?? "auto");
      return true;
    },
    noteScroll: () => {
      const root = viewport();
      if (root === undefined) return;
      if (userIntent) {
        following = props.autoScroll === true && liveEdgeGap(root) <= threshold();
        userIntent = false;
        setAutoscrolling(false);
        queuedJump = undefined;
      } else if (target !== undefined && Math.abs(root.scrollTop - target) < 1.5) {
        target = undefined;
        setAutoscrolling(false);
        if (props.autoScroll === true && liveEdgeGap(root) <= threshold()) following = true;
      }
      remember(root);
      measure();
    },
    noteUserInput: () => {
      userIntent = true;
      target = undefined;
    },
    noteContentChange,
    initialize,
    setPreserveOnPrepend: (value) => {
      preserve = value;
    },
    currentAnchorId,
    visibleMessageIds,
    watchVisibility: () => {
      watchers += 1;
      const root = viewport();
      if (root !== undefined) measureVisibility(root);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        watchers -= 1;
      };
    },
  };
  onCleanup(() => {
    records.clear();
    byElement.clear();
    byId.clear();
    queuedJump = undefined;
    reference = undefined;
  });
  return view;
}
